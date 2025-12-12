import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Post('register')
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getMe(@GetUser('id') userId: string) {
    return this.users.findById(userId);
  }

  @Get('email')
  getEmail(@GetUser('email') email: string) {
    return email;
  }
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@GetUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.users.updateUserProfile(userId, dto.fullName, dto.avatarUrl);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @GetUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.users.changeUserPassword(
      userId,
      dto.newPassword,
      dto.oldPassword,
    );
  }
}
