import { useLiveData, useService } from '@toeverything/infra';
import { useEffect, useState } from 'react';

import { Global } from '@emotion/react';

import type { AIPromptListItem } from '../../../../../components/affine/ai-prompts/client';
import { AIPromptClient } from '../../../../../components/affine/ai-prompts/client';
import { WorkspaceService } from '@affine/core/modules/workspace';
import { aiPromptsStyles } from './styles';

export const WorkspaceSettingAIPrompts = () => {
  const workspaceService = useService(WorkspaceService);
  const workspaceId = workspaceService.workspace.id;
  const [client, setClient] = useState<AIPromptClient | null>(null);

  const [prompts, setPrompts] = useState<AIPromptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AIPromptListItem | null>(
    null
  );

  useEffect(() => {
    setClient(new AIPromptClient(workspaceId));
  }, [workspaceId]);

  const loadPrompts = async () => {
    if (!client) return;
    setLoading(true);
    setError(null);
    try {
      const data = await client.listPrompts();
      setPrompts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (client) {
      loadPrompts();
    }
  }, [client]);

  const handleDelete = async (id: string) => {
    if (!client) return;
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    try {
      await client.deletePrompt(id);
      await loadPrompts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete prompt');
    }
  };

  const handleSave = async (data: {
    name: string;
    systemPrompt: string;
    userPrompt: string;
    model: string;
    isPublic: boolean;
  }) => {
    if (!client) return;
    try {
      if (editingPrompt) {
        await client.updatePrompt(editingPrompt.id, data);
      } else {
        await client.createPrompt(data);
      }
      setShowCreateModal(false);
      setEditingPrompt(null);
      await loadPrompts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save prompt');
    }
  };

  const filteredPrompts = prompts.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <AIPromptsSettingsStyles />
      <div className="ai-prompts-settings">
        <div className="ai-prompts-header">
          <div className="ai-prompts-title">
            <h2>AI Prompts Library</h2>
            <p class="subtitle">
              Create and manage custom AI prompts for your workspace
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setEditingPrompt(null);
              setShowCreateModal(true);
            }}
          >
            + New Prompt
          </button>
        </div>

        <div className="ai-prompts-search">
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {error && (
          <div className="ai-prompts-error">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {loading ? (
          <div className="ai-prompts-loading">
            <div className="spinner"></div>
            <p>Loading prompts...</p>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="ai-prompts-empty">
            <p>
              {searchQuery
                ? 'No prompts found matching your search.'
                : 'No custom prompts yet. Create your first one!'}
            </p>
          </div>
        ) : (
          <div className="ai-prompts-list">
            {filteredPrompts.map(prompt => (
              <div key={prompt.id} className="ai-prompt-item">
                <div className="ai-prompt-info">
                  <div className="ai-prompt-header">
                    <span className="ai-prompt-name">{prompt.name}</span>
                    <div className="ai-prompt-badges">
                      {prompt.isPublic && (
                        <span className="badge badge-public">Public</span>
                      )}
                      <span className="badge badge-model">{prompt.model}</span>
                    </div>
                  </div>
                  <div className="ai-prompt-meta">
                    <span>Used {prompt.usageCount} times</span>
                    <span>•</span>
                    <span>
                      {new Date(prompt.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="ai-prompt-actions">
                  <button
                    className="btn-icon"
                    onClick={() => {
                      setEditingPrompt(prompt);
                      setShowCreateModal(true);
                    }}
                    title="Edit"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDelete(prompt.id)}
                    title="Delete"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreateModal && (
          <div
            className="ai-prompts-modal-overlay"
            onClick={() => setShowCreateModal(false)}
          >
            <div
              className="ai-prompts-modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="ai-prompts-modal-header">
                <h3>{editingPrompt ? 'Edit Prompt' : 'New Prompt'}</h3>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPrompt(null);
                  }}
                >
                  ×
                </button>
              </div>
              <AIPromptEditor
                prompt={editingPrompt}
                onSave={handleSave}
                onCancel={() => {
                  setShowCreateModal(false);
                  setEditingPrompt(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const AIPromptEditor = ({
  prompt,
  onSave,
  onCancel,
}: {
  prompt: AIPromptListItem | null;
  onSave: (data: {
    name: string;
    systemPrompt: string;
    userPrompt: string;
    model: string;
    isPublic: boolean;
  }) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: prompt?.name || '',
    systemPrompt: prompt?.systemPrompt || 'You are a helpful AI assistant.',
    userPrompt:
      prompt?.userPrompt || 'Please respond to the following:\n{{content}}',
    model: prompt?.model || 'gpt-5-mini',
    isPublic: prompt?.isPublic || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a prompt name');
      return;
    }
    onSave(formData);
  };

  return (
    <form className="ai-prompt-editor" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Prompt Name *</label>
        <input
          type="text"
          required
          placeholder="My Custom Prompt"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Model</label>
          <select
            value={formData.model}
            onChange={e => setFormData({ ...formData, model: e.target.value })}
          >
            <option value="gpt-5-mini">GPT-5 Mini</option>
            <option value="gpt-5">GPT-5</option>
            <option value="claude-sonnet-4-5@20250929">
              Claude Sonnet 4.5
            </option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          </select>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={e =>
                setFormData({ ...formData, isPublic: e.target.checked })
              }
            />
            Make public
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>System Prompt</label>
        <textarea
          placeholder="You are a helpful AI assistant..."
          value={formData.systemPrompt}
          onChange={e =>
            setFormData({ ...formData, systemPrompt: e.target.value })
          }
        />
      </div>

      <div className="form-group">
        <label>User Prompt Template</label>
        <textarea
          placeholder="Please respond to the following: {{content}}"
          value={formData.userPrompt}
          onChange={e =>
            setFormData({ ...formData, userPrompt: e.target.value })
          }
        />
      </div>

      <div className="variables-help">
        <strong>Available variables:</strong>
        <code>{'{{content}}'}</code> - Selected text or document content
        <code>{'{{action}}'}</code> - For translation actions
        <code>{'{{tone}}'}</code> - For tone changes
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {prompt ? 'Save Changes' : 'Create Prompt'}
        </button>
      </div>
    </form>
  );
};

export const AIPromptsSettingsStyles = () => (
  <Global styles={aiPromptsStyles} />
);
