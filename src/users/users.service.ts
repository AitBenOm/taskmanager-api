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
}
