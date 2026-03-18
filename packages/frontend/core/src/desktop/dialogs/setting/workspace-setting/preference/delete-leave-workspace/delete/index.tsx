import { ConfirmModal } from '@affine/component/ui/modal';
import { useWorkspaceInfo } from '@affine/core/components/hooks/use-workspace-info';
import type { WorkspaceMetadata } from '@affine/core/modules/workspace';
import { UNTITLED_WORKSPACE_NAME } from '@affine/env/constant';
import { Trans, useI18n } from '@affine/i18n';

import * as styles from './style.css';

interface WorkspaceDeleteProps {
  workspaceMetadata: WorkspaceMetadata;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: () => void;
}

export const WorkspaceDeleteModal = ({
  workspaceMetadata,
  open,
  onOpenChange,
  onConfirm,
}: WorkspaceDeleteProps) => {
  const info = useWorkspaceInfo(workspaceMetadata);
  const workspaceName = info?.name ?? UNTITLED_WORKSPACE_NAME;
  const t = useI18n();

  return (
    <ConfirmModal
      open={open}
      onOpenChange={onOpenChange}
      title={`${t['com.affine.workspaceDelete.title']()}?`}
      description={
        workspaceMetadata.flavour === 'local' ? (
          <Trans i18nKey="com.affine.workspaceDelete.description">
            Deleting (
            <span className={styles.workspaceName}>
              {{ workspace: workspaceName } as any}
            </span>
            ) cannot be undone, please proceed with caution. All contents will be
            lost.
          </Trans>
        ) : (
          <Trans i18nKey="com.affine.workspaceDelete.description2">
            Deleting (
            <span className={styles.workspaceName}>
              {{ workspace: workspaceName } as any}
            </span>
            ) will delete both local and cloud data, this operation cannot be
            undone, please proceed with caution.
          </Trans>
        )
      }
      confirmText={t['com.affine.workspaceDelete.button.delete']()}
      cancelText={t['com.affine.workspaceDelete.button.cancel']()}
      onConfirm={onConfirm}
      confirmButtonOptions={{
        variant: 'error',
      }}
    />
  );
};
