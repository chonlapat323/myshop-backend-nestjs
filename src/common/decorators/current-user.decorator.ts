import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from 'types/auth/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
