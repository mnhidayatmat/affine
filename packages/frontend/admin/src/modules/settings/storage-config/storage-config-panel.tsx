import { Button } from '@affine/admin/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Input } from '@affine/admin/components/ui/input';
import { Label } from '@affine/admin/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@affine/admin/components/ui/select';
import { Switch } from '@affine/admin/components/ui/switch';
import { Textarea } from '@affine/admin/components/ui/textarea';
import { cn } from '@affine/admin/utils';
import { Check, Loader2, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export type StorageProvider = 'fs' | 'aws-s3' | 'cloudflare-r2' | 'google-drive';

// S3-compatible storage credentials
export interface S3Credentials {
  accessKeyId?: string;
  secretAccessKey?: string;
}

// Google Drive credentials
export interface GDriveCredentials {
  client_email?: string;
  private_key?: string;
  project_id?: string;
}

export interface StorageConfig {
  provider: StorageProvider;
  bucket: string;
  config?: {
    // S3 / R2 / DO Spaces config
    endpoint?: string;
    region?: string;
    forcePathStyle?: boolean;
    s3Credentials?: S3Credentials;
    // Google Drive config
    folderId?: string;
    useServiceAccount?: boolean;
    gdriveCredentials?: GDriveCredentials;
    sharing?: {
      public?: boolean;
      domain?: string;
    };
  };
}

interface StorageConfigPanelProps {
  title: string;
  description: string;
  storage?: StorageConfig;
  onChange: (config: StorageConfig) => void;
  readOnly?: boolean;
}

const PROVIDER_LABELS: Record<StorageProvider, string> = {
  'fs': 'Local File System',
  'aws-s3': 'AWS S3 / S3-Compatible',
  'cloudflare-r2': 'Cloudflare R2',
  'google-drive': 'Google Drive',
};

const S3_COMPATIBLE_PROVIDERS: StorageProvider[] = ['aws-s3', 'cloudflare-r2'];

export function StorageConfigPanel({
  title,
  description,
  storage,
  onChange,
  readOnly = false,
}: StorageConfigPanelProps) {
  const [config, setConfig] = useState<StorageConfig>(
    storage ?? {
      provider: 'fs',
      bucket: '',
    }
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (storage) {
      setConfig(storage);
    }
  }, [storage]);

  const updateConfig = useCallback(
    (updates: Partial<StorageConfig>) => {
      const newConfig = { ...config, ...updates };
      setConfig(newConfig);
      onChange(newConfig);
      setTestResult(null);
    },
    [config, onChange]
  );

  const updateNestedConfig = useCallback(
    (path: string[], value: any) => {
      const newConfig = { ...config };
      if (!newConfig.config) {
        newConfig.config = {};
      }
      let current: any = newConfig.config;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      setConfig(newConfig);
      onChange(newConfig);
      setTestResult(null);
    },
    [config, onChange]
  );

  const getNestedConfig = useCallback(
    (path: string[]): any => {
      let current: any = config.config;
      for (const key of path) {
        if (current && typeof current === 'object') {
          current = current[key];
        } else {
          return undefined;
        }
      }
      return current;
    },
    [config.config]
  );

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate connection test (in real implementation, this would call an API)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isGDrive = config.provider === 'google-drive';
    const isS3Compatible = S3_COMPATIBLE_PROVIDERS.includes(config.provider);

    if (isGDrive) {
      const folderId = getNestedConfig(['folderId']);
      if (!folderId) {
        setTestResult({
          success: false,
          message: 'Please enter a Google Drive Folder ID',
        });
        setIsTesting(false);
        return;
      }
    }

    if (isS3Compatible) {
      const endpoint = getNestedConfig(['endpoint']);
      const accessKeyId = getNestedConfig(['s3Credentials', 'accessKeyId']);
      const secretAccessKey = getNestedConfig(['s3Credentials', 'secretAccessKey']);
      if (!endpoint || !accessKeyId || !secretAccessKey) {
        setTestResult({
          success: false,
          message: 'Please complete all required S3 configuration fields',
        });
        setIsTesting(false);
        return;
      }
    }

    setTestResult({
      success: true,
      message: `Successfully connected to ${PROVIDER_LABELS[config.provider]}`,
    });
    setIsTesting(false);
  };

  const isGoogleDrive = config.provider === 'google-drive';
  const isS3Compatible = S3_COMPATIBLE_PROVIDERS.includes(config.provider);
  const isLocalFS = config.provider === 'fs';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-sm font-normal text-muted-foreground">
              {description}
            </div>
          </div>
          {config.provider !== 'fs' && !readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider">Storage Provider</Label>
          <Select
            value={config.provider}
            onValueChange={(value: StorageProvider) => updateConfig({ provider: value })}
            disabled={readOnly}
          >
            <SelectTrigger id="provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bucket/Folder Name */}
        <div className="space-y-2">
          <Label htmlFor="bucket">
            {isGoogleDrive ? 'Folder Name (for reference)' : 'Bucket Name'}
          </Label>
          <Input
            id="bucket"
            value={config.bucket}
            onChange={e => updateConfig({ bucket: e.target.value })}
            placeholder={isGoogleDrive ? 'affine-workspace-docs' : isS3Compatible ? 'your-bucket-name' : './storage'}
            disabled={readOnly}
          />
        </div>

        {/* S3-Compatible Configuration */}
        {isS3Compatible && (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="text-sm font-semibold">
              {config.provider === 'aws-s3' ? 'AWS S3 / S3-Compatible' : 'Cloudflare R2'}{' '}
              Configuration
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input
                id="endpoint"
                value={getNestedConfig(['endpoint']) || ''}
                onChange={e => updateNestedConfig(['endpoint'], e.target.value)}
                placeholder="https://s3.amazonaws.com or https://sgp1.digitaloceanspaces.com"
                disabled={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={getNestedConfig(['region']) || ''}
                onChange={e => updateNestedConfig(['region'], e.target.value)}
                placeholder="us-east-1 or sgp1"
                disabled={readOnly}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="forcePathStyle"
                checked={getNestedConfig(['forcePathStyle']) ?? false}
                onCheckedChange={checked => updateNestedConfig(['forcePathStyle'], checked)}
                disabled={readOnly}
              />
              <Label htmlFor="forcePathStyle" className="cursor-pointer">
                Force Path Style (required for DigitalOcean Spaces, MinIO, etc.)
              </Label>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Credentials</div>

              <div className="space-y-2">
                <Label htmlFor="accessKeyId">Access Key ID</Label>
                <Input
                  id="accessKeyId"
                  type="password"
                  value={getNestedConfig(['s3Credentials', 'accessKeyId']) || ''}
                  onChange={e => updateNestedConfig(['s3Credentials', 'accessKeyId'], e.target.value)}
                  placeholder="Your access key"
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretAccessKey">Secret Access Key</Label>
                <Input
                  id="secretAccessKey"
                  type="password"
                  value={getNestedConfig(['s3Credentials', 'secretAccessKey']) || ''}
                  onChange={e => updateNestedConfig(['s3Credentials', 'secretAccessKey'], e.target.value)}
                  placeholder="Your secret key"
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>
        )}

        {/* Google Drive Configuration */}
        {isGoogleDrive && (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="text-sm font-semibold">Google Drive Configuration</div>

            <div className="space-y-2">
              <Label htmlFor="gdrive-folder-id">
                Google Drive Folder ID{' '}
                <span className="text-xs text-muted-foreground">
                  (From URL: drive.google.com/drive/folders/{FOLDER_ID})
                </span>
              </Label>
              <Input
                id="gdrive-folder-id"
                value={getNestedConfig(['folderId']) || ''}
                onChange={e => updateNestedConfig(['folderId'], e.target.value)}
                placeholder="1A2B3C4D5E6F7G8H9I0J..."
                disabled={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gdrive-auth-type">Authentication Type</Label>
              <Select
                value={getNestedConfig(['useServiceAccount']) ? 'service-account' : 'oauth'}
                onValueChange={value => updateNestedConfig(['useServiceAccount'], value === 'service-account')}
                disabled={readOnly}
              >
                <SelectTrigger id="gdrive-auth-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service-account">Service Account (Recommended)</SelectItem>
                  <SelectItem value="oauth">OAuth 2.0</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {getNestedConfig(['useServiceAccount']) && (
              <div className="space-y-3">
                <div className="text-sm font-medium">Service Account Credentials</div>

                <div className="space-y-2">
                  <Label htmlFor="gdrive-client-email">Client Email</Label>
                  <Input
                    id="gdrive-client-email"
                    value={getNestedConfig(['gdriveCredentials', 'client_email']) || ''}
                    onChange={e => updateNestedConfig(['gdriveCredentials', 'client_email'], e.target.value)}
                    placeholder="your-service-account@project.iam.gserviceaccount.com"
                    disabled={readOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gdrive-private-key">Private Key</Label>
                  <Textarea
                    id="gdrive-private-key"
                    value={getNestedConfig(['gdriveCredentials', 'private_key']) || ''}
                    onChange={e => updateNestedConfig(['gdriveCredentials', 'private_key'], e.target.value)}
                    placeholder="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
                    className="min-h-[100px] font-mono text-xs"
                    disabled={readOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gdrive-project-id">Project ID</Label>
                  <Input
                    id="gdrive-project-id"
                    value={getNestedConfig(['gdriveCredentials', 'project_id']) || ''}
                    onChange={e => updateNestedConfig(['gdriveCredentials', 'project_id'], e.target.value)}
                    placeholder="your-project-id"
                    disabled={readOnly}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Sharing Settings</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="gdrive-public"
                  checked={getNestedConfig(['sharing', 'public']) ?? false}
                  onCheckedChange={checked => updateNestedConfig(['sharing', 'public'], checked)}
                  disabled={readOnly}
                />
                <Label htmlFor="gdrive-public" className="cursor-pointer">
                  Make files publicly accessible (anyone with link)
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Local File System Configuration */}
        {isLocalFS && (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="text-sm font-semibold">Local File System Configuration</div>
            <div className="space-y-2">
              <Label htmlFor="storage-path">Storage Path</Label>
              <Input
                id="storage-path"
                value={getNestedConfig(['path']) || '~/.affine/storage'}
                onChange={e => updateNestedConfig(['path'], e.target.value)}
                placeholder="~/.affine/storage"
                disabled={readOnly}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Files will be stored on the server&apos;s local filesystem at the specified path.
            </p>
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-md p-3 text-sm',
              testResult.success
                ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            )}
          >
            {testResult.success ? (
              <Check className="h-4 w-4" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {testResult.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
