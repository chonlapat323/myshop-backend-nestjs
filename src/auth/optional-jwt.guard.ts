import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.member_token || req.cookies?.admin_token;

    if (!token) {
      req.user = null; // ✅ ไม่มี token ก็ปล่อยผ่าน
      return true;
    }

    try {
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET!,
      });
      req.user = decoded;
    } catch (e) {
      req.user = null; // ✅ token ผิดก็ยังไม่ throw
    }

    return true;
  }
}
