import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '@prisma/client';

// ------------------------------
// CREATE TASK DTO
// ------------------------------

//
// -------------------------------------------
// CREATE TASK DTO
// -------------------------------------------
// Handles task creation + nested subtasks

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  /** Required for any task */
  @IsUUID()
  groupId: string;

  /** Required: who created it */
  @IsUUID()
  createdById: string;

  /** ⭐ Self-relation: subtasks */
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  /** Optional assignment */
  @IsOptional()
  @IsUUID()
  assignedToId?: string | null;
}

//
// -------------------------------------------
// UPDATE TASK DTO
// -------------------------------------------
// Handles editing tasks + replacing subtasks
//
export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  /** ⭐ Self-relation: changing parent moves task in tree */
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsUUID()
  assignedToId?: string | null;
}
// ------------------------------
// ASSIGN TASK DTO
// ------------------------------
export class AssignTaskDto {
  @IsUUID()
  @IsOptional()
  userId?: string;
}

export class TaskResponseDto {
  id: string;
  title: string;
  description?: string | null;

  status: TaskStatus;
  priority: TaskPriority;

  dueDate?: string | null;
  createdAt: Date;
  updatedAt: Date;

  groupId: string;
  createdById: string;
  assignedToId?: string | null;

  /** null = root task */
  parentId?: string | null;

  /** ⭐ Recursive subtasks */
  subtasks?: TaskResponseDto[];
}

// ------------------------------
// QUERY TASK DTO (FILTERS & SORTING)
// ------------------------------
export class QueryTaskDto {
  /** Filter by group */
  @IsUUID()
  @IsOptional()
  groupId?: string;

  /** Filter by assigned user */
  @IsUUID()
  @IsOptional()
  userId?: string;

  /** Filter by status */
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  /** Filter by priority */
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  /** Text search */
  @IsOptional()
  @IsString()
  search?: string;

  /** Filter by due date */
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  /** Optional: return only root tasks or only subtasks */
  @IsOptional()
  @IsUUID()
  parentId?: string | null; // ⭐ self-relation-aware filtering

  /** Pagination */
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;

  /** Sorting */
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'dueDate', 'priority', 'status'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
