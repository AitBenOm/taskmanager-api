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
    const existingUser = await this.findByMail(data.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }
    const hashedPassword = await this.hashPassword(data.password);

    return this.prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        password: hashedPassword,
        role: 'MEMBER', // default
      },
    });
  }

  async findByMail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
