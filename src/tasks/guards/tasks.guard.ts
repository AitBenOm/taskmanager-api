import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { GroupsService } from 'src/groups/groups.service';

interface RequestWithUser extends Request {
  user?: { id: string } | null;
}

@Injectable()
export class TasksGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupsService: GroupsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('User not authenticated');
    }

    let taskId: string | undefined;
    if (typeof request.params?.id === 'string') {
      taskId = request.params.id;
    }

    let groupIdFromQuery: string | undefined;
    const q = request.query?.groupId;
    if (typeof q === 'string') {
      groupIdFromQuery = q;
    } else if (Array.isArray(q) && q.length > 0 && typeof q[0] === 'string') {
      groupIdFromQuery = q[0];
    }

    const body: unknown = request.body;

    const groupIdFromBody =
      typeof body === 'object' &&
      body !== null &&
      'groupId' in body &&
      typeof (body as Record<string, unknown>).groupId === 'string'
        ? (body as Record<string, unknown>).groupId
        : undefined;

    // ---------------------------------------------
    // 1. If taskId is provided → validate access to that task
    // ---------------------------------------------
    if (taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new ForbiddenException('Task does not exist or access is denied');
      }

      await this.groupsService.validateUserInGroup(user.id, task.groupId);
      return true;
    }

    // ---------------------------------------------
    // 2. validate groupId in query → listing/filtering
    // ---------------------------------------------
    if (groupIdFromQuery) {
      await this.groupsService.validateUserInGroup(user.id, groupIdFromQuery);
      return true;
    }

    // ---------------------------------------------
    // 3. validate groupId in body → creation
    // ---------------------------------------------
    if (groupIdFromBody) {
      await this.groupsService.validateUserInGroup(user.id, groupIdFromBody);
      return true;
    }

    // ---------------------------------------------
    // 4. Default allow → getTasks() enforces filtering
    // ---------------------------------------------
    return true;
  }
}
