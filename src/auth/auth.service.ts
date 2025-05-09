import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginUserPayload } from 'types/auth/auth.services';
import { ConfigService } from '@nestjs/config';
import { RegisterMemberDto } from './dto/register-member.dto';
import { UserRole } from 'src/constants/user-role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async registerMember(dto: RegisterMemberDto) {
    const existing = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('This email is already in use');
    }

    const { password, ...safeData } = dto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const data = {
      ...safeData,
      hashed_password: hashedPassword,
      role_id: UserRole.MEMBER,
    };

    return this.prisma.users.create({ data });
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<LoginUserPayload> {
    const user = await this.usersService.findByEmail(email);
    console.log('📄 Raw user:', user);
    console.log('🔐 Password from request:', password);
    console.log('🔐 Hashed password in DB:', user?.hashed_password);
    const hash = await bcrypt.hash('123123', 10);
    console.log('🔐 Hashed password manual:', hash);
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
