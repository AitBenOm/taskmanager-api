import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Task } from '@prisma/client';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  // ------------------------------------------------------
  // GENERIC LOGGER (core entry point)
  // ------------------------------------------------------
  async createLog(params: {
    userId: string;
    taskId: string;
    groupId: string;
    workspaceId?: string | null;
    action: string;
    metadata?: Record<string, any>;
  }) {
    const data: Prisma.ActivityLogUncheckedCreateInput = {
      userId: params.userId,
      taskId: params.taskId,
      groupId: params.groupId,
      workspaceId: params.workspaceId ?? null,
      action: params.action,
      metadata: params.metadata ?? {},
      createdAt: new Date(),
    };

    return this.prisma.activityLog.create({ data });
  }

  // ------------------------------------------------------
  // 1) TASK CREATED
  // ------------------------------------------------------
  async logTaskCreation(userId: string, task: Task) {
    return this.createLog({
      userId,
      taskId: task?.id,
      groupId: task.groupId,
      workspaceId: null,
      action: 'TASK_CREATED',
      metadata: {
        title: task.title,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
      },
    });
  }

  // ------------------------------------------------------
  // 2) TASK UPDATED (full before/after diff)
  // ------------------------------------------------------
  async logTaskUpdate(userId: string, oldTask: Task, newTask: Task) {
    return this.createLog({
      userId,
      taskId: oldTask.id,
      groupId: oldTask.groupId,
      // workspaceId: oldTask.group?.workspaceId ?? null,
      action: 'TASK_UPDATED',
      metadata: {
        old: {
          title: oldTask.title,
          description: oldTask.description,
          priority: oldTask.priority,
          status: oldTask.status,
          dueDate: oldTask.dueDate,
        },
        new: {
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          status: newTask.status,
          dueDate: newTask.dueDate,
        },
      },
    });
  }

  // ------------------------------------------------------
  // 3) TASK DELETED
  // ------------------------------------------------------
  async logTaskDeletion(userId: string, task: Task) {
    return this.createLog({
      userId,
      taskId: task.id,
      groupId: task.groupId,
      //workspaceId: task.group?.workspaceId ?? null,
      action: 'TASK_DELETED',
      metadata: {
        title: task.title,
        priority: task.priority,
        status: task.status,
      },
    });
  }

  // ------------------------------------------------------
  // 4) ASSIGN TASK
  // ------------------------------------------------------
  async logTaskAssignment(userId: string, task: Task, assignedUserId: string) {
    return this.createLog({
      userId,
      taskId: task.id,
      groupId: task.groupId,
      //workspaceId: task.group?.workspaceId ?? null,
      action: 'TASK_ASSIGNED',
      metadata: {
        assignedTo: assignedUserId,
      },
    });
  }

  // ------------------------------------------------------
  // 5) UNASSIGN TASK
  // ------------------------------------------------------
  async logTaskUnassignment(userId: string, task: Task) {
    return this.createLog({
      userId,
      taskId: task.id,
      groupId: task.groupId,
      //workspaceId: task.group?.workspaceId ?? null,
      action: 'TASK_UNASSIGNED',
    });
  }

  // ------------------------------------------------------
  // 6) STATUS CHANGED
  // ------------------------------------------------------
  async logStatusChange(
    userId: string,
    task: Task,
    oldStatus: string,
    newStatus: string,
  ) {
    return this.createLog({
      userId,
      taskId: task.id,
      groupId: task.groupId,
      //workspaceId: task.group?.workspaceId ?? null,
      action: 'TASK_STATUS_CHANGED',
      metadata: {
        oldStatus,
        newStatus,
      },
    });
  }
}
