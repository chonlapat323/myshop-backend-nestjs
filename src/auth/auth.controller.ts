import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Res,
  UnauthorizedException,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

interface AuthUser {
  email: string;
  role: string;
}
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(body.email, body.password);
    const token = await this.authService.login(user);
    res.cookie('token', token.accessToken, {
      httpOnly: true,
      //secure: process.env.NODE_ENV === 'production', // ✅ ใช้ https ใน production
      sameSite: 'lax',
      maxAge: 1000 * 60 * 1,
      path: '/',
      secure: false, // ถ้า production ต้องเป็น true + https
    });

    res.cookie('refresh_token', token.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 วัน
      path: '/auth/refresh',
      secure: false, // ถ้า production ต้องเป็น true + https
    });
    return { message: 'Login success' };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    console.log('🔁 Refresh token: ', refreshToken);
    console.log('🧠 Payload from token: ', req.cookies['token']);
    console.log('✅ New access token issued');
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const newAccessToken = this.jwtService.sign(
        {
          email: payload.email,
          sub: payload.sub,
          role: payload.role,
        },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: '1m',
        },
      );

      // ส่ง access token ใหม่กลับไปใน cookie
      res.cookie('token', newAccessToken, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 1,
        secure: false, // ถ้า production ต้องเป็น true + https
      });

      return { message: 'Access token refreshed' };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Get('status')
  async getStatus(@Req() req: Request) {
    const token = req.cookies['token'];
    if (!token) return { user: null };

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      return {
        user: {
          email: payload.email,
          role: payload.role,
          sub: payload.sub,
        },
      };
    } catch {
      return { user: null }; // ✅ token หมดอายุ ก็ไม่ error
    }
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // ✅ อย่าลืมปรับ true เมื่อเป็น production
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/auth/refresh', // ต้องระบุ path ให้ตรงกับที่ตั้งไว้
    });

    return { message: 'Logged out successfully' };
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req) {
    return req.user;
  }
}
