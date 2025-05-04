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
    console.log(body.email);
    console.log(body.password);
    const user = await this.authService.validateUser(body.email, body.password);
    console.log(user);
    const token = await this.authService.login(user);
    const FIVE_MINUTES = 1000 * 60 * 5;
    const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

    res.cookie('token', token.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: FIVE_MINUTES,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      domain: '.paodev.xyz',
    });

    res.cookie('refresh_token', token.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SEVEN_DAYS,
      path: '/auth/refresh',
      secure: process.env.NODE_ENV === 'production',
      domain: '.paodev.xyz',
    });
    return { message: 'Login success' };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
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

      res.cookie('token', newAccessToken, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 5,
        secure: process.env.NODE_ENV === 'production',
        domain: '.paodev.xyz',
      });

      return { message: 'Access token refreshed' };
    } catch (err) {
      console.error('Refresh token error:', err.message);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  getStatus(@CurrentUser() user: JwtPayload) {
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

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request & { user: UserPayload }) {
    return req.user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/auth/refresh',
    });

    return { message: 'Logged out successfully' };
  }
}
