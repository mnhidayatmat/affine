import { useMutation } from '@affine/admin/libs/react-query';
import { get } from 'lodash-es';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ALL_CONFIG_DESCRIPTORS,
  type AppConfig,
} from '../config';
import { StorageConfigPanel, type StorageConfig } from './storage-config-panel';
import { updateAppConfigMutation } from '../use-app-config';

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
  const navigate = useNavigate();
  const updateConfig = useMutation(updateAppConfigMutation);

  const [blobConfig, setBlobConfig] = useState<StorageConfig | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<StorageConfig | null>(null);
  const [copilotConfig, setCopilotConfig] = useState<StorageConfig | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

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

  const handleBlobChange = useCallback((config: StorageConfig) => {
    setBlobConfig(config);
    setHasChanges(true);
    onUpdate('storages/blob.storage', config);
  }, [onUpdate]);

  const handleAvatarChange = useCallback((config: StorageConfig) => {
    setAvatarConfig(config);
    setHasChanges(true);
    onUpdate('storages/avatar.storage', config);
  }, [onUpdate]);

  const handleCopilotChange = useCallback((config: StorageConfig) => {
    setCopilotConfig(config);
    setHasChanges(true);
    onUpdate('copilot/storage', config);
  }, [onUpdate]);

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
