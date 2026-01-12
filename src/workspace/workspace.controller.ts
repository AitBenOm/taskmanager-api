import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from './guards/workspace-role-guard';
import { CreateWorkspaceDto } from './dto/workspace.dto';

@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  /*@Post(':workspaceId/invite')
  @UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
  generateInviteCode(
    @GetUser() user: User,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspaceService.generateInviteCode(workspaceId, user.id);
  }*/

  @Delete(':id/invite')
  @UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
  async disableInvite(@GetUser() user: User, @Param('id') workspaceId: string) {
    return this.workspaceService.disableInviteCode(workspaceId, user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createWorkSpace(
    @GetUser('id') userId: string,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspaceService.createWorkspace(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getUserWorkspaces(@GetUser('id') userId: string) {
    console.log('User ID:', userId);
    return this.workspaceService.getWorkspacesByUserid(userId);
  }
  @Get(':workspaceId')
  @UseGuards(JwtAuthGuard)
  getWorkspaceById(
    @GetUser('id') userId: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    console.log('User ID:', userId);
    return this.workspaceService.getWorkspacesByid(userId, workspaceId);
  }
}
