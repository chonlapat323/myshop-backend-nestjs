import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UserRole } from 'src/constants/user-role.enum';

@Injectable()
export class JwtAdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies['admin_token'];

    if (!token) {
      throw new UnauthorizedException('No admin token found');
    }

    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new UnauthorizedException('JWT_SECRET not configured');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtSecret,
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
      console.error('JwtAdminAuthGuard error:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Admin token expired');
      } else if (err.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid admin token');
      } else {
        throw new UnauthorizedException('Authentication failed');
      }
    }
  }
}
