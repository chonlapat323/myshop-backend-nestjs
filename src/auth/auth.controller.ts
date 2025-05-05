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
import { UserPayload } from 'types/auth/auth.services';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'types/auth/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';
import { UserRole } from 'src/constants/user-role.enum';
import { OptionalJwtAuthGuard } from './optional-jwt.guard';

@Controller('auth')
export class AuthController {
  private readonly jwtSecret: string;

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET')!;
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(body.email, body.password);
    const token = await this.authService.login(user);

    const FIVE_MINUTES = 1000 * 60 * 5;
    const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

    // ใช้ชื่อ cookie แยกตาม role
    let tokenName = 'token';
    let refreshTokenName = 'refresh_token';

    if (
      user.role_id === UserRole.ADMIN ||
      user.role_id === UserRole.SUPERVISOR
    ) {
      tokenName = 'admin_token';
      refreshTokenName = 'admin_refresh_token';
    } else if (user.role_id === UserRole.MEMBER) {
      tokenName = 'member_token';
      refreshTokenName = 'member_refresh_token';
    }

    res.cookie(tokenName, token.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: FIVE_MINUTES,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? '.paodev.xyz' : undefined,
    });

    res.cookie(refreshTokenName, token.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SEVEN_DAYS,
      path: '/auth/refresh',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? '.paodev.xyz' : undefined,
    });

    return { message: 'Login success' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      req.cookies['admin_refresh_token'] || req.cookies['member_refresh_token'];

    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.jwtSecret,
      });

      const newAccessToken = this.jwtService.sign(
        {
          userId: payload.userId,
          email: payload.email,
          role_id: payload.role_id,
          name: payload.name,
          image_url: payload.image_url,
        },
        {
          secret: this.jwtSecret,
          expiresIn: '5m',
        },
      );

      const FIVE_MINUTES = 1000 * 60 * 5;

      // ✅ แยกชื่อ cookie ตาม role
      const tokenCookieName =
        payload.role_id === UserRole.ADMIN ? 'admin_token' : 'member_token';

      res.cookie(tokenCookieName, newAccessToken, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: FIVE_MINUTES,
        secure: process.env.NODE_ENV === 'production',
        domain:
          process.env.NODE_ENV === 'production' ? '.paodev.xyz' : undefined,
      });

      return { message: 'Access token refreshed' };
    } catch (err) {
      console.error('Refresh token error:', err.message);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('status')
  getStatus(@CurrentUser() user: JwtPayload | null) {
    if (!user) {
      return { user: null };
    }
    return {
      user: {
        id: user.userId,
        email: user.email,
        role: user.role_id,
        name: user.name,
        image_url: user.image_url,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  getProfile(@Req() req: Request & { user: UserPayload }) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const adminToken = req.cookies['admin_token'];
    const memberToken = req.cookies['member_token'];

    if (adminToken) {
      res.clearCookie('admin_token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    if (memberToken) {
      res.clearCookie('member_token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    res.clearCookie('admin_refresh_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/auth/refresh',
    });

    res.clearCookie('member_refresh_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/auth/refresh',
    });

    return { message: 'Logged out successfully' };
  }
}
