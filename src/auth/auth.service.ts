import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './login.dto';

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

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByMail(email);
    console.log('validateUser → user.ts from DB:', user);

    if (!user) throw new UnauthorizedException('Invalid credentials');
    // Compare bcrypt hashes
    const isValid = await bcrypt.compare(password, user.password);
    console.log('bcrypt.compare →', isValid);

    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    bcrypt.hash('000000', 10).then(console.log);

    return user;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
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
      const decoded = this.jwtService.decode(refreshToken) as any;

      if (!decoded || !decoded.sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const user = await this.usersService.findById(decoded.sub);

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Token expired or user.ts logged out');
      }

      // compare refresh token with stored hashed version
      const valid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!valid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // ROTATION: generate new access token + new refresh token
      return this.login(user); // login() will rotate tokens automatically
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
  async logout(userId: string) {
    // Remove the refresh token from the database
    await this.usersService.updateuser(userId, null);
    return { message: 'Logged out' };
  }
}
