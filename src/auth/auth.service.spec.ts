jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterMemberDto } from './dto/register-member.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../constants/user-role.enum';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let prisma: PrismaService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    hashed_password: 'hashed_password',
    role_id: UserRole.MEMBER,
    avatar_url: null,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('registerMember', () => {
    const registerDto: RegisterMemberDto = {
      first_name: 'John',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new member successfully', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      mockPrismaService.users.create.mockResolvedValue(mockUser);

      const result = await service.registerMember(registerDto);

      expect(result).toEqual(mockUser);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(prisma.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          first_name: registerDto.first_name,
          email: registerDto.email,
          hashed_password: 'hashed_password',
          role_id: UserRole.MEMBER,
        }),
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);

      await expect(service.registerMember(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateUser', () => {
    it('should validate user successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      const { hashed_password, ...expectedUser } = mockUser;
      expect(result).toEqual(expectedUser);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        mockUser.hashed_password,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    const loginUserPayload = {
      id: 1,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role_id: UserRole.MEMBER,
      avatar_url: null,
    };

    beforeEach(() => {
      mockConfigService.get.mockReturnValue('test_jwt_secret');
      mockJwtService.sign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');
    });

    it('should generate access and refresh tokens', async () => {
      const result = await service.login(loginUserPayload);

      expect(result).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: loginUserPayload.id,
          email: loginUserPayload.email,
          role_id: loginUserPayload.role_id,
          name: `${loginUserPayload.first_name} ${loginUserPayload.last_name}`,
          image_url: loginUserPayload.avatar_url,
        }),
        expect.any(Object),
      );
    });

    it('should throw error if JWT_SECRET is not defined', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await expect(service.login(loginUserPayload)).rejects.toThrow(
        'JWT_SECRET is not defined in environment variables',
      );
    });
  });
});
