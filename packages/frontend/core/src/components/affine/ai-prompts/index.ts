/// <reference types="vite/client" />

import { PendingExport } from '@affine/core/component';
import { provider } from '@affine/core/component';
import { createIdentifier } from '@blocksuite/global/utils';

export const AffineAIPromptManager = PendingExport(
  async () =>
    (await import('./prompt-manager')).AffineAIPromptManager
);

export const AFFINE_AI_PROMPT_MANAGER_IDENTIFIER =
  createIdentifier('AffineAIPromptManager');
