import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';

interface RequestWithUser extends Request {
  user?: User | null;
}

export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user ?? null;

    if (!data) return user;

    // runtime check to ensure property exists on the user object
    if (
      user &&
      typeof user === 'object' &&
      Object.prototype.hasOwnProperty.call(user, data)
    ) {
      return (user as Record<string, unknown>)[String(data)];
    }

    return undefined;
  },
);
