import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';
import { GroupsService } from 'src/groups/groups.service';

@Injectable()
export class TasksGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private groupsService: GroupsService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // GET route parameters
    const taskId = request.params.id;
    const groupIdFromQuery = request.query.groupId;
    const groupIdFromBody = request.body?.groupId;

    // ---------------------------------------------
    // 1. If taskId is provided → validate access to that task
    // ---------------------------------------------
    if (taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new ForbiddenException('Task does not exist or access denied');
      }

      // Validate user.ts membership in task's group
      await this.groupsService.validateUserInGroup(user.id, task.groupId);
      return true;
    }

    // ---------------------------------------------
    // 2. If groupId exists in query → validate for listing/filtering
    // ---------------------------------------------
    if (groupIdFromQuery) {
      await this.groupsService.validateUserInGroup(user.id, groupIdFromQuery);
      return true;
    }

    // ---------------------------------------------
    // 3. If groupId exists in body → validate for creation
    // ---------------------------------------------
    if (groupIdFromBody) {
      await this.groupsService.validateUserInGroup(user.id, groupIdFromBody);
      return true;
    }

    // ---------------------------------------------
    // 4. Default allow (e.g., fetch all tasks for user.ts)
    //    getTasks() will further filter by userId or groupId
    // ---------------------------------------------
    return true;
  }
}
