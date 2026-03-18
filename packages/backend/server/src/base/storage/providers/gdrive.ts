/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Readable } from 'node:stream';

import { Injectable, Logger } from '@nestjs/common';
import { drive_v3, google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

import {
  BlobInputType,
  GetObjectMetadata,
  ListObjectsMetadata,
  PutObjectMetadata,
  StorageProvider,
} from './provider';
import { toBuffer } from './utils';

export interface GDriveStorageConfig {
  /**
   * Folder ID in Google Drive where files will be stored
   * If not provided, files will be stored in the root of My Drive
   */
  folderId?: string;

  /**
   * Whether to use service account authentication
   * If false, will use OAuth2 client credentials
   */
  useServiceAccount?: boolean;

  /**
   * Service account credentials (JSON string or object)
   * Required when useServiceAccount is true
   */
  credentials?: {
    client_email?: string;
    private_key?: string;
    project_id?: string;
  };

  /**
   * OAuth2 client credentials for user authentication
   * Required when useServiceAccount is false
   */
  oauth?: {
    clientId: string;
    clientSecret: string;
    refreshToken?: string;
    accessToken?: string;
  };

  /**
   * Share files with a specific domain or make them publicly accessible
   */
  sharing?: {
    /**
     * Make files publicly accessible via anyone with the link
     */
    public?: boolean;

    /**
     * Domain to share files with (for Google Workspace)
     */
    domain?: string;
  };
}

// File metadata cache for performance
interface FileMetadataCache {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: Date;
  size?: number;
  webViewLink?: string;
  webContentLink?: string;
}

@Injectable()
export class GDriveStorageProvider implements StorageProvider {
  protected readonly logger: Logger;
  private readonly drive: drive_v3.Drive;
  private readonly folderId?: string;
  private readonly sharing: GDriveStorageConfig['sharing'];
  private readonly auth: GoogleAuth;
  private metadataCache: Map<string, FileMetadataCache> = new Map();

  constructor(
    config: GDriveStorageConfig,
    public readonly bucket: string
  ) {
    this.folderId = config.folderId;
    this.sharing = config.sharing;

    // Set up authentication
    if (config.useServiceAccount && config.credentials) {
      // Service account authentication
      this.auth = new GoogleAuth({
        credentials: {
          client_email: config.credentials.client_email,
          private_key: config.credentials.private_key,
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
    } else if (config.oauth) {
      // OAuth2 authentication
      this.auth = new GoogleAuth({
        credentials: {
          client_email: config.oauth.clientId,
          private_key: config.oauth.clientSecret,
        },
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
    } else {
      // Default to application default credentials
      this.auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
    }

    this.drive = google.drive({ version: 'v3', auth: this.auth });
    this.logger = new Logger(`${GDriveStorageProvider.name}:${bucket}`);

    // Ensure folder exists if specified
    if (this.folderId) {
      this.verifyFolder(this.folderId).catch(err => {
        this.logger.warn(
          `Failed to verify folder ${this.folderId}: ${err.message}`
        );
      });
    }
  }

  private async verifyFolder(folderId: string): Promise<void> {
    try {
      await this.drive.files.get({
        fileId: folderId,
        fields: 'id,mimeType',
      });
      this.logger.log(`Verified folder: ${folderId}`);
    } catch (err: any) {
      if (err.code === 404) {
        throw new Error(
          `Google Drive folder not found: ${folderId}. Please check the folder ID or create it first.`
        );
      }
      throw err;
    }
  }

  private async findFileByName(
    name: string,
    folderId?: string
  ): Promise<string | null> {
    try {
      const query = [`name='${name.replace(/'/g, "\\'")}'`, 'trashed=false'];
      if (folderId) {
        query.push(`'${folderId}' in parents`);
      } else {
        // Search in root
        query.push("'root' in parents");
      }

      const response = await this.drive.files.list({
        q: query.join(' and '),
        fields: 'files(id,name,modifiedTime,size,webViewLink,webContentLink,mimeType)',
        pageSize: 1,
      });

      if (response.data.files && response.data.files.length > 0) {
        const file = response.data.files[0];
        // Cache the metadata
        this.metadataCache.set(name, {
          id: file.id!,
          name: file.name!,
          mimeType: file.mimeType!,
          modifiedTime: new Date(file.modifiedTime!),
          size: file.size ? parseInt(file.size, 10) : undefined,
          webViewLink: file.webViewLink ?? undefined,
          webContentLink: file.webContentLink ?? undefined,
        });
        return file.id!;
      }
      return null;
    } catch (err: any) {
      this.logger.error(`Error finding file: ${err.message}`);
      return null;
    }
  }

  private async createFolder(path: string): Promise<string> {
    const parts = path.split('/').filter(Boolean);
    let currentFolderId = this.folderId || 'root';

    for (const part of parts) {
      const existingFolder = await this.findFileByName(part, currentFolderId);
      if (existingFolder) {
        currentFolderId = existingFolder;
      } else {
        const folder = await this.drive.files.create({
          requestBody: {
            name: part,
            mimeType: 'application/vnd.google-apps.folder',
            parents: currentFolderId !== 'root' ? [currentFolderId] : undefined,
          },
          fields: 'id',
        });
        currentFolderId = folder.data.id!;
      }
    }

    return currentFolderId;
  }

  async put(
    key: string,
    body: BlobInputType,
    metadata: PutObjectMetadata = {}
  ): Promise<void> {
    try {
      const buffer = await toBuffer(body);
      const parts = key.split('/');
      const fileName = parts.pop() || key;
      let folderId = this.folderId;

      // Create nested folders if needed
      if (parts.length > 0) {
        folderId = await this.createFolder(parts.join('/'));
      }

      // Check if file exists and update it
      const existingFileId = await this.findFileByName(fileName, folderId);

      const media = {
        mimeType: metadata.contentType || 'application/octet-stream',
        body: Readable.from(buffer),
      };

      const fileMetadata: drive_v3.Schema$File = {
        name: fileName,
        mimeType: metadata.contentType || undefined,
      };

      if (folderId && folderId !== 'root') {
        fileMetadata.parents = [folderId];
      }

      if (existingFileId) {
        // Update existing file
        await this.drive.files.update({
          fileId: existingFileId,
          requestBody: fileMetadata,
          media: media,
        });
        this.logger.verbose(`Updated file \`${key}\``);
      } else {
        // Create new file
        const file = await this.drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id',
        });

        // Apply sharing settings
        if (this.sharing?.public) {
          await this.drive.permissions.create({
            fileId: file.data.id!,
            requestBody: {
              role: 'reader',
              type: 'anyone',
            },
          });
        }

        this.logger.verbose(`Created file \`${key}\``);
      }
    } catch (err: any) {
      this.logger.error(`Failed to put file \`${key}\`: ${err.message}`);
      throw err;
    }
  }

  async head(key: string): Promise<GetObjectMetadata | undefined> {
    try {
      const parts = key.split('/');
      const fileName = parts.pop() || key;
      let folderId = this.folderId;

      // Navigate to the correct folder
      if (parts.length > 0) {
        const foundFolderId = await this.findFileByName(parts[0], this.folderId);
        if (!foundFolderId) {
          return undefined;
        }
        folderId = foundFolderId;
      }

      const fileId = await this.findFileByName(fileName, folderId);
      if (!fileId) {
        this.logger.verbose(`File \`${key}\` not found`);
        return undefined;
      }

      const file = await this.drive.files.get({
        fileId,
        fields: 'id,name,mimeType,modifiedTime,size,webViewLink,webContentLink',
      });

      return {
        contentType: file.data.mimeType || 'application/octet-stream',
        contentLength: file.data.size
          ? parseInt(file.data.size, 10)
          : 0,
        lastModified: new Date(file.data.modifiedTime || Date.now()),
      };
    } catch (err: any) {
      this.logger.error(`Failed to head file \`${key}\`: ${err.message}`);
      return undefined;
    }
  }

  async get(
    key: string,
    signedUrl?: boolean
  ): Promise<{
    body?: Readable;
    metadata?: GetObjectMetadata;
    redirectUrl?: string;
  }> {
    try {
      const parts = key.split('/');
      const fileName = parts.pop() || key;
      let folderId = this.folderId;

      // Navigate to the correct folder
      if (parts.length > 0) {
        const foundFolderId = await this.findFileByName(parts[0], this.folderId);
        if (!foundFolderId) {
          return {};
        }
        folderId = foundFolderId;
      }

      const fileId = await this.findFileByName(fileName, folderId);
      if (!fileId) {
        this.logger.verbose(`File \`${key}\` not found`);
        return {};
      }

      const file = await this.drive.files.get({
        fileId,
        fields: 'id,name,mimeType,modifiedTime,size,webViewLink,webContentLink',
      });

      // If signedUrl is requested, return the webContentLink
      if (signedUrl && file.data.webContentLink) {
        return {
          redirectUrl: file.data.webContentLink,
          metadata: {
            contentType: file.data.mimeType || 'application/octet-stream',
            contentLength: file.data.size
              ? parseInt(file.data.size, 10)
              : 0,
            lastModified: new Date(file.data.modifiedTime || Date.now()),
          },
        };
      }

      // Otherwise, return the file content as a stream
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      return {
        body: response.data as unknown as Readable,
        metadata: {
          contentType: file.data.mimeType || 'application/octet-stream',
          contentLength: file.data.size
            ? parseInt(file.data.size, 10)
            : 0,
          lastModified: new Date(file.data.modifiedTime || Date.now()),
        },
      };
    } catch (err: any) {
      this.logger.error(`Failed to get file \`${key}\`: ${err.message}`);
      return {};
    }
  }

  async list(prefix?: string): Promise<ListObjectsMetadata[]> {
    try {
      const folderId = this.folderId || 'root';
      const query = [
        `'${folderId}' in parents`,
        'trashed=false',
      ];

      if (prefix) {
        query.push(`name contains '${prefix.replace(/'/g, "\\'")}'`);
      }

      const response = await this.drive.files.list({
        q: query.join(' and '),
        fields: 'files(id,name,modifiedTime,size)',
        pageSize: 1000,
      });

      return (
        response.data.files?.map((file: drive_v3.Schema$File) => ({
          key: file.name!,
          lastModified: new Date(file.modifiedTime || Date.now()),
          contentLength: file.size ? parseInt(file.size, 10) : 0,
        })) || []
      );
    } catch (err: any) {
      this.logger.error(`Failed to list files: ${err.message}`);
      return [];
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const parts = key.split('/');
      const fileName = parts.pop() || key;
      let folderId = this.folderId;

      // Navigate to the correct folder
      if (parts.length > 0) {
        const foundFolderId = await this.findFileByName(parts[0], this.folderId);
        if (!foundFolderId) {
          this.logger.warn(`File \`${key}\` not found for deletion`);
          return;
        }
        folderId = foundFolderId;
      }

      const fileId = await this.findFileByName(fileName, folderId);
      if (!fileId) {
        this.logger.warn(`File \`${key}\` not found for deletion`);
        return;
      }

      await this.drive.files.delete({ fileId });
      this.logger.verbose(`Deleted file \`${key}\``);

      // Remove from cache
      this.metadataCache.delete(fileName);
    } catch (err: any) {
      this.logger.error(`Failed to delete file \`${key}\`: ${err.message}`);
      throw err;
    }
  }
}
