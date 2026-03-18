import { Menu, type MenuProps, notify } from '@affine/component';
import { useNavigateHelper } from '@affine/core/components/hooks/use-navigate-helper';
import { GlobalContextService } from '@affine/core/modules/global-context';
import { WorkbenchService } from '@affine/core/modules/workbench';
import {
  type WorkspaceMetadata,
  WorkspacesService,
} from '@affine/core/modules/workspace';
import { useI18n } from '@affine/i18n';
import { track } from '@affine/track';
import {
  useLiveData,
  useServiceOptional,
  useServices,
} from '@toeverything/infra';
import { useCallback, useEffect, useState } from 'react';

import { WorkspaceDeleteModal } from '../../desktop/dialogs/setting/workspace-setting/preference/delete-leave-workspace/delete';

import { UserWithWorkspaceList } from './user-with-workspace-list';
import { WorkspaceCard } from './workspace-card';

interface WorkspaceSelectorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  workspaceMetadata?: WorkspaceMetadata;
  onSelectWorkspace?: (workspaceMetadata: WorkspaceMetadata) => void;
  onCreatedWorkspace?: (payload: {
    metadata: WorkspaceMetadata;
    defaultDocId?: string;
  }) => void;
  showEnableCloudButton?: boolean;
  showArrowDownIcon?: boolean;
  showSyncStatus?: boolean;
  disable?: boolean;
  menuContentOptions?: MenuProps['contentOptions'];
  className?: string;
  /** if true, will hide cloud/local, and scale the avatar */
  dense?: boolean;
}

export const WorkspaceSelector = ({
  workspaceMetadata: outerWorkspaceMetadata,
  onSelectWorkspace,
  onCreatedWorkspace,
  showArrowDownIcon,
  disable,
  open: outerOpen,
  onOpenChange: outerOnOpenChange,
  showEnableCloudButton,
  showSyncStatus,
  className,
  menuContentOptions,
  dense,
}: WorkspaceSelectorProps) => {
  const { workspacesService, globalContextService } = useServices({
    GlobalContextService,
    WorkspacesService,
  });
  const t = useI18n();
  const navigateHelper = useNavigateHelper();
  const [innerOpen, setOpened] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] =
    useState<WorkspaceMetadata | null>(null);
  const open = outerOpen ?? innerOpen;
  const onOpenChange = useCallback(
    (open: boolean) => {
      outerOnOpenChange !== undefined
        ? outerOnOpenChange?.(open)
        : setOpened(open);
    },
    [outerOnOpenChange]
  );
  const closeUserWorkspaceList = useCallback(() => {
    if (outerOnOpenChange) {
      outerOnOpenChange(false);
    } else {
      setOpened(false);
    }
  }, [outerOnOpenChange]);
  const openUserWorkspaceList = useCallback(() => {
    track.$.navigationPanel.workspaceList.open();
    if (outerOnOpenChange) {
      outerOnOpenChange(true);
    } else {
      setOpened(true);
    }
  }, [outerOnOpenChange]);

  const currentWorkspaceId = useLiveData(
    globalContextService.globalContext.workspaceId.$
  );
  const currentWorkspaceMetadata = useLiveData(
    currentWorkspaceId
      ? workspacesService.list.workspace$(currentWorkspaceId)
      : null
  );
  const workspaceMetadata = outerWorkspaceMetadata ?? currentWorkspaceMetadata;
  const workspaces = useLiveData(workspacesService.list.workspaces$);

  // revalidate workspace list when open workspace list
  useEffect(() => {
    if (open) {
      workspacesService.list.revalidate();
    }
  }, [workspacesService, open]);

  const handleDeleteWorkspace = useCallback(
    (meta: WorkspaceMetadata) => {
      closeUserWorkspaceList();
      setDeletingWorkspace(meta);
    },
    [closeUserWorkspaceList]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingWorkspace) return;

    const currentWsId = globalContextService.globalContext.workspaceId.$.value;

    if (currentWsId === deletingWorkspace.id) {
      const backWorkspace = workspaces.find(ws => ws.id !== currentWsId);
      if (backWorkspace) {
        navigateHelper.jumpToPage(backWorkspace.id, 'all');
      } else {
        navigateHelper.jumpToIndex();
      }
    }

    try {
      await workspacesService.deleteWorkspace(deletingWorkspace);
      notify.success({ title: t['Successfully deleted']() });
    } catch (err) {
      console.error('Failed to delete workspace', err);
      notify.error({ title: t['Failed to delete workspace']() });
    } finally {
      setDeletingWorkspace(null);
    }
  }, [deletingWorkspace, globalContextService, navigateHelper, t, workspaces, workspacesService]);

  return (
    <>
      <Menu
        rootOptions={{
          open,
          onOpenChange,
        }}
        items={
          <UserWithWorkspaceList
            onEventEnd={closeUserWorkspaceList}
            onClickWorkspace={onSelectWorkspace}
            onCreatedWorkspace={onCreatedWorkspace}
            onDeleteWorkspace={handleDeleteWorkspace}
            showEnableCloudButton={showEnableCloudButton}
          />
        }
        contentOptions={{
          // hide trigger
          sideOffset: dense ? -32 : -58,
          onInteractOutside: closeUserWorkspaceList,
          onEscapeKeyDown: closeUserWorkspaceList,
          ...menuContentOptions,
          style: {
            width: '300px',
            maxHeight: 'min(800px, calc(100vh - 200px))',
            padding: 0,
            ...menuContentOptions?.style,
          },
        }}
      >
        {workspaceMetadata ? (
          <WorkspaceCard
            workspaceMetadata={workspaceMetadata}
            onClick={openUserWorkspaceList}
            showSyncStatus={showSyncStatus}
            className={className}
            showArrowDownIcon={showArrowDownIcon}
            disable={disable}
            hideCollaborationIcon={true}
            hideTeamWorkspaceIcon={true}
            data-testid="current-workspace-card"
            dense={dense}
          />
        ) : (
          <span></span>
        )}
      </Menu>

      {/* Delete modal rendered outside Menu to avoid onInteractOutside conflicts */}
      {deletingWorkspace && (
        <WorkspaceDeleteModal
          workspaceMetadata={deletingWorkspace}
          open={!!deletingWorkspace}
          onOpenChange={open => {
            if (!open) setDeletingWorkspace(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
};

export const WorkspaceNavigator = ({
  onSelectWorkspace,
  onCreatedWorkspace,
  ...props
}: WorkspaceSelectorProps) => {
  const { jumpToPage } = useNavigateHelper();
  const { workspacesService } = useServices({ WorkspacesService });
  const workbench = useServiceOptional(WorkbenchService)?.workbench;

  const handleClickWorkspace = useCallback(
    (workspaceMetadata: WorkspaceMetadata) => {
      onSelectWorkspace?.(workspaceMetadata);

      const closeInactiveViews = () =>
        workbench?.views$.value.forEach(view => {
          if (workbench?.activeView$.value !== view) {
            workbench?.close(view);
          }
        });

      if (document.startViewTransition) {
        document.startViewTransition(() => {
          closeInactiveViews();
          jumpToPage(workspaceMetadata.id, 'all');
          return new Promise(resolve =>
            setTimeout(resolve, 150)
          ); /* start transition after 150ms */
        });
      } else {
        closeInactiveViews();
        jumpToPage(workspaceMetadata.id, 'all');
      }
    },
    [jumpToPage, onSelectWorkspace, workbench]
  );
  const handleCreatedWorkspace = useCallback(
    async (payload: { metadata: WorkspaceMetadata; defaultDocId?: string }) => {
      onCreatedWorkspace?.(payload);

      // Wait for the workspace to be available in the list before navigating
      // This prevents the "Transition was skipped" error caused by race conditions
      const waitForWorkspace = workspacesService.list.workspaces$.waitFor(
        workspaces => workspaces.some(w => w.id === payload.metadata.id)
      );

      // Add a timeout to prevent infinite waiting
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Workspace not found in list')), 5000)
      );

      try {
        await Promise.race([waitForWorkspace, timeoutPromise]);
      } catch {
        // If timeout or error, proceed anyway - the workspace might still load
      }

      const performNavigation = () => {
        if (payload.defaultDocId) {
          jumpToPage(payload.metadata.id, payload.defaultDocId);
        } else {
          jumpToPage(payload.metadata.id, 'all');
        }
      };

      if (document.startViewTransition) {
        try {
          await document.startViewTransition(() => {
            performNavigation();
            return new Promise(resolve =>
              setTimeout(resolve, 150)
            ); /* start transition after 150ms */
          }).finished;
        } catch {
          // If view transition fails (e.g., skipped), navigate without it
          performNavigation();
        }
      } else {
        performNavigation();
      }
    },
    [jumpToPage, onCreatedWorkspace, workspacesService]
  );
  return (
    <WorkspaceSelector
      onSelectWorkspace={handleClickWorkspace}
      onCreatedWorkspace={handleCreatedWorkspace}
      {...props}
    />
  );
};
