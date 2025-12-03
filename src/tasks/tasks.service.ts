import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GroupsService } from 'src/groups/groups.service';
import { UsersService } from 'src/users/users.service';
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
    private prisma: PrismaService,
    private groupsService: GroupsService,
    private usersService: UsersService,
  ) {}

  // ------------------------------------------------------
  // CREATE TASK
  // ------------------------------------------------------
  async createTask(userId: string, dto: CreateTaskDto): Promise<Task> {
    const callerMemberShip = await this.groupsService.validateUserInGroup(
      userId,
      dto.groupId,
    );

    let callerRole = callerMemberShip.role;
    if (
      callerRole !== 'ADMIN' &&
      callerRole !== 'OWNER' &&
      callerRole !== 'MEMBER'
    ) {
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
      },
    });

    // TODO E.8 — activity log
    // TODO E.9 — calendar sync
    // TODO Phase H — notifications

    return task as Task;
  }

  // ------------------------------------------------------
  // GET TASKS WITH FILTERS + PAGINATION + SORTING
  // ------------------------------------------------------
  async getTasks(userId: string, query: QueryTaskDto) {
    const filters: any = {};

    // E.5.1 — Filter by group
    if (query.groupId) {
      await this.groupsService.validateUserInGroup(userId, query.groupId);
      filters.groupId = query.groupId;
    }

    // E.5.2 — Filter by assigned user
    if (query.userId) {
      await this.groupsService.validateUserInGroup(userId, query.groupId);
      filters.assignedToId = query.userId;
    }

    // E.5.3 — Filter by status
    if (query.status) {
      filters.status = query.status;
    }

    // E.5.4 — Filter by priority
    if (query.priority) {
      filters.priority = query.priority;
    }

    // E.5.5 — Full-text search
    if (query.search) {
      filters.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // E.5.6 — Filter by due date
    if (query.dueDate) {
      filters.dueDate = new Date(query.dueDate);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const tasks = await this.prisma.task.findMany({
      where: filters,
      orderBy: query.sortBy
        ? { [query.sortBy]: query.order ?? 'asc' }
        : { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return tasks as Task[];
  }

  // ------------------------------------------------------
  // GET SINGLE TASK
  // ------------------------------------------------------
  async getTaskById(userId: string, taskId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.groupsService.validateUserInGroup(userId, task.groupId);

    return task as Task;
  }

  // ------------------------------------------------------
  // UPDATE TASK
  // ------------------------------------------------------
  async updateTask(
    userId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) throw new NotFoundException('Task not found');

    const callerMembership = await this.groupsService.validateUserInGroup(
      userId,
      task.groupId,
    );
    const callerRole = callerMembership.role;

    if (callerRole === 'MEMBER') {
      const isCreator = task.createdById === userId;
      const isAssignee = task.assignedToId === userId;
      if (!isCreator && !isAssignee) {
        throw new NotFoundException(
          'Members can only update tasks they created or are assigned to',
        );
      }
    } else if (callerRole !== 'ADMIN' && callerRole !== 'OWNER') {
      throw new NotFoundException('Only admins and owners can update tasks');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : task.dueDate,
      },
    });

    // TODO E.8 — log update
    // TODO E.9 — calendar sync

    return updatedTask as Task;
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
    const callerRole = callerMembership.role;

    if (callerRole === 'MEMBER' && task.createdById !== userId) {
      throw new NotFoundException('Members can only delete tasks they created');
    }

    const deleted = await this.prisma.task.delete({
      where: { id: taskId },
    });

    // TODO E.8 — log deletion

    return deleted as Task;
  }

  // ------------------------------------------------------
  // ASSIGN TASK TO USER
  // ------------------------------------------------------
  async assignTask(
    userId: string,
    taskId: string,
    dto: AssignTaskDto,
  ): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) throw new NotFoundException('Task not found');
    const groupId = task.groupId;

    // 2. Validate caller membership
    const callerMembership = await this.groupsService.validateUserInGroup(
      userId,
      groupId,
    );

    const callerRole = callerMembership.role;

    if (callerRole !== 'ADMIN' && callerRole !== 'OWNER') {
      throw new NotFoundException('Only admins and owners can assign tasks');
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: dto.userId ?? null,
      },
    });

    return updated as Task;
  }

  // ------------------------------------------------------
  // UNASSIGN USER FROM TASK
  // ------------------------------------------------------
  async unassignTask(userId: string, taskId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) throw new NotFoundException('Task not found');

    await this.groupsService.validateUserInGroup(userId, task.groupId);

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: null,
      },
    });

    return updated as Task;
  }

  getTasksByGroup(userId: string, groupId: string) {
    return this.prisma.task.findMany({
      where: {
        groupId,
        OR: [{ createdById: userId }, { assignedToId: userId }],
      },
    });
  }
}
