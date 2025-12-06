import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { GroupsService } from '../groups/groups.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { ActivityService } from '../activity/activity.service';

@Module({
  imports: [],
  controllers: [TasksController],
  providers: [
    TasksService,
    PrismaService,
    GroupsService,
    WorkspaceService,
    ActivityService,
  ],
  exports: [TasksService],
})
export class TasksModule {}
