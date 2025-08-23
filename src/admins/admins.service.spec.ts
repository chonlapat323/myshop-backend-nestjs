jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

jest.mock('../../utils/file.util', () => ({
  deleteFile: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AdminsService } from './admins.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admins.dto';
import { UpdateAdminDto } from './dto/update-admins.dto';
import { UserRole } from '../constants/user-role.enum';
import * as bcrypt from 'bcryptjs';
import { deleteFile } from '../../utils/file.util';

describe('AdminsService', () => {
  let service: AdminsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAdmin = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    hashed_password: 'hashed_password',
    role_id: UserRole.ADMIN,
    phone_number: '1234567890',
    avatar_url: null,
    is_active: true,
    note: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminsService>(AdminsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return an admin by id', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockAdmin);

      const result = await service.findById(1);

      expect(result).toEqual(mockAdmin);
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null if admin not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all admin users', async () => {
      const mockAdmins = [mockAdmin];
      mockPrismaService.users.findMany.mockResolvedValue(mockAdmins);

      const result = await service.findAll();

      expect(result).toEqual(mockAdmins);
      expect(prisma.users.findMany).toHaveBeenCalledWith({
        where: { role_id: UserRole.ADMIN },
      });
    });
  });

  describe('create', () => {
    const createDto: CreateAdminDto = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      hashed_password: 'password123',
      password: 'password123',
      confirm_password: 'password123',
      phone_number: '1234567890',
      is_active: true,
    };

    it('should create a new admin', async () => {
      mockPrismaService.users.create.mockResolvedValue(mockAdmin);

      const result = await service.create(createDto);

      expect(result).toEqual(mockAdmin);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          first_name: createDto.first_name,
          last_name: createDto.last_name,
          email: createDto.email,
          hashed_password: 'hashed_password',
          role_id: UserRole.ADMIN,
        }),
      });
    });

    it('should create admin with avatar url if provided', async () => {
      const avatarUrl = '/uploads/avatar.jpg';
      mockPrismaService.users.create.mockResolvedValue({
        ...mockAdmin,
        avatar_url: avatarUrl,
      });

      const result = await service.create(createDto, avatarUrl);

      expect(result.avatar_url).toBe(avatarUrl);
    });

    it('should handle prisma errors appropriately', async () => {
      const prismaError = new Error('Unique constraint failed');
      mockPrismaService.users.create.mockRejectedValue(prismaError);

      await expect(service.create(createDto)).rejects.toThrow();
    });
  });

  describe('update', () => {
    const updateDto: UpdateAdminDto = {
      first_name: 'Updated',
      last_name: 'Name',
      id: '1',
    };

    it('should update an existing admin', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockAdmin);
      const updatedAdmin = {
        ...mockAdmin,
        first_name: updateDto.first_name,
        last_name: updateDto.last_name,
      };
      mockPrismaService.users.update.mockResolvedValue(updatedAdmin);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedAdmin);
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          first_name: updateDto.first_name,
          last_name: updateDto.last_name,
        }),
      });
    });

    it('should update admin with new avatar if provided', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockAdmin);
      const avatarFilename = 'new-avatar.jpg';
      const updatedAdmin = {
        ...mockAdmin,
        avatar_url: `/uploads/users/${avatarFilename}`,
      };
      mockPrismaService.users.update.mockResolvedValue(updatedAdmin);

      const result = await service.update(1, updateDto, avatarFilename);

      expect(result.avatar_url).toBe(`/uploads/users/${avatarFilename}`);
    });

    it('should update password if provided', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockAdmin);
      const dtoWithPassword = { ...updateDto, password: 'newpassword' };
      mockPrismaService.users.update.mockResolvedValue(mockAdmin);

      await service.update(1, dtoWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
    });

    it('should throw NotFoundException if admin not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove an admin', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockAdmin);
      mockPrismaService.users.delete.mockResolvedValue(mockAdmin);

      const result = await service.remove(1);

      expect(result).toEqual({ message: 'Admin deleted successfully' });
      expect(prisma.users.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should delete avatar file if exists', async () => {
      const adminWithAvatar = {
        ...mockAdmin,
        avatar_url: '/uploads/avatar.jpg',
      };
      mockPrismaService.users.findUnique.mockResolvedValue(adminWithAvatar);
      mockPrismaService.users.delete.mockResolvedValue(adminWithAvatar);

      await service.remove(1);

      expect(deleteFile).toHaveBeenCalledWith('/uploads/avatar.jpg');
    });

    it('should throw NotFoundException if admin not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
