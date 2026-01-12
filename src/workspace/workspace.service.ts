import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceRole } from '@prisma/client';
import { CreateWorkspaceDto } from './dto/workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}
  async getWorkspaceById(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace;
  }

  async validateUserInWorkspace(userId: string, workspaceId: string) {
    const workspace = await this.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const memberberShip = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: userId,
      },
    });
    if (!memberberShip) {
      throw new ForbiddenException('User is not a member of the workspace');
    }
    return workspace;
  }
  a; // Get the user's role in a workspace
  async getUserWorkspaceRole(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
      select: { role: true },
    });

    return membership?.role ?? null;
  }
  isElevatedRole(role: WorkspaceRole | null): boolean {
    return role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN;
  }

  /*async generateInviteCode(workSpaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workSpaceId },
      },
    });
    if (!membership) {
      throw new NotFoundException('user is not a member of the workspace');
    }
    if (
      membership.role != WorkspaceRole.OWNER ||
      membership.role != WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException(
        'User does not have permission to generate invite codes',
      );
    }
    const inviteCode = nanoid(16);
    const workspace = this.prisma.workspace.update({
      where: { id: workSpaceId },
      data: { inviteCode: inviteCode },
    });
    return {
      inviteCode,
      inviteLink: `${process.env.FRONTEND_URL}/invite/${inviteCode}`,
      workspace,
    };
  }*/

  async disableInviteCode(workspaceId: string, userId: string) {
    // 1. Check membership
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // 2. Check permissions
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only owner or admin can disable invite link',
      );
    }

    // 3. Disable inviteCode by setting it to null
    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { inviteCode: null },
    });

    return {
      message: 'Invite link disabled successfully',
      workspace,
    };
  }

  async createWorkspace(userId: string, dto: CreateWorkspaceDto): Promise<any> {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        description: dto.description,
        ownerId: userId,
        members: {
          create: {
            userId: userId,
            role: WorkspaceRole.OWNER,
          },
        },
      },
      include: {
        members: true,
      },
    });

    return workspace;
  }

  async getWorkspacesByUserid(userId: string) {
    return this.prisma.workspace.findMany({
      where: { ownerId: userId },
      include: {
        groups: {
          include: {
            tasks: true,
            members: {
              include: {
                user: true, // get full user info for each member
              },
            },
          },
        },
        members: {
          include: {
            user: true, // get full user info for each member
          },
        },
      },
    });
  }
  async getWorkspacesByid(userId: string, workspaceId: string) {
    const workspace = await this.validateUserInWorkspace(userId, workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found or access denied');
    }
    return this.prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
      include: {
        groups: {
          include: {
            tasks: true,
          },
        },
        members: {
          include: {
            user: true, // get full user info for each member
          },
        },
      },
    });
  }
}
