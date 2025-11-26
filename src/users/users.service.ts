import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10; // industry standard
    return bcrypt.hash(password, saltRounds);
  }

  async create(data: CreateUserDto) {
    console.log('🟦 RAW PASSWORD SENT →', JSON.stringify(data.password));

    const hashedPassword = await this.hashPassword(data.password);

    console.log('🟩 HASH CREATED →', hashedPassword);

    return this.prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        password: hashedPassword,
        role: 'MEMBER',
      },
    });
  }

  updateuser(id: string, refreshedToken: any) {
    return this.prisma.user.update({
      where: { id: id },
      data: { refreshToken: refreshedToken },
    });
  }
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        familyId: true,
        refreshToken: true,
        createdAt: true,
      },
    });
  }

  async updateUserProfile(id: string, fullName: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        fullName: fullName,
        avatarUrl: avatarUrl,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        familyId: true,
        refreshToken: true,
        createdAt: true,
      },
    });
  }

  removeuser(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findByMail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async changeUserPassword(
    userId: string,
    newPassword: string,
    oldPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ConflictException('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new ConflictException('Old password is incorrect');
    }
    const hashedPassword = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        refreshToken: null,
      },
    });

    return { message: 'Password updated successfully' };
  }
}
