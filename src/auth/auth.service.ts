// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';



interface JwtPayload {
  sub: string;
  email: string;
  role?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private async verifyPassword(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = (await this.usersService.findByMail(email)) as User | null;

    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Compare bcrypt hashes
    const isValid = await this.verifyPassword(password, user.password ?? '');
    console.log('bcrypt.compare →', isValid);

    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    // example debug hash (non-blocking)
    bcrypt.hash('000000', 10).then(console.log);

    return user;
  }

  async login(
    user: User,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user?.role ?? null,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    // store hashed refresh token in DB
    const hashedRt = await bcrypt.hash(refreshToken, 10);

    await this.usersService.updateuser(user.id, hashedRt);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      // decode token (does NOT verify secret)
      const decoded = this.jwtService.decode(refreshToken);

      if (
        typeof decoded !== 'object' ||
        decoded === null ||
        !('sub' in decoded)
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const sub = String((decoded as Record<string, unknown>).sub);
      const user = (await this.usersService.findById(sub)) as User | null;

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Token expired or user logged out');
      }

      // compare refresh token with stored hashed version
      const valid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!valid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // ROTATION: generate new access token + new refresh token
      return this.login(user); // login() will rotate tokens automatically
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // Remove the refresh token from the database
    await this.usersService.updateuser(userId, null);
    return { message: 'Logged out' };
  }
}
