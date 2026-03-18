import { Type } from '@nestjs/common';

import { JSONSchema } from '../../config';
import { FsStorageConfig, FsStorageProvider } from './fs';
import {
  GDriveStorageConfig,
  GDriveStorageProvider,
} from './gdrive';
import { StorageProvider } from './provider';
import { R2StorageConfig, R2StorageProvider } from './r2';
import { S3StorageConfig, S3StorageProvider } from './s3';

export type StorageProviderName =
  | 'fs'
  | 'aws-s3'
  | 'cloudflare-r2'
  | 'google-drive';
export const StorageProviders: Record<
  StorageProviderName,
  Type<StorageProvider>
> = {
  fs: FsStorageProvider,
  'aws-s3': S3StorageProvider,
  'cloudflare-r2': R2StorageProvider,
  'google-drive': GDriveStorageProvider,
};

export type StorageProviderConfig = { bucket: string } & (
  | {
      provider: 'fs';
      config: FsStorageConfig;
    }
  | {
      provider: 'aws-s3';
      config: S3StorageConfig;
    }
  | {
      provider: 'cloudflare-r2';
      config: R2StorageConfig;
    }
  | {
      provider: 'google-drive';
      config: GDriveStorageConfig;
    }
);

const S3ConfigSchema: JSONSchema = {
  type: 'object',
  description: 'The config for the S3 compatible storage provider.',
  properties: {
    endpoint: {
      type: 'string',
      description:
        'The S3 compatible endpoint. Example: "https://s3.us-east-1.amazonaws.com" or "https://<account>.r2.cloudflarestorage.com".',
    },
    region: {
      type: 'string',
      description:
        'The region for the storage provider. Example: "us-east-1" or "auto" for R2.',
    },
    forcePathStyle: {
      type: 'boolean',
      description: 'Whether to use path-style bucket addressing.',
    },
    requestTimeoutMs: {
      type: 'number',
      description: 'Request timeout in milliseconds.',
    },
    minPartSize: {
      type: 'number',
      description: 'Minimum multipart part size in bytes.',
    },
    presign: {
      type: 'object',
      description: 'Presigned URL behavior configuration.',
      properties: {
        expiresInSeconds: {
          type: 'number',
          description: 'Expiration time in seconds for presigned URLs.',
        },
        signContentTypeForPut: {
          type: 'boolean',
          description: 'Whether to sign Content-Type for presigned PUT.',
        },
      },
    },
    credentials: {
      type: 'object',
      description: 'The credentials for the s3 compatible storage provider.',
      properties: {
        accessKeyId: {
          type: 'string',
        },
        secretAccessKey: {
          type: 'string',
        },
        sessionToken: {
          type: 'string',
        },
      },
    },
  },
};

const GDriveConfigSchema: JSONSchema = {
  type: 'object',
  description: 'The config for the Google Drive storage provider.',
  properties: {
    folderId: {
      type: 'string',
      description:
        'The folder ID in Google Drive where files will be stored. If not provided, files will be stored in the root of My Drive.',
    },
    useServiceAccount: {
      type: 'boolean',
      description:
        'Whether to use service account authentication. If false, will use OAuth2 client credentials.',
    },
    credentials: {
      type: 'object',
      description: 'Service account credentials.',
      properties: {
        client_email: {
          type: 'string',
          description: 'Service account client email.',
        },
        private_key: {
          type: 'string',
          description: 'Service account private key.',
        },
        project_id: {
          type: 'string',
          description: 'Google Cloud project ID.',
        },
      },
    },
    oauth: {
      type: 'object',
      description: 'OAuth2 client credentials.',
      properties: {
        clientId: {
          type: 'string',
          description: 'OAuth2 client ID.',
        },
        clientSecret: {
          type: 'string',
          description: 'OAuth2 client secret.',
        },
        refreshToken: {
          type: 'string',
          description: 'OAuth2 refresh token.',
        },
        accessToken: {
          type: 'string',
          description: 'OAuth2 access token.',
        },
      },
    },
    sharing: {
      type: 'object',
      description: 'File sharing settings.',
      properties: {
        public: {
          type: 'boolean',
          description:
            'Make files publicly accessible via "anyone with the link".',
        },
        domain: {
          type: 'string',
          description: 'Domain to share files with (for Google Workspace).',
        },
      },
    },
  },
};

export const StorageJSONSchema: JSONSchema = {
  oneOf: [
    {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: ['fs'],
        },
        bucket: {
          type: 'string',
        },
        config: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
            },
          },
        },
      },
    },
    {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: ['aws-s3'],
        },
        bucket: {
          type: 'string',
        },
        config: S3ConfigSchema,
      },
    },
    {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: ['cloudflare-r2'],
        },
        bucket: {
          type: 'string',
        },
        config: {
          ...S3ConfigSchema,
          properties: {
            ...S3ConfigSchema.properties,
            accountId: {
              type: 'string' as const,
              description:
                'The account id for the cloudflare r2 storage provider.',
            },
            usePresignedURL: {
              type: 'object' as const,
              description:
                'The presigned url config for the cloudflare r2 storage provider.',
              properties: {
                enabled: {
                  type: 'boolean' as const,
                  description:
                    'Whether to use presigned url for the cloudflare r2 storage provider.',
                },
                urlPrefix: {
                  type: 'string' as const,
                  description:
                    'The custom domain URL prefix for the cloudflare r2 storage provider.\nWhen `enabled=true` and `urlPrefix` + `signKey` are provided, the server will:\n- Redirect GET requests to this custom domain with an HMAC token.\n- Return upload URLs under `/api/storage/*` for uploads.\nPresigned/upload proxy TTL is 1 hour.\nsee https://developers.cloudflare.com/waf/custom-rules/use-cases/configure-token-authentication/ to configure it.\nExample value: "https://storage.example.com"\nExample rule: is_timed_hmac_valid_v0("your_secret", http.request.uri, 10800, http.request.timestamp.sec, 6)',
                },
                signKey: {
                  type: 'string' as const,
                  description:
                    'The presigned key for the cloudflare r2 storage provider.',
                },
              },
            },
          },
        },
      },
    },
    {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          enum: ['google-drive'],
        },
        bucket: {
          type: 'string',
        },
        config: GDriveConfigSchema,
      },
    },
  ],
};

export type * from './provider';
export {
  applyAttachHeaders,
  autoMetadata,
  PROXY_MULTIPART_PATH,
  PROXY_UPLOAD_PATH,
  sniffMime,
  STORAGE_PROXY_ROOT,
  toBuffer,
} from './utils';
