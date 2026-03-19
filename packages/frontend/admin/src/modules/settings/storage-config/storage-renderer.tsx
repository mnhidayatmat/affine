import { useCallback, useEffect, useState } from 'react';

import type { AppConfig } from '../config';
import { type StorageConfig, StorageConfigPanel } from './storage-config-panel';

interface StorageRendererProps {
  appConfig: AppConfig;
  patchedAppConfig: AppConfig;
  onUpdate: (path: string, value: any) => void;
}

export function StorageRenderer({
  appConfig,
  patchedAppConfig,
  onUpdate,
}: StorageRendererProps) {
  const [blobConfig, setBlobConfig] = useState<StorageConfig | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<StorageConfig | null>(null);
  const [copilotConfig, setCopilotConfig] = useState<StorageConfig | null>(
    null
  );

  // Initialize configs from appConfig
  useEffect(() => {
    if (appConfig?.storages) {
      const blob = appConfig.storages.blob?.storage;
      const avatar = appConfig.storages.avatar?.storage;
      setBlobConfig(blob);
      setAvatarConfig(avatar);
    }
    if (patchedAppConfig?.copilot) {
      const copilot = patchedAppConfig.copilot.storage;
      setCopilotConfig(copilot);
    }
  }, [appConfig, patchedAppConfig]);

  const handleBlobChange = useCallback(
    (config: StorageConfig) => {
      setBlobConfig(config);
      onUpdate('storages/blob.storage', config);
    },
    [onUpdate]
  );

  const handleAvatarChange = useCallback(
    (config: StorageConfig) => {
      setAvatarConfig(config);
      onUpdate('storages/avatar.storage', config);
    },
    [onUpdate]
  );

  const handleCopilotChange = useCallback(
    (config: StorageConfig) => {
      setCopilotConfig(config);
      onUpdate('copilot/storage', config);
    },
    [onUpdate]
  );

  return (
    <div className="space-y-6">
      {/* Blob Storage */}
      <StorageConfigPanel
        title="Blob Storage"
        description="Storage for user uploaded files (images, videos, attachments, etc.)"
        storage={blobConfig ?? undefined}
        onChange={handleBlobChange}
      />

      {/* Avatar Storage */}
      <StorageConfigPanel
        title="Avatar Storage"
        description="Storage for user profile pictures"
        storage={avatarConfig ?? undefined}
        onChange={handleAvatarChange}
      />

      {/* Copilot Storage - only show if copilot is enabled */}
      {patchedAppConfig?.copilot && (
        <StorageConfigPanel
          title="Copilot Storage"
          description="Storage for AI/Copilot generated files"
          storage={copilotConfig ?? undefined}
          onChange={handleCopilotChange}
        />
      )}
    </div>
  );
}
