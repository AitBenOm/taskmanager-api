import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GroupsService } from 'src/groups/groups.service';
import { WorkspaceService } from 'src/workspace/workspace.service';
import { ActivityService } from 'src/activity/activity.service';
import { Task, TaskPriority, TaskStatus } from '@prisma/client';

import {
  AssignTaskDto,
  CreateTaskDto,
  QueryTaskDto,
  UpdateTaskDto,
} from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupsService: GroupsService,
    private readonly workspaceService: WorkspaceService,
    private readonly activityService: ActivityService,
  ) {}

  // ------------------------------------------------------
  // CREATE TASK
  // ------------------------------------------------------
  async createTask(userId: string, dto: CreateTaskDto): Promise<Task> {
    const callerMembership = await this.groupsService.validateUserInGroup(
      userId,
      dto.groupId,
    );

    const workspaceId = await this.groupsService.getGroupWorkspaceId(
      dto.groupId,
    );

    if (!workspaceId) {
      throw new NotFoundException('Group does not belong to any workspace');
    }

    await this.workspaceService.validateUserInWorkspace(userId, workspaceId);

    const callerRole = callerMembership.role;
    if (!['ADMIN', 'OWNER', 'MEMBER'].includes(callerRole)) {
      throw new NotFoundException('Only group members can create tasks');
    }

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? TaskPriority.MEDIUM,
        status: dto.status ?? TaskStatus.TODO,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        groupId: dto.groupId,
        createdById: userId,
        parentId: dto.parentId ?? null,
      },
    });

    await this.activityService.logTaskCreation(userId, task);

    return task;
  }

  // ------------------------------------------------------
  // GET TASKS WITH FILTERS
  // ------------------------------------------------------
  async getTasks(userId: string, query: QueryTaskDto): Promise<Task[]> {
    const filters: Record<string, unknown> = {};

    // Filter by group
    if (query.groupId) {
      await this.groupsService.validateUserInGroup(userId, query.groupId);

      const workspaceId = await this.groupsService.getGroupWorkspaceId(
        query.groupId,
      );

      if (workspaceId) {
        await this.workspaceService.validateUserInWorkspace(
          userId,
          workspaceId,
        );
      }

      filters.groupId = query.groupId;
    }

    // Filter by assigned user
    if (query.userId) {
      if (!query.groupId) {
        throw new NotFoundException(
          'User filter requires a groupId for permission validation',
        );
      }

      await this.groupsService.validateUserInGroup(userId, query.groupId);

      filters.assignedToId = query.userId;
    }

    // Filter by status
    if (query.status) {
      filters.status = query.status;
    }

    // Filter by priority
    if (query.priority) {
      filters.priority = query.priority;
    }

    // Search
    if (query.search) {
      filters.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.dueDate) {
      filters.dueDate = new Date(query.dueDate);
    }

    if (query.parentId !== undefined) {
      filters.parentId = query.parentId;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    return this.prisma.task.findMany({
      where: filters,
      include: { subtasks: true },
      orderBy: query.sortBy
        ? { [query.sortBy]: query.order ?? 'asc' }
        : { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  // ------------------------------------------------------
  // GET SINGLE TASK
  // ------------------------------------------------------
  async getTaskById(userId: string, taskId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { subtasks: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.groupsService.validateUserInGroup(userId, task.groupId);

    const workspaceId = await this.groupsService.getGroupWorkspaceId(
      task.groupId,
    );

    await this.workspaceService.validateUserInWorkspace(userId, workspaceId);

    return task;
  }

  // ------------------------------------------------------
  // UPDATE TASK
  // ------------------------------------------------------
  async updateTask(
    userId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const existing = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const callerMembership = await this.groupsService.validateUserInGroup(
      userId,
      existing.groupId,
    );
    const workspaceId = await this.groupsService.getGroupWorkspaceId(
      existing.groupId,
    );

    await this.workspaceService.validateUserInWorkspace(userId, workspaceId);

    const callerRole = callerMembership.role;

    if (callerRole === 'MEMBER') {
      const isCreator = existing.createdById === userId;
      const isAssignee = existing.assignedToId === userId;

      if (!isCreator && !isAssignee) {
        throw new NotFoundException(
          'Members can only update tasks they created or are assigned to',
        );
      }
    } else if (!['ADMIN', 'OWNER'].includes(callerRole)) {
      throw new NotFoundException('Only admins and owners can update tasks');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : existing.dueDate,
        parentId: dto.parentId ?? existing.parentId,
        assignedToId: dto.assignedToId ?? existing.assignedToId,
      },
    });

    await this.activityService.logTaskUpdate(userId, existing, updatedTask);

    if (dto.status && dto.status !== existing.status) {
      await this.activityService.logStatusChange(
        userId,
        updatedTask,
        existing.status,
        dto.status,
      );
    }

    return updatedTask;
  }

  // ------------------------------------------------------
  // DELETE TASK
  // ------------------------------------------------------
  async deleteTask(userId: string, taskId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const callerMembership = await this.groupsService.validateUserInGroup(
      userId,
      task.groupId,
    );

    if (callerMembership.role === 'MEMBER' && task.createdById !== userId) {
      throw new NotFoundException('Members can only delete tasks they created');
    }

    const deleted = await this.prisma.task.delete({
      where: { id: taskId },
    });

    await this.activityService.logTaskDeletion(userId, task);

    return deleted;
  }

  // ------------------------------------------------------
  // ASSIGN TASK
  // ------------------------------------------------------
  async assignTask(
    userId: string,
    taskId: string,
    dto: AssignTaskDto,
  ): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const callerMembership = await this.groupsService.validateUserInGroup(
      userId,
      task.groupId,
    );

    if (!['ADMIN', 'OWNER'].includes(callerMembership.role)) {
      throw new NotFoundException('Only admins and owners can assign tasks');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { assignedToId: dto.userId ?? null },
    });
  }

  // ------------------------------------------------------
  // UNASSIGN USER
  // ------------------------------------------------------
  async unassignTask(userId: string, taskId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.groupsService.validateUserInGroup(userId, task.groupId);

    return this.prisma.task.update({
      where: { id: taskId },
      data: { assignedToId: null },
    });
  }

  // ------------------------------------------------------
  // GET TASKS BY GROUP
  // ------------------------------------------------------
  async getTasksByGroup(userId: string, groupId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        groupId,
        OR: [{ createdById: userId }, { assignedToId: userId }],
      },
    });
  }
}
