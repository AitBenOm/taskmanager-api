import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceController } from './workspace.controller';

describe('WorkspaceController', () => {
  let controller: WorkspaceController;
  const WorkspaceServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceController],
      providers: [
        {
          provide: WorkspaceController,
          useValue: WorkspaceServiceMock,
        },
      ],
    }).compile();

    controller = module.get<WorkspaceController>(WorkspaceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
