import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaClient, UserPrompt } from '@prisma/client';

import { BadRequestException } from '../../../base';
import type { PromptMessage } from '../providers/types';

export interface CreateUserPromptInput {
  name: string;
  systemPrompt?: string;
  userPrompt: string;
  model?: string;
  variables?: Record<string, { type: string; default: string; description: string }>;
  isPublic?: boolean;
  workspaceId?: string;
}

export interface UpdateUserPromptInput {
  name?: string;
  systemPrompt?: string;
  userPrompt?: string;
  model?: string;
  variables?: Record<string, { type: string; default: string; description: string }>;
  isPublic?: boolean;
}

export interface ExecuteUserPromptInput {
  variables?: Record<string, any>;
}

/**
 * Service for managing user-defined AI prompts
 * Allows users to create, edit, and share custom AI prompts
 */
@Injectable()
export class UserPromptService {
  private readonly logger = new Logger(UserPromptService.name);

  constructor(private readonly db: PrismaClient) {}

  /**
   * Create a new user prompt
   */
  async create(userId: string, input: CreateUserPromptInput): Promise<UserPrompt> {
    // Check if prompt with same name exists for this user
    const existing = await this.db.userPrompt.findFirst({
      where: {
        userId,
        name: input.name,
        workspaceId: input.workspaceId || null,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Prompt with name "${input.name}" already exists`
      );
    }

    return this.db.userPrompt.create({
      data: {
        userId,
        name: input.name,
        action: 'custom',
        model: input.model || 'gpt-5-mini',
        systemPrompt: input.systemPrompt || 'You are a helpful AI assistant.',
        userPrompt: input.userPrompt,
        variables: input.variables || {},
        isPublic: input.isPublic || false,
        workspaceId: input.workspaceId,
      },
    });
  }

  /**
   * List prompts for a user, including public prompts from others
   */
  async list(
    userId: string,
    workspaceId?: string,
    includePublic = true
  ): Promise<UserPrompt[]> {
    const where: Prisma.UserPromptWhereInput = {
      deletedAt: null,
      OR: [
        { userId },
        ...(includePublic ? [{ isPublic: true }] : []),
      ],
    };

    if (workspaceId) {
      where.OR = [
        { userId, workspaceId },
        ...(includePublic ? [{ isPublic: true, workspaceId }] : []),
      ];
    }

    return this.db.userPrompt.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  /**
   * Get a specific prompt by ID
   */
  async get(id: string, userId: string): Promise<UserPrompt | null> {
    const prompt = await this.db.userPrompt.findUnique({
      where: { id },
    });

    if (!prompt || prompt.deletedAt) {
      return null;
    }

    // Check access: user must be owner or prompt must be public
    if (prompt.userId !== userId && !prompt.isPublic) {
      return null;
    }

    return prompt;
  }

  /**
   * Update a user prompt
   */
  async update(
    id: string,
    userId: string,
    input: UpdateUserPromptInput
  ): Promise<UserPrompt> {
    const prompt = await this.db.userPrompt.findUnique({
      where: { id },
    });

    if (!prompt || prompt.deletedAt) {
      throw new BadRequestException('Prompt not found');
    }

    if (prompt.userId !== userId) {
      throw new BadRequestException('You can only edit your own prompts');
    }

    return this.db.userPrompt.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Delete (soft delete) a user prompt
   */
  async delete(id: string, userId: string): Promise<UserPrompt> {
    const prompt = await this.db.userPrompt.findUnique({
      where: { id },
    });

    if (!prompt || prompt.deletedAt) {
      throw new BadRequestException('Prompt not found');
    }

    if (prompt.userId !== userId) {
      throw new BadRequestException('You can only delete your own prompts');
    }

    return this.db.userPrompt.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Increment usage count
   */
  async incrementUsage(id: string): Promise<void> {
    await this.db.userPrompt.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }

  /**
   * Execute a user prompt by interpolating variables
   */
  async execute(
    id: string,
    userId: string,
    input: ExecuteUserPromptInput
  ): Promise<{ messages: PromptMessage[]; model: string }> {
    const prompt = await this.get(id, userId);

    if (!prompt) {
      throw new BadRequestException('Prompt not found');
    }

    // Increment usage count
    await this.incrementUsage(id).catch(e => {
      this.logger.error('Failed to increment usage count', e);
    });

    // Interpolate variables in user prompt
    const userPrompt = this.interpolateVariables(
      prompt.userPrompt,
      input.variables || {},
      prompt.variables as Record<string, any> || {}
    );

    // Build messages array
    const messages: PromptMessage[] = [
      {
        role: 'system',
        content: prompt.systemPrompt || 'You are a helpful AI assistant.',
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ];

    return { messages, model: prompt.model };
  }

  /**
   * Interpolate variables into the prompt template
   */
  private interpolateVariables(
    template: string,
    values: Record<string, any>,
    variableDefinitions: Record<string, { type: string; default: string }>
  ): string {
    let result = template;

    // Replace {{variable}} with values
    for (const [key, definition] of Object.entries(variableDefinitions)) {
      const placeholder = `{{${key}}}`;
      const value = values[key] ?? definition.default ?? '';
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Replace standard variables
    result = result.replace(/\{\{content\}\}/g, values.content || '');
    result = result.replace(/\{\{language\}\}/g, values.language || 'English');
    result = result.replace(/\{\{tone\}\}/g, values.tone || 'Professional');

    return result;
  }

  /**
   * Search prompts by name or content
   */
  async search(
    userId: string,
    query: string,
    workspaceId?: string
  ): Promise<UserPrompt[]> {
    const where: Prisma.UserPromptWhereInput = {
      deletedAt: null,
      OR: [
        { userId },
        { isPublic: true },
      ],
      AND: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { userPrompt: { contains: query, mode: 'insensitive' } },
        ],
      },
    };

    if (workspaceId) {
      where.OR = [
        { userId, workspaceId },
        { isPublic: true, workspaceId },
      ];
    }

    return this.db.userPrompt.findMany({
      where,
      orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    });
  }
}
