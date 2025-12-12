// typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  role?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const jwtFromRequest = (req: Request | undefined): string | null => {
      if (!req || !req.headers) return null;
      const auth = req.headers.authorization;
      if (typeof auth !== 'string') return null;
      if (!auth.startsWith('Bearer ')) return null;
      return auth.slice(7);
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('Missing JWT_SECRET environment variable');
    }

    super({
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role ?? null,
    };
  }
}
