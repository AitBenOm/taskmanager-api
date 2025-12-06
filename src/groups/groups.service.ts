import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Group, GroupMember, GroupMemberStatus } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // GET GROUP BY ID (Typed)
  // --------------------------------------------------------------------------
  async getGroupById(groupId: string): Promise<Group> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group as Group;
  }

  // --------------------------------------------------------------------------
  // GET USER MEMBERSHIP (Typed)
  // --------------------------------------------------------------------------
  async getUserMembership(
    userId: string,
    groupId: string,
  ): Promise<GroupMember> {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return membership as GroupMember;
  }

  // --------------------------------------------------------------------------
  // VALIDATE USER ACCESS TO GROUP (Typed)
  // Used by: TasksService, CalendarService, Notifications, RBAC
  // --------------------------------------------------------------------------
  async validateUserInGroup(
    userId: string,
    groupId: any,
  ): Promise<GroupMember> {
    // 1. Check group existence
    const group = await this.getGroupById(groupId);

    // 2. Check membership
    const membership = await this.getUserMembership(userId, group.id);

    // 3. Check membership status
    if (membership.status !== GroupMemberStatus.ACCEPTED) {
      throw new ForbiddenException('Your membership is not active');
    }

    return membership;
  }

  // --------------------------------------------------------------------------
  // LIST GROUPS OF A USER (Typed)
  // --------------------------------------------------------------------------
  async listUserGroups(userId: string): Promise<Group[]> {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId, status: GroupMemberStatus.ACCEPTED },
      include: { group: true },
    });

    return memberships.map((m) => m.group as Group);
  }

  // --------------------------------------------------------------------------
  // GET USER ROLE IN GROUP (Typed)
  // --------------------------------------------------------------------------
  async getUserGroupRole(
    userId: string,
    groupId: string,
  ): Promise<GroupMember['role']> {
    const membership = await this.getUserMembership(userId, groupId);
    return membership.role;
  }

  // --------------------------------------------------------------------------
  // CHECK IF USER IS GROUP OWNER (Typed)
  // --------------------------------------------------------------------------
  async isUserGroupOwner(userId: string, groupId: string): Promise<boolean> {
    const membership = await this.getUserMembership(userId, groupId);
    return membership.role === 'OWNER';
  }

  // STEP 1 — Helper: get workspaceId from a group
  async getGroupWorkspaceId(groupId: string): Promise<string | null> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { workspaceId: true },
    });

    return group?.workspaceId ?? null;
  }
}
