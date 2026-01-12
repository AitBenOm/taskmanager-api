import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupService: GroupsService) {}

  @Get(':groupId')
  @UseGuards(JwtAuthGuard)
  getGroupById(
    @GetUser('id') userId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.groupService.getGroupById(groupId);
  }
}
