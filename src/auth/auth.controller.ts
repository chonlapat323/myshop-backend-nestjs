import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from 'src/constants/user-role.enum';
import { UserPayload } from 'types/auth/auth.services';
import { JwtPayload } from 'types/auth/jwt-payload.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterMemberDto } from './dto/register-member.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalAdminJwtGuard } from './optional-admin-jwt.guard';
import { OptionalMemberJwtGuard } from './optional-member-jwt.guard';

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

  @Post('register')
  async registerMember(@Body() dto: RegisterMemberDto) {
    return this.authService.registerMember(dto);
  }

  @Post('login_admin')
  async loginAdmin(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (
      user.role_id !== UserRole.ADMIN &&
      user.role_id !== UserRole.SUPERVISOR
    ) {
      throw new UnauthorizedException('You are not allowed to login as admin');
    }

    const token = await this.authService.login(user);

    const ONE_HOUR = 1000 * 60 * 60; // ✅ เปลี่ยนจาก 5 นาที เป็น 1 ชั่วโมง
    const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

    let tokenName = 'admin_token';
    let refreshTokenName = 'admin_refresh_token';

    res.cookie(tokenName, token.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: ONE_HOUR,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? '.paodev.xyz' : undefined,
    });

    res.cookie(refreshTokenName, token.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SEVEN_DAYS,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? '.paodev.xyz' : undefined,
    });

    return { message: 'Login success' };
  }

  @Post('login_member')
  async loginMember(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(body.email, body.password);
    console.log('user.role_id =', user.role_id);
    console.log('UserRole.MEMBER =', UserRole.MEMBER);
    if (user.role_id !== UserRole.MEMBER) {
      console.log('throw');
      throw new UnauthorizedException('You are not allowed to login as member');
    }
    const token = await this.authService.login(user);

    const ONE_HOUR = 1000 * 60 * 60; // ✅ เปลี่ยนจาก 5 นาที เป็น 1 ชั่วโมง
    const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

    let tokenName = 'member_token';
    let refreshTokenName = 'member_refresh_token';

    res.cookie(tokenName, token.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: ONE_HOUR,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? '.paodev.xyz' : undefined,
    });

    res.cookie(refreshTokenName, token.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SEVEN_DAYS,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? '.paodev.xyz' : undefined,
    });

    return { message: 'Login success' };
  }

  @Post('admin/refresh')
  async adminRefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const adminRefreshToken = req.cookies['admin_refresh_token'];

    let refreshToken: string | undefined;
    let expectedRole: UserRole;
    let tokenCookieName: string;

    if (adminRefreshToken) {
      refreshToken = adminRefreshToken;
      expectedRole = UserRole.ADMIN; // หรือจะรองรับ SUPERVISOR ด้วยก็ได้
      tokenCookieName = 'admin_token';
    } else {
      throw new UnauthorizedException('No refresh token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken!, {
        secret: this.jwtSecret,
      });

      if (
        expectedRole === UserRole.ADMIN &&
        payload.role_id !== UserRole.ADMIN
      ) {
        throw new UnauthorizedException('Invalid token role');
      }

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
          expiresIn: '60m',
        },
      );

      const ONE_HOUR = 1000 * 60 * 60; // ✅ เปลี่ยนจาก 5 นาที เป็น 1 ชั่วโมง

      res.cookie(tokenCookieName, newAccessToken, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: ONE_HOUR,
        secure: process.env.NODE_ENV === 'production',
      });

      return { message: 'Access token refreshed' };
    } catch (err) {
      console.error('Refresh token error:', err.message);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('member/refresh')
  async memberRefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const memberRefreshToken = req.cookies['member_refresh_token'];

    let refreshToken: string | undefined;
    let expectedRole: UserRole;
    let tokenCookieName: string;

    if (memberRefreshToken) {
      refreshToken = memberRefreshToken;
      expectedRole = UserRole.MEMBER;
      tokenCookieName = 'member_token';
    } else {
      throw new UnauthorizedException('No refresh token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken!, {
        secret: this.jwtSecret,
      });

      if (
        expectedRole === UserRole.MEMBER &&
        payload.role_id !== UserRole.MEMBER
      ) {
        throw new UnauthorizedException('Invalid token role');
      }

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
          expiresIn: '60m',
        },
      );

      const ONE_MINUTE = 1000 * 60 * 1; // 1 นาที

      res.cookie(tokenCookieName, newAccessToken, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: ONE_MINUTE,
        secure: process.env.NODE_ENV === 'production',
      });

      return { message: 'Access token refreshed' };
    } catch (err) {
      console.error('❌ Refresh token error:', err.message);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Get('status_admin')
  @UseGuards(OptionalAdminJwtGuard)
  getAdminStatus(@CurrentUser() user: JwtPayload | null) {
    if (
      !user ||
      (user.role_id !== UserRole.ADMIN && user.role_id !== UserRole.SUPERVISOR)
    ) {
      return { user: null };
    }
    return { user };
  }

  @Get('status_member')
  @UseGuards(OptionalMemberJwtGuard)
  getMemberStatus(@CurrentUser() user: JwtPayload | null) {
    if (!user || user.role_id !== UserRole.MEMBER) {
      return { user: null };
    }
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  getProfile(@Req() req: Request & { user: UserPayload }) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout_admin')
  logoutAdmin(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const adminToken = req.cookies['admin_token'];

    if (adminToken) {
      res.clearCookie('admin_token', {
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

    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout_member')
  logoutMember(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const memberToken = req.cookies['member_token'];

    if (memberToken) {
      res.clearCookie('member_token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    res.clearCookie('member_refresh_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/auth/refresh',
    });

    return { message: 'Logged out successfully' };
  }
}
