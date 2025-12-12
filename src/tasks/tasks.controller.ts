import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { TasksService } from './tasks.service';

import { TasksGuard } from './guards/tasks.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AssignTaskDto,
  CreateTaskDto,
  QueryTaskDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { User } from '@prisma/client';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // ------------------------------------------------------
  // CREATE TASK
  // ------------------------------------------------------
  @Post()
  createTask(@GetUser('id') userId: string, @Body() dto: CreateTaskDto) {
    console.log('Creating task for user:', userId);
    return this.tasksService.createTask(userId, dto);
  }

  // ------------------------------------------------------
  // GET TASKS WITH FILTERS + PAGINATION + SORTING
  // ------------------------------------------------------
  @Get()
  getTasks(@GetUser('id') userId, @Query() query: QueryTaskDto) {
    return this.tasksService.getTasks(userId, query);
  }

  // ------------------------------------------------------
  // GET SINGLE TASK
  // ------------------------------------------------------
  @Get(':id')
  getTaskById(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.tasksService.getTaskById(userId, id);
  }

  // ------------------------------------------------------
  // UPDATE TASK
  // ------------------------------------------------------
  @Patch(':id')
  updateTask(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(user?.id, id, dto);
  }

  // ------------------------------------------------------
  // DELETE TASK
  // ------------------------------------------------------
  @Delete(':id')
  deleteTask(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.tasksService.deleteTask(userId, id);
  }

  // ------------------------------------------------------
  // ASSIGN USER TO TASK
  // ------------------------------------------------------
  @Post(':id/assign')
  @UseGuards(TasksGuard)
  assignTask(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AssignTaskDto,
  ) {
    return this.tasksService.assignTask(userId, id, dto);
  }

  // ------------------------------------------------------
  // UNASSIGN USER FROM TASK
  // ------------------------------------------------------
  @Post(':id/unassign')
  unassignTask(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.tasksService.unassignTask(userId, id);
  }

  // ------------------------------------------------------
  // GET TASKS BY GROUP
  // ------------------------------------------------------
  @Get('group/:id')
  getTasksByGroup(@GetUser('id') userId: string, @Param('id') groupId: string) {
    return this.tasksService.getTasksByGroup(userId, groupId);
  }
}
