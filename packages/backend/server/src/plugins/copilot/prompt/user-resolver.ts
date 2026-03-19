import {
  Args,
  Field,
  ID,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Parent,
  Query,
  registerEnumType,
  Resolver,
  ResolveField,
} from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

import { Throttle } from '../../../base';
import { CurrentUser } from '../../../core/auth';
import { UserType } from '../../../core/user';
import type {
  CreateUserPromptInput,
  ExecuteUserPromptInput,
  UpdateUserPromptInput,
} from './user-prompts';
import { UserPromptService } from './user-prompts';

// ================== Input Types ==================

@InputType()
class CreateUserPromptInputType implements Omit<
  CreateUserPromptInput,
  'workspaceId'
> {
  @Field(() => String)
  name!: string;

  @Field(() => String, { nullable: true })
  systemPrompt?: string;

  @Field(() => String)
  userPrompt!: string;

  @Field(() => String, { nullable: true })
  model?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  variables?: Record<
    string,
    { type: string; default: string; description: string }
  >;

  @Field(() => Boolean, { nullable: true })
  isPublic?: boolean;

  @Field(() => String, { nullable: true })
  workspaceId?: string;
}

@InputType()
class UpdateUserPromptInputType implements Omit<
  UpdateUserPromptInput,
  'workspaceId'
> {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  systemPrompt?: string;

  @Field(() => String, { nullable: true })
  userPrompt?: string;

  @Field(() => String, { nullable: true })
  model?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  variables?: Record<
    string,
    { type: string; default: string; description: string }
  >;

  @Field(() => Boolean, { nullable: true })
  isPublic?: boolean;
}

@InputType()
class ExecuteUserPromptInputType {
  @Field(() => GraphQLJSON, { nullable: true })
  variables?: Record<string, any>;
}

// ================== Return Types ==================

@ObjectType('UserPromptVariable')
class UserPromptVariableType {
  @Field(() => String)
  type!: string;

  @Field(() => String)
  default!: string;

  @Field(() => String)
  description!: string;
}

@ObjectType('UserPrompt')
class UserPromptType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  action!: string;

  @Field(() => String)
  model!: string;

  @Field(() => String)
  systemPrompt!: string;

  @Field(() => String)
  userPrompt!: string;

  @Field(() => [UserPromptVariableType], { nullable: true })
  variables!: Record<string, UserPromptVariableType> | null;

  @Field(() => Boolean)
  isPublic!: boolean;

  @Field(() => Int)
  usageCount!: number;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}

@ObjectType('ExecutedUserPrompt')
class ExecutedUserPromptType {
  @Field(() => String)
  model!: string;

  @Field(() => [PromptMessageType])
  messages!: PromptMessageType[];
}

@ObjectType('PromptMessage')
class PromptMessageType {
  @Field(() => String)
  role!: string;

  @Field(() => String)
  content!: string;
}

// ================== Resolver ==================

@Throttle()
@Resolver(() => UserType)
export class UserPromptResolver {
  constructor(private readonly userPromptService: UserPromptService) {}

  @ResolveField(() => [UserPromptType], {
    description: 'Get user prompts and public prompts',
  })
  async userPrompts(
    @Parent() user: UserType,
    @Args('workspaceId', { nullable: true }) workspaceId?: string,
    @Args('includePublic', { nullable: true }) includePublic?: boolean
  ) {
    const prompts = await this.userPromptService.list(
      user.id,
      workspaceId,
      includePublic ?? true
    );
    return prompts.map(this.toType);
  }

  @ResolveField(() => UserPromptType, {
    description: 'Get a specific user prompt by ID',
    nullable: true,
  })
  async userPrompt(@Parent() user: UserType, @Args('id') id: string) {
    const prompt = await this.userPromptService.get(id, user.id);
    return prompt ? this.toType(prompt) : null;
  }

  @Query(() => [UserPromptType], {
    description: 'Search user prompts',
  })
  async searchUserPrompts(
    @CurrentUser() user: CurrentUser,
    @Args('query') query: string,
    @Args('workspaceId', { nullable: true }) workspaceId?: string
  ) {
    const prompts = await this.userPromptService.search(
      user.id,
      query,
      workspaceId
    );
    return prompts.map(this.toType);
  }

  @Mutation(() => UserPromptType, {
    description: 'Create a new user prompt',
  })
  async createUserPrompt(
    @CurrentUser() user: CurrentUser,
    @Args('input') input: CreateUserPromptInputType
  ) {
    const prompt = await this.userPromptService.create(user.id, {
      name: input.name,
      systemPrompt: input.systemPrompt,
      userPrompt: input.userPrompt,
      model: input.model,
      variables: input.variables as any,
      isPublic: input.isPublic,
      workspaceId: input.workspaceId,
    });
    return this.toType(prompt);
  }

  @Mutation(() => UserPromptType, {
    description: 'Update a user prompt',
  })
  async updateUserPrompt(
    @CurrentUser() user: CurrentUser,
    @Args('id') id: string,
    @Args('input') input: UpdateUserPromptInputType
  ) {
    const prompt = await this.userPromptService.update(id, user.id, input);
    return this.toType(prompt);
  }

  @Mutation(() => UserPromptType, {
    description: 'Delete a user prompt',
  })
  async deleteUserPrompt(
    @CurrentUser() user: CurrentUser,
    @Args('id') id: string
  ) {
    const prompt = await this.userPromptService.delete(id, user.id);
    return this.toType(prompt);
  }

  @Mutation(() => ExecutedUserPromptType, {
    description: 'Execute a user prompt with variables',
  })
  async executeUserPrompt(
    @CurrentUser() user: CurrentUser,
    @Args('id') id: string,
    @Args('input', { nullable: true }) input?: ExecuteUserPromptInputType
  ) {
    const result = await this.userPromptService.execute(id, user.id, {
      variables: input?.variables,
    });
    return {
      model: result.model,
      messages: result.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    };
  }

  private toType(prompt: any) {
    return {
      id: prompt.id,
      name: prompt.name,
      action: prompt.action,
      model: prompt.model,
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      variables: prompt.variables,
      isPublic: prompt.isPublic,
      usageCount: prompt.usageCount,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    };
  }
}
