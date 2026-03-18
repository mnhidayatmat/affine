import { css } from 'lit';

export const promptManagerStyles = css`
  :host {
    display: block;
    height: 100%;
    font-family: var(--affine-font-sans-family);
  }

  .prompt-manager {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--affine-background-primary-color);
    color: var(--affine-text-primary-color);
  }

  .prompt-manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--affine-divider-color);
    background: var(--affine-background-secondary-color);
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-title .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--affine-primary-color);
    color: var(--affine-background-primary-color);
  }

  .header-title h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .search-input {
    padding: 10px 16px;
    border: 1px solid var(--affine-border-color);
    border-radius: 8px;
    background: var(--affine-background-primary-color);
    color: var(--affine-text-primary-color);
    font-size: 14px;
    width: 250px;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--affine-primary-color);
  }

  .btn-primary {
    padding: 10px 20px;
    background: var(--affine-primary-color);
    color: var(--affine-background-primary-color);
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

  .prompt-list {
    padding: 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    flex: 1;
  }

  .prompt-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: var(--affine-background-secondary-color);
    border: 1px solid var(--affine-border-color);
    border-radius: 12px;
    transition: box-shadow 0.2s, border-color 0.2s;
  }

  .prompt-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-color: var(--affine-primary-color);
  }

  .prompt-info {
    flex: 1;
  }

  .prompt-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .prompt-name {
    font-size: 16px;
    font-weight: 500;
  }

  .prompt-badges {
    display: flex;
    gap: 6px;
  }

  .badge {
    padding: 4px 8px;
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
    background: var(--affine-tag-blue);
    color: white;
  }

  .prompt-meta {
    font-size: 13px;
    color: var(--affine-text-secondary-color);
    display: flex;
    gap: 8px;
  }

  .prompt-actions {
    display: flex;
    gap: 8px;
  }

  .btn-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: var(--affine-hover-color);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
    font-size: 16px;
  }

  .btn-icon:hover {
    background: var(--affine-background-code-block);
  }

  .btn-danger:hover {
    background: #ef4444;
    color: white;
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: var(--affine-text-secondary-color);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--affine-border-color);
    border-top-color: var(--affine-primary-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--affine-z-index-popover);
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-content {
    background: var(--affine-background-primary-color);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
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

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--affine-divider-color);
  }

  .modal-header h3 {
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
    color: var(--affine-text-secondary-color);
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s;
  }

  .btn-close:hover {
    background: var(--affine-hover-color);
  }
`;
