export type AIPromptListItem = {
  id: string;
  name: string;
  action: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  variables: Record<
    string,
    { type: string; default: string; description: string }
  > | null;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
};

const LIST_USER_PROMPTS = `
  query ListUserPrompts($workspaceId: String, $includePublic: Boolean) {
    workspace(id: $workspaceId) {
      userPrompts(includePublic: $includePublic) {
        id
        name
        action
        model
        systemPrompt
        userPrompt
        variables
        isPublic
        usageCount
        createdAt
        updatedAt
      }
    }
  }
`;

const CREATE_USER_PROMPT = `
  mutation CreateUserPrompt($input: CreateUserPromptInput!) {
    createUserPrompt(input: $input) {
      id
      name
      action
      model
      systemPrompt
      userPrompt
      variables
      isPublic
      usageCount
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_USER_PROMPT = `
  mutation UpdateUserPrompt($id: ID!, $input: UpdateUserPromptInput!) {
    updateUserPrompt(id: $id, input: $input) {
      id
      name
      action
      model
      systemPrompt
      userPrompt
      variables
      isPublic
      usageCount
      createdAt
      updatedAt
    }
  }
`;

const DELETE_USER_PROMPT = `
  mutation DeleteUserPrompt($id: ID!) {
    deleteUserPrompt(id: $id) {
      id
    }
  }
`;

const EXECUTE_USER_PROMPT = `
  mutation ExecuteUserPrompt($id: ID!, $input: ExecuteUserPromptInput) {
    executeUserPrompt(id: $id, input: $input) {
      model
      messages {
        role
        content
      }
    }
  }
`;

export class AIPromptClient {
  constructor(private workspaceId: string) {}

  async listPrompts(includePublic = true): Promise<AIPromptListItem[]> {
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: LIST_USER_PROMPTS,
        variables: {
          workspaceId: this.workspaceId,
          includePublic,
        },
      }),
    });

    const result = await response.json();
    return result.data?.workspace?.userPrompts || [];
  }

  async createPrompt(data: {
    name: string;
    systemPrompt?: string;
    userPrompt: string;
    model?: string;
    variables?: Record<string, unknown>;
    isPublic?: boolean;
  }): Promise<AIPromptListItem> {
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: CREATE_USER_PROMPT,
        variables: {
          input: {
            ...data,
            workspaceId: this.workspaceId,
          },
        },
      }),
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    return result.data?.createUserPrompt;
  }

  async updatePrompt(
    id: string,
    data: {
      name?: string;
      systemPrompt?: string;
      userPrompt?: string;
      model?: string;
      variables?: Record<string, unknown>;
      isPublic?: boolean;
    }
  ): Promise<AIPromptListItem> {
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: UPDATE_USER_PROMPT,
        variables: { id, input: data },
      }),
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    return result.data?.updateUserPrompt;
  }

  async deletePrompt(id: string): Promise<void> {
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: DELETE_USER_PROMPT,
        variables: { id },
      }),
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
  }

  async executePrompt(
    id: string,
    variables?: Record<string, unknown>
  ): Promise<{
    model: string;
    messages: Array<{ role: string; content: string }>;
  }> {
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: EXECUTE_USER_PROMPT,
        variables: {
          id,
          input: { variables },
        },
      }),
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    return result.data?.executeUserPrompt;
  }
}
