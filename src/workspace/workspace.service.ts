import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceRole } from '@prisma/client';

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
}
