import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsNotEmpty,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '@prisma/client';

// ------------------------------
// CREATE TASK DTO
// ------------------------------
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority = TaskPriority.MEDIUM;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus = TaskStatus.TODO;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsUUID()
  groupId: string;
}

// ------------------------------
// UPDATE TASK DTO
// ------------------------------
export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

// ------------------------------
// ASSIGN TASK DTO
// ------------------------------
export class AssignTaskDto {
  @IsUUID()
  @IsOptional()
  userId?: string;
}

// ------------------------------
// QUERY TASK DTO (FILTERS & SORTING)
// ------------------------------
export class QueryTaskDto {
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'dueDate', 'priority', 'status'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
