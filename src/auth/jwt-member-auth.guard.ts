import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtMemberAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies['member_token'];

    if (!token) {
      throw new UnauthorizedException('No member token found');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET!,
      });

      if (Number(payload.role_id) !== 3) {
        throw new UnauthorizedException('Token role is not member');
      }

      req.user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid member token');
    }
  }
}
