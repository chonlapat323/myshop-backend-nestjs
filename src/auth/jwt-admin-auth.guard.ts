import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserRole } from 'src/constants/user-role.enum';

@Injectable()
export class JwtAdminAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('✅ [JwtAdminAuthGuard] used');
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies['admin_token'];

    if (!token) {
      throw new UnauthorizedException('No admin token found');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET!,
      });

      if (
        payload.role_id !== UserRole.ADMIN &&
        payload.role_id !== UserRole.SUPERVISOR
      ) {
        throw new UnauthorizedException('Not an admin');
      }

      req.user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid admin token');
    }
  }
}
