import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginUserPayload } from 'types/auth/auth.services';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<LoginUserPayload> {
    const user = await this.usersService.findByEmail(email);
    console.log('📄 Raw user:', user);
    console.log('🔐 Password from request:', password);
    console.log('🔐 Hashed password in DB:', user?.hashed_password);
    if (user) {
      const isMatch = await bcrypt.compare(password, user.hashed_password!);
      console.log('🔍 bcrypt.compare result:', isMatch);
      if (isMatch) {
        const { hashed_password, ...result } = user;
        return result;
      } else {
        console.warn('❌ Password does not match');
      }
    }
    throw new UnauthorizedException('Invalid email or password');
  }

  async login(user: LoginUserPayload) {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    console.log(`jwtSecret::${jwtSecret}`);
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const payload = {
      userId: user.id,
      email: user.email,
      role_id: user.role_id,
      name: `${user.first_name} ${user.last_name}`,
      image_url: user.avatar_url,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '5m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
