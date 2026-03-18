import { css } from '@emotion/react';

export const aiPromptsStyles = css`
  .ai-prompts-settings {
    padding: 24px;
    max-width: 900px;
  }

  .ai-prompts-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--affine-border-color, #e3e2e0);
  }

  .ai-prompts-title h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
  }

  .ai-prompts-title .subtitle {
    margin: 0;
    font-size: 14px;
    color: var(--affine-text-secondary-color, #77757d);
  }

  .btn-primary {
    padding: 10px 20px;
    background: var(--affine-primary-color, #6e6efc);
    color: var(--affine-background-primary-color, #fff);
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .btn-primary:hover {
    opacity: 0.9;
  }

  .btn-secondary {
    padding: 10px 20px;
    background: var(--affine-hover-color, #f5f5f5);
    color: var(--affine-text-primary-color, #1c1c1c);
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .ai-prompts-search {
    margin-bottom: 20px;
  }

  .search-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--affine-border-color, #e3e2e0);
    border-radius: 8px;
    background: var(--affine-background-primary-color, #fff);
    color: var(--affine-text-primary-color, #1c1c1c);
    font-size: 14px;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--affine-primary-color, #6e6efc);
  }

  .ai-prompts-error {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #fee2e2;
    color: #991b1b;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .ai-prompts-loading,
  .ai-prompts-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: var(--affine-text-secondary-color, #77757d);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--affine-border-color, #e3e2e0);
    border-top-color: var(--affine-primary-color, #6e6efc);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .ai-prompts-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ai-prompt-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: var(--affine-background-secondary-color, #fbfbfc);
    border: 1px solid var(--affine-border-color, #e3e2e0);
    border-radius: 12px;
    transition: box-shadow 0.2s;
  }

  .ai-prompt-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .ai-prompt-info {
    flex: 1;
  }

  .ai-prompt-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .ai-prompt-name {
    font-size: 15px;
    font-weight: 500;
  }

  .ai-prompt-badges {
    display: flex;
    gap: 6px;
  }

  .badge {
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
  }

  .badge-public {
    background: #10b981;
    color: white;
  }

  .badge-model {
    background: var(--affine-tag-blue, #6e6efc);
    color: white;
  }

  .ai-prompt-meta {
    font-size: 13px;
    color: var(--affine-text-secondary-color, #77757d);
    display: flex;
    gap: 8px;
  }

  .ai-prompt-actions {
    display: flex;
    gap: 8px;
  }

  .btn-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
    color: var(--affine-text-secondary-color, #77757d);
  }

  .btn-icon:hover {
    background: var(--affine-hover-color, #f5f5f5);
    color: var(--affine-text-primary-color, #1c1c1c);
  }

  .btn-danger:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  /* Modal */
  .ai-prompts-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .ai-prompts-modal {
    background: var(--affine-background-primary-color, #fff);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .ai-prompts-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--affine-divider-color, #e3e2e0);
  }

  .ai-prompts-modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .btn-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    font-size: 24px;
    color: var(--affine-text-secondary-color, #77757d);
    cursor: pointer;
    border-radius: 8px;
  }

  .btn-close:hover {
    background: var(--affine-hover-color, #f5f5f5);
  }

  .ai-prompt-editor {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .ai-prompt-editor .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ai-prompt-editor label {
    font-size: 14px;
    font-weight: 500;
    color: var(--affine-text-secondary-color, #77757d);
  }

  .ai-prompt-editor input,
  .ai-prompt-editor textarea,
  .ai-prompt-editor select {
    padding: 10px 12px;
    border: 1px solid var(--affine-border-color, #e3e2e0);
    border-radius: 8px;
    font-size: 14px;
    background: var(--affine-background-primary-color, #fff);
    color: var(--affine-text-primary-color, #1c1c1c);
  }

  .ai-prompt-editor textarea {
    min-height: 100px;
    resize: vertical;
    font-family: ui-monospace, 'Monaco', 'Menlo', monospace;
    font-size: 13px;
  }

  .ai-prompt-editor .form-row {
    display: flex;
    gap: 16px;
  }

  .ai-prompt-editor .form-row .form-group {
    flex: 1;
  }

  .ai-prompt-editor .checkbox-group {
    display: flex;
    align-items: center;
    padding-top: 24px;
  }

  .ai-prompt-editor .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .variables-help {
    font-size: 12px;
    color: var(--affine-text-secondary-color, #77757d);
    padding: 12px;
    background: var(--affine-background-secondary-color, #fbfbfc);
    border-radius: 8px;
    line-height: 1.8;
  }

  .variables-help code {
    background: var(--affine-background-code-block, #f2f1f0);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: ui-monospace, monospace;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--affine-divider-color, #e3e2e0);
  }
`;
