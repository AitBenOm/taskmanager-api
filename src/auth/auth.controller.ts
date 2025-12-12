// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';

interface RequestWithUser extends Request {
  user?: User | null;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() req: RequestWithUser) {
    const user = req.user ?? null;
    console.log('AuthController → req.user.ts =', user);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authService.login(user);
  }

  @Post('refresh')
  refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }
}
