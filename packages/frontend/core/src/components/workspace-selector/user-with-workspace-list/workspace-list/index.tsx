import { IconButton, Menu, MenuItem, notify } from '@affine/component';
import { Divider } from '@affine/component/ui/divider';
import { useEnableCloud } from '@affine/core/components/hooks/affine/use-enable-cloud';
import { useSignOut } from '@affine/core/components/hooks/affine/use-sign-out';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import { useNavigateHelper } from '@affine/core/components/hooks/use-navigate-helper';
import type { AuthAccountInfo, Server } from '@affine/core/modules/cloud';
import { AuthService, ServersService } from '@affine/core/modules/cloud';
import { GlobalDialogService } from '@affine/core/modules/dialogs';
import { GlobalContextService } from '@affine/core/modules/global-context';
import {
  type WorkspaceMetadata,
  WorkspaceService,
  WorkspacesService,
} from '@affine/core/modules/workspace';
import { useI18n } from '@affine/i18n';
import {
  AccountIcon,
  CloudWorkspaceIcon,
  DeleteIcon,
  LocalWorkspaceIcon,
  MoreHorizontalIcon,
  SelfhostIcon,
  SignOutIcon,
} from '@blocksuite/icons/rc';
import {
  FrameworkScope,
  useLiveData,
  useService,
  useServiceOptional,
} from '@toeverything/infra';
import { useCallback, useMemo, useState } from 'react';

import { WorkspaceDeleteModal } from '../../../../../desktop/dialogs/setting/workspace-setting/preference/delete-leave-workspace/delete';
import { WorkspaceCard } from '../../workspace-card';
import { AddServer } from '../add-server';
import * as styles from './index.css';

const WorkspaceServerInfo = ({
  server,
  name,
  account,
  accountStatus,
  onDeleteServer,
  onSignOut,
}: {
  server: string;
  name: string;
  account?: AuthAccountInfo | null;
  accountStatus?: 'authenticated' | 'unauthenticated';
  onDeleteServer?: () => void;
  onSignOut?: () => void;
}) => {
  const t = useI18n();
  const isCloud = server !== 'local';
  const isAffineCloud = server === 'affine-cloud';
  const Icon = isAffineCloud
    ? CloudWorkspaceIcon
    : isCloud
      ? SelfhostIcon
      : LocalWorkspaceIcon;

  const menuItems = useMemo(
    () =>
      [
        server !== 'affine-cloud' && server !== 'local' && (
          <MenuItem
            prefixIcon={<DeleteIcon />}
            type="danger"
            key="delete-server"
            onClick={onDeleteServer}
          >
            {t['com.affine.server.delete']()}
          </MenuItem>
        ),
        accountStatus === 'authenticated' && (
          <MenuItem
            prefixIcon={<SignOutIcon />}
            key="sign-out"
            onClick={onSignOut}
            type="danger"
          >
            {t['Sign out']()}
          </MenuItem>
        ),
      ].filter(Boolean),
    [accountStatus, onDeleteServer, onSignOut, server, t]
  );

  return (
    <div className={styles.workspaceServer}>
      <div className={styles.workspaceServerIcon}>
        <Icon />
      </div>
      <div className={styles.workspaceServerContent}>
        <div className={styles.workspaceServerName}>{name}</div>
        {isCloud ? (
          <div className={styles.workspaceServerAccount}>
            {account ? account.email : 'Not signed in'}
          </div>
        ) : null}
      </div>
      <div className={styles.workspaceServerSpacer} />
      {menuItems.length ? (
        <Menu items={menuItems}>
          <IconButton
            icon={<MoreHorizontalIcon className={styles.infoMoreIcon} />}
          />
        </Menu>
      ) : null}
    </div>
  );
};

const CloudWorkSpaceList = ({
  server,
  workspaces,
  onClickWorkspace,
  onClickEnableCloud,
  onDeleteWorkspace,
}: {
  server: Server;
  workspaces: WorkspaceMetadata[];
  onClickWorkspace: (workspaceMetadata: WorkspaceMetadata) => void;
  onClickEnableCloud?: (meta: WorkspaceMetadata) => void;
  onDeleteWorkspace?: (meta: WorkspaceMetadata) => void;
}) => {
  const t = useI18n();
  const globalContextService = useService(GlobalContextService);
  const globalDialogService = useService(GlobalDialogService);
  const serverName = useLiveData(server.config$.selector(c => c.serverName));
  const authService = useService(AuthService);
  const serversService = useService(ServersService);
  const account = useLiveData(authService.session.account$);
  const accountStatus = useLiveData(authService.session.status$);
  const navigateHelper = useNavigateHelper();

  const currentWorkspaceFlavour = useLiveData(
    globalContextService.globalContext.workspaceFlavour.$
  );

  const handleDeleteServer = useCallback(() => {
    serversService.removeServer(server.id);

    if (currentWorkspaceFlavour === server.id) {
      const otherWorkspace = workspaces.find(w => w.flavour !== server.id);
      if (otherWorkspace) {
        navigateHelper.openPage(otherWorkspace.id, 'all');
      }
    }
  }, [
    currentWorkspaceFlavour,
    navigateHelper,
    server.id,
    serversService,
    workspaces,
  ]);

  const handleSignOut = useSignOut();

  const handleSignIn = useAsyncCallback(async () => {
    globalDialogService.open('sign-in', {
      server: server.baseUrl,
    });
  }, [globalDialogService, server.baseUrl]);

  return (
    <>
      <WorkspaceServerInfo
        server={server.id}
        name={serverName}
        account={account}
        accountStatus={accountStatus}
        onDeleteServer={handleDeleteServer}
        onSignOut={handleSignOut}
      />
      {accountStatus === 'unauthenticated' ? (
        <MenuItem key="sign-in" onClick={handleSignIn}>
          <div className={styles.signInMenuItemContent}>
            <div className={styles.signInIconWrapper}>
              <AccountIcon />
            </div>
            <div className={styles.signInText}>{t['Sign in']()}</div>
          </div>
        </MenuItem>
      ) : null}
      <WorkspaceList
        items={workspaces}
        onClick={onClickWorkspace}
        onEnableCloudClick={onClickEnableCloud}
        onDeleteClick={onDeleteWorkspace}
      />
    </>
  );
};

const LocalWorkspaces = ({
  workspaces,
  onClickWorkspace,
  onClickWorkspaceSetting,
  onClickEnableCloud,
  onDeleteWorkspace,
}: {
  workspaces: WorkspaceMetadata[];
  onClickWorkspace: (workspaceMetadata: WorkspaceMetadata) => void;
  onClickWorkspaceSetting?: (workspaceMetadata: WorkspaceMetadata) => void;
  onClickEnableCloud?: (meta: WorkspaceMetadata) => void;
  onDeleteWorkspace?: (meta: WorkspaceMetadata) => void;
}) => {
  const t = useI18n();
  if (workspaces.length === 0) {
    return null;
  }
  return (
    <>
      <WorkspaceServerInfo
        server="local"
        name={t['com.affine.workspaceList.workspaceListType.local']()}
      />
      <WorkspaceList
        items={workspaces}
        onClick={onClickWorkspace}
        onSettingClick={onClickWorkspaceSetting}
        onEnableCloudClick={onClickEnableCloud}
        onDeleteClick={onDeleteWorkspace}
      />
    </>
  );
};

export const AFFiNEWorkspaceList = ({
  onEventEnd,
  onClickWorkspace,
  showEnableCloudButton,
}: {
  onClickWorkspace?: (workspaceMetadata: WorkspaceMetadata) => void;
  onEventEnd?: () => void;
  showEnableCloudButton?: boolean;
}) => {
  const workspacesService = useService(WorkspacesService);
  const globalContextService = useService(GlobalContextService);
  const workspaces = useLiveData(workspacesService.list.workspaces$);
  const navigateHelper = useNavigateHelper();
  const t = useI18n();

  const [deletingWorkspace, setDeletingWorkspace] =
    useState<WorkspaceMetadata | null>(null);

  const confirmEnableCloud = useEnableCloud();

  const serversService = useService(ServersService);
  const servers = useLiveData(serversService.servers$);
  const affineCloudServer = useMemo(
    () => servers.find(s => s.id === 'affine-cloud') as Server,
    [servers]
  );
  const selfhostServers = useMemo(
    () => servers.filter(s => s.id !== 'affine-cloud'),
    [servers]
  );

  const cloudWorkspaces = useMemo(
    () =>
      workspaces.filter(
        ({ flavour }) => flavour !== 'local'
      ) as WorkspaceMetadata[],
    [workspaces]
  );

  const localWorkspaces = useMemo(
    () =>
      workspaces.filter(
        ({ flavour }) => flavour === 'local'
      ) as WorkspaceMetadata[],
    [workspaces]
  );

  const onClickEnableCloud = useCallback(
    (meta: WorkspaceMetadata) => {
      const { workspace, dispose } = workspacesService.open({ metadata: meta });
      confirmEnableCloud(workspace, {
        onFinished: () => {
          dispose();
        },
      });
    },
    [confirmEnableCloud, workspacesService]
  );

  const handleClickWorkspace = useCallback(
    (workspaceMetadata: WorkspaceMetadata) => {
      onClickWorkspace?.(workspaceMetadata);
      onEventEnd?.();
    },
    [onClickWorkspace, onEventEnd]
  );

  const handleDeleteWorkspace = useCallback(
    async (metadata: WorkspaceMetadata) => {
      setDeletingWorkspace(metadata);
    },
    []
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingWorkspace) return;

    const currentWorkspaceId = globalContextService.globalContext.workspaceId.$.value;
    const workspaceList = workspaces;

    // Navigate away if deleting current workspace
    if (currentWorkspaceId === deletingWorkspace.id) {
      const backWorkspace = workspaceList.find(
        ws => ws.id !== currentWorkspaceId
      );
      if (backWorkspace) {
        navigateHelper.jumpToPage(backWorkspace.id, 'all');
      } else {
        navigateHelper.jumpToIndex();
      }
    }

    try {
      await workspacesService.deleteWorkspace(deletingWorkspace);
      notify.success({ title: t['Successfully deleted']() });
    } catch {
      notify.error({ title: t['Failed to delete workspace']() });
    } finally {
      setDeletingWorkspace(null);
    }
  }, [deletingWorkspace, globalContextService, navigateHelper, t, workspaces, workspacesService]);

  return (
    <>
      {/* 1. affine-cloud */}
      <FrameworkScope
        key={affineCloudServer.id}
        scope={affineCloudServer.scope}
      >
        <CloudWorkSpaceList
          server={affineCloudServer}
          workspaces={cloudWorkspaces.filter(
            ({ flavour }) => flavour === affineCloudServer.id
          )}
          onClickWorkspace={handleClickWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
        />
      </FrameworkScope>
      {(localWorkspaces.length > 0 || selfhostServers.length > 0) && (
        <Divider size="thinner" className={styles.serverDivider} />
      )}

      {/* 2. local */}
      <LocalWorkspaces
        workspaces={localWorkspaces}
        onClickWorkspace={handleClickWorkspace}
        onClickEnableCloud={
          showEnableCloudButton ? onClickEnableCloud : undefined
        }
        onDeleteWorkspace={handleDeleteWorkspace}
      />
      {selfhostServers.length > 0 && (
        <Divider size="thinner" className={styles.serverDivider} />
      )}

      {/* 3. selfhost */}
      {selfhostServers.map((server, index) => (
        <FrameworkScope key={server.id} scope={server.scope}>
          <CloudWorkSpaceList
            server={server}
            workspaces={cloudWorkspaces.filter(
              ({ flavour }) => flavour === server.id
            )}
            onClickWorkspace={handleClickWorkspace}
            onDeleteWorkspace={handleDeleteWorkspace}
          />
          {index !== selfhostServers.length - 1 && (
            <Divider size="thinner" className={styles.serverDivider} />
          )}
        </FrameworkScope>
      ))}
      <AddServer />
      <Divider size="thinner" />

      {/* Delete Confirmation Modal */}
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

interface WorkspaceListProps {
  items: WorkspaceMetadata[];
  onClick: (workspace: WorkspaceMetadata) => void;
  onSettingClick?: (workspace: WorkspaceMetadata) => void;
  onEnableCloudClick?: (meta: WorkspaceMetadata) => void;
  onDeleteClick?: (meta: WorkspaceMetadata) => void;
}

interface SortableWorkspaceItemProps extends Omit<WorkspaceListProps, 'items'> {
  workspaceMetadata: WorkspaceMetadata;
}

const SortableWorkspaceItem = ({
  workspaceMetadata,
  onClick,
  onSettingClick,
  onEnableCloudClick,
  onDeleteClick,
}: SortableWorkspaceItemProps) => {
  const handleClick = useCallback(() => {
    onClick(workspaceMetadata);
  }, [onClick, workspaceMetadata]);

  const currentWorkspace = useServiceOptional(WorkspaceService)?.workspace;

  return (
    <WorkspaceCard
      className={styles.workspaceCard}
      infoClassName={styles.workspaceCardInfoContainer}
      workspaceMetadata={workspaceMetadata}
      onClick={handleClick}
      avatarSize={22}
      active={currentWorkspace?.id === workspaceMetadata.id}
      onClickOpenSettings={onSettingClick}
      onClickEnableCloud={onEnableCloudClick}
      onClickDelete={onDeleteClick}
    />
  );
};

export const WorkspaceList = (props: WorkspaceListProps) => {
  const workspaceList = props.items;
  const { items, ...restProps } = props;

  return workspaceList.map(item => (
    <SortableWorkspaceItem key={item.id} {...restProps} workspaceMetadata={item} />
  ));
};
