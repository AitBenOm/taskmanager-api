import { CanActivate, ForbiddenException } from '@nestjs/common';
import { WorkspaceService } from '../workspace.service';

export class WorkspaceRoleGuard implements CanActivate {
  constructor(private readonly workspaceService: WorkspaceService) {}

  async canActivate(context: any): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceId = request.params.workspaceId;

    const userRole = await this.workspaceService.getUserWorkspaceRole(
      user.id,
      workspaceId,
    );

    if (!this.workspaceService.isElevatedRole(userRole)) {
      throw new ForbiddenException(
        'Insufficient permissions to access this workspace',
      );
    }

    return true;
  }
}
