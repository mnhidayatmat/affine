import type { Disposable } from '@blocksuite/global/utils';
import { WorkspaceIcon } from '@blocksuite/icons';
import { type LitElement, html, nothing, css, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { choose } from 'lit/directives/choose.js';

import type { UserPrompt } from '../../graphql/schema';
import { AIPromptClient } from './client';
import { promptManagerStyles } from './styles';

export interface AIPromptListItem {
  id: string;
  name: string;
  model: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@customElement('affine-ai-prompt-manager')
export class AffineAIPromptManager extends LitElement {
  static override styles = promptManagerStyles;

  @property({ attribute: false })
  workspaceId!: string;

  @property({ attribute: false })
  userId!: string;

  @state()
  private prompts: AIPromptListItem[] = [];

  @state()
  private loading = false;

  @state()
  private error: string | null = null;

  @state()
  private editingPrompt: AIPromptListItem | null = null;

  @state()
  private showModal = false;

  @state()
  private searchQuery = '';

  private client: AIPromptClient | null = null;

  private _disposables: Disposable[] = [];

  override connectedCallback() {
    super.connectedCallback();
    this.client = new AIPromptClient(this.workspaceId);
    this.loadPrompts();
  }

  override disconnectedCallback() {
    this._disposables.forEach(d => d.dispose());
    super.disconnectedCallback();
  }

  private async loadPrompts() {
    if (!this.client) return;

    this.loading = true;
    this.error = null;

    try {
      const prompts = await this.client.listPrompts();
      this.prompts = prompts;
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load prompts';
      console.error('Failed to load prompts:', e);
    } finally {
      this.loading = false;
    }
  }

  private async deletePrompt(id: string) {
    if (!this.client) return;
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      await this.client.deletePrompt(id);
      await this.loadPrompts();
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete prompt';
    }
  }

  private openEditModal(prompt: AIPromptListItem | null = null) {
    this.editingPrompt = prompt;
    this.showModal = true;
  }

  private closeModal() {
    this.showModal = false;
    this.editingPrompt = null;
  }

  private async savePrompt(data: {
    name: string;
    systemPrompt: string;
    userPrompt: string;
    model: string;
    variables?: Record<string, unknown>;
    isPublic: boolean;
  }) {
    if (!this.client) return;

    try {
      if (this.editingPrompt) {
        await this.client.updatePrompt(this.editingPrompt.id, data);
      } else {
        await this.client.createPrompt(data);
      }
      await this.loadPrompts();
      this.closeModal();
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to save prompt';
    }
  }

  private get filteredPrompts() {
    if (!this.searchQuery) return this.prompts;
    const query = this.searchQuery.toLowerCase();
    return this.prompts.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.model.toLowerCase().includes(query)
    );
  }

  override render() {
    return html`
      <div class="prompt-manager">
        <header class="prompt-manager-header">
          <div class="header-title">
            <span class="icon">${WorkspaceIcon()}</span>
            <h2>Prompt Library</h2>
          </div>
          <div class="header-actions">
            <input
              type="text"
              class="search-input"
              placeholder="Search prompts..."
              .value=${this.searchQuery}
              @input=${(e: InputEvent) => {
                this.searchQuery = (e.target as HTMLInputElement).value;
              }}
            />
            <button
              class="btn-primary"
              @click=${() => this.openEditModal()}
            >
              + New Prompt
            </button>
          </div>
        </header>

        ${choose(this.loading, [
          ['true', () => html`
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading prompts...</p>
            </div>
          `],
          ['false', () => this.error ? html`
            <div class="error-state">
              <p>${this.error}</p>
              <button @click=${() => this.loadPrompts()}>Retry</button>
            </div>
          ` : this.filteredPrompts.length === 0 ? html`
            <div class="empty-state">
              <p>No prompts found. Create your first custom prompt!</p>
            </div>
          ` : html`
            <div class="prompt-list">
              ${repeat(this.filteredPrompts, p => p.id, p => this.renderPromptItem(p))}
            </div>
          `],
        ])}

        ${this.showModal ? this.renderModal() : nothing}
      </div>
    `;
  }

  private renderPromptItem(prompt: AIPromptListItem) {
    return html`
      <div class="prompt-item">
        <div class="prompt-info">
          <div class="prompt-header">
            <span class="prompt-name">${prompt.name}</span>
            <span class="prompt-badges">
              ${prompt.isPublic ? html`<span class="badge badge-public">Public</span>` : ''}
              <span class="badge badge-model">${prompt.model}</span>
            </span>
          </div>
          <div class="prompt-meta">
            <span>Used ${prompt.usageCount} times</span>
            <span>•</span>
            <span>${new Date(prompt.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="prompt-actions">
          <button
            class="btn-icon"
            @click=${() => this.openEditModal(prompt)}
            title="Edit"
          >
            ✏️
          </button>
          <button
            class="btn-icon btn-danger"
            @click=${() => this.deletePrompt(prompt.id)}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  private renderModal() {
    return html`
      <div class="modal-overlay" @click=${this.closeModal}>
        <div class="modal-content" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-header">
            <h3>${this.editingPrompt ? 'Edit Prompt' : 'New Prompt'}</h3>
            <button class="btn-close" @click=${this.closeModal}>×</button>
          </div>
          <ai-prompt-editor
            .prompt=${this.editingPrompt}
            .onSave=${(data: any) => this.savePrompt(data)}
            .onCancel=${() => this.closeModal()}
          ></ai-prompt-editor>
        </div>
      </div>
    `;
  }
}

@customElement('ai-prompt-editor')
export class AIPromptEditor extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .editor-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 14px;
      font-weight: 500;
      color: var(--affine-text-secondary-color);
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
      padding: 10px 12px;
      border: 1px solid var(--affine-border-color);
      border-radius: 8px;
      font-size: 14px;
      font-family: var(--affine-font-sans-family);
      background: var(--affine-background-primary-color);
      color: var(--affine-text-primary-color);
    }

    .form-group textarea {
      min-height: 100px;
      resize: vertical;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 13px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .form-row .form-group {
      flex: 1;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid var(--affine-divider-color);
    }

    .btn-primary,
    .btn-secondary {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background: var(--affine-primary-color);
      color: var(--affine-background-primary-color);
    }

    .btn-secondary {
      background: var(--affine-hover-color);
      color: var(--affine-text-primary-color);
    }

    .variables-help {
      font-size: 12px;
      color: var(--affine-text-secondary-color);
      padding: 12px;
      background: var(--affine-background-secondary-color);
      border-radius: 8px;
    }

    .variables-help code {
      background: var(--affine-background-code-block);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', monospace;
    }
  `;

  @property({ attribute: false })
  prompt: AIPromptListItem | null = null;

  @property({ attribute: false })
  onSave!: (data: {
    name: string;
    systemPrompt: string;
    userPrompt: string;
    model: string;
    isPublic: boolean;
  }) => void;

  @property({ attribute: false })
  onCancel!: () => void;

  @state()
  private formData = {
    name: '',
    systemPrompt: 'You are a helpful AI assistant.',
    userPrompt: 'Please respond to the following:\n{{content}}',
    model: 'gpt-5-mini',
    isPublic: false,
  };

  override connectedCallback() {
    super.connectedCallback();
    if (this.prompt) {
      this.formData = {
        name: this.prompt.name,
        systemPrompt: 'You are a helpful AI assistant.',
        userPrompt: 'Please respond to the following:\n{{content}}',
        model: this.prompt.model,
        isPublic: this.prompt.isPublic,
      };
    }
  }

  private handleSubmit() {
    if (!this.formData.name.trim()) {
      alert('Please enter a prompt name');
      return;
    }
    this.onSave(this.formData);
  }

  override render() {
    return html`
      <form class="editor-form" @submit=${(e: Event) => { e.preventDefault(); this.handleSubmit(); }}>
        <div class="form-group">
          <label for="prompt-name">Prompt Name *</label>
          <input
            id="prompt-name"
            type="text"
            required
            placeholder="My Custom Prompt"
            .value=${this.formData.name}
            @input=${(e: InputEvent) => {
              this.formData.name = (e.target as HTMLInputElement).value;
            }}
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="prompt-model">Model</label>
            <select
              id="prompt-model"
              .value=${this.formData.model}
              @change=${(e: Event) => {
                this.formData.model = (e.target as HTMLSelectElement).value;
              }}
            >
              <option value="gpt-5-mini">GPT-5 Mini</option>
              <option value="gpt-5">GPT-5</option>
              <option value="claude-sonnet-4-5@20250929">Claude Sonnet 4.5</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            </select>
          </div>

          <div class="form-group">
            <label>
              <label>
                <input
                  type="checkbox"
                  .checked=${this.formData.isPublic}
                  @change=${(e: Event) => {
                    this.formData.isPublic = (e.target as HTMLInputElement).checked;
                  }}
                />
                Make public
              </label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="system-prompt">System Prompt</label>
          <textarea
            id="system-prompt"
            placeholder="You are a helpful AI assistant..."
            .value=${this.formData.systemPrompt}
            @input=${(e: InputEvent) => {
              this.formData.systemPrompt = (e.target as HTMLTextAreaElement).value;
            }}
          ></textarea>
        </div>

        <div class="form-group">
          <label for="user-prompt">User Prompt Template</label>
          <textarea
            id="user-prompt"
            placeholder="Please respond to the following: {{content}}"
            .value=${this.formData.userPrompt}
            @input=${(e: InputEvent) => {
              this.formData.userPrompt = (e.target as HTMLTextAreaElement).value;
            }}
          ></textarea>
        </div>

        <div class="variables-help">
          <strong>Available variables:</strong>
          <code>{{content}}</code> - Selected text or document content
          <code>{{language}}</code> - For translation actions
          <code>{{tone}}</code> - For tone changes
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click=${this.onCancel}>
            Cancel
          </button>
          <button type="submit" class="btn-primary">
            ${this.prompt ? 'Save Changes' : 'Create Prompt'}
          </button>
        </div>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-ai-prompt-manager': AffineAIPromptManager;
    'ai-prompt-editor': AIPromptEditor;
  }
}
