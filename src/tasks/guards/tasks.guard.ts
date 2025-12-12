import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { GroupsService } from 'src/groups/groups.service';

/**
 * Extend Express Request ONLY with what Express does not know about.
 * Never redefine body / params / query.
 */
interface RequestWithUser extends Request {
  user?: { id: string } | null;
}

/**
 * Lint-safe + TypeScript-safe helper to extract a string property from unknown.
 * This avoids repeating verbose guards everywhere.
 */
function getStringProp(
  value: unknown,
  key: string,
): string | undefined {
  if (
    typeof value === 'object' &&
    value !== null &&
    key in value &&
    typeof (value as Record<string, unknown>)[key] === 'string'
  ) {
    return (value as Record<string, unknown>)[key] as string;
  }

  return undefined;
}

@Injectable()
export class TasksGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupsService: GroupsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // --------------------------------------------------
    // 0. User must be authenticated
    // --------------------------------------------------
    if (!user?.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // --------------------------------------------------
    // 1. Extract identifiers safely (strict lint + TS)
    // --------------------------------------------------
    const taskId =
      typeof request.params?.id === 'string'
        ? request.params.id
        : undefined;

    const groupIdFromQuery = getStringProp(
      request.query as unknown,
      'groupId',
    );

    const groupIdFromBody = getStringProp(
      request.body as unknown,
      'groupId',
    );

    // --------------------------------------------------
    // 2. If taskId exists → validate access to the task
    // --------------------------------------------------
    if (taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new ForbiddenException(
          'Task does not exist or access is denied',
        );
      }

      await this.groupsService.validateUserInGroup(
        user.id,
        task.groupId,
      );

      return true;
    }

    // --------------------------------------------------
    // 3. groupId in query → listing / filtering
    // --------------------------------------------------
    if (groupIdFromQuery) {
      await this.groupsService.validateUserInGroup(
        user.id,
        groupIdFromQuery,
      );
      return true;
    }

    // --------------------------------------------------
    // 4. groupId in body → creation
    // --------------------------------------------------
    if (groupIdFromBody) {
      await this.groupsService.validateUserInGroup(
        user.id,
        groupIdFromBody,
      );
      return true;
    }

    // --------------------------------------------------
    // 5. Default allow (service enforces filtering)
    // --------------------------------------------------
    return true;
  }
}
