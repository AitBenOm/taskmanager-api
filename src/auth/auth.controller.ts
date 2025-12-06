import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() req: any) {
    console.log('AuthController → req.user.ts =', req?.user);
    return this.authService.login(req?.user);
  }

  @Post('refresh')
  refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }
}
