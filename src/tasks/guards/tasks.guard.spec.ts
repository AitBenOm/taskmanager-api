import { TasksGuard } from './tasks.guard';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceService } from '../../workspace/workspace.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GroupsService } from '../../groups/groups.service';

describe('TasksGuard', () => {
  let guard: TasksGuard;
  const prismaMock = {
    activityLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksGuard,
        WorkspaceService,
        GroupsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    guard = module.get<TasksGuard>(TasksGuard);
  });
  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});
