import { useWorkspaceInfo } from '@affine/core/components/hooks/use-workspace-info';
import type { WorkspaceMetadata } from '@affine/core/modules/workspace';
import { UNTITLED_WORKSPACE_NAME } from '@affine/env/constant';
import { Trans, useI18n } from '@affine/i18n';
import { useEffect, useRef, useState } from 'react';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [deleteStr, setDeleteStr] = useState<string>('');
  const allowDelete = deleteStr === workspaceName;

  console.log('[DELETE MODAL] Render state:', {
    workspaceId: workspaceMetadata.id,
    workspaceName,
    deleteStr,
    allowDelete,
    infoName: info?.name,
  });

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleConfirm = () => {
    console.log('[DELETE MODAL] handleConfirm called', { deleteStr, workspaceName, allowDelete });
    if (allowDelete) {
      console.log('[DELETE MODAL] Calling onConfirm');
      onConfirm?.();
    }
  };

  const handleCancel = () => {
    console.log('[DELETE MODAL] handleCancel called');
    setDeleteStr('');
    onOpenChange?.(false);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={handleCancel}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '480px',
          maxWidth: '90vw',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600' }}>
          {t['com.affine.workspaceDelete.title']()}?
        </h2>

        {workspaceMetadata.flavour === 'local' ? (
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
        )}

        <div style={{ marginTop: '20px', fontWeight: 'bold', fontSize: '14px' }}>
          Type to confirm: <span style={{
            background: '#f0f0f0',
            padding: '4px 8px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '16px',
            marginLeft: '8px'
          }}>{workspaceName}</span>
        </div>

        <div className={styles.inputContent} style={{ marginTop: '16px' }}>
          <input
            ref={inputRef}
            type="text"
            value={deleteStr}
            onChange={e => {
              const value = e.target.value;
              console.log('[DELETE MODAL] Input onChange:', value);
              setDeleteStr(value);
            }}
            autoFocus
            placeholder={t['com.affine.workspaceDelete.placeholder']()}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: `1px solid ${allowDelete ? '#22c55e' : '#ddd'}`,
              borderRadius: '8px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: '12px', color: allowDelete ? '#22c55e' : '#666', marginTop: '8px' }}>
            {allowDelete
              ? '✓ Names match - you can delete'
              : `Type "${workspaceName}" to enable delete button`}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            {t['com.affine.workspaceDelete.button.cancel']()}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!allowDelete}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              borderRadius: '8px',
              border: 'none',
              background: allowDelete ? '#ef4444' : '#ccc',
              color: 'white',
              cursor: allowDelete ? 'pointer' : 'not-allowed',
              opacity: allowDelete ? 1 : 0.6,
            }}
          >
            {t['com.affine.workspaceDelete.button.delete']()}
          </button>
        </div>
      </div>
    </div>
  );
};
