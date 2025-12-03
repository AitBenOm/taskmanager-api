import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { GroupsService } from '../groups/groups.service';

@Module({
  imports: [],
  controllers: [TasksController],
  providers: [TasksService, PrismaService, GroupsService],
  exports: [TasksService],
})
export class TasksModule {}
