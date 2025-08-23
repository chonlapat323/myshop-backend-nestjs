import { Test, TestingModule } from '@nestjs/testing';
import { AddressService } from './address.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';

describe('AddressService', () => {
  let service: AddressService;
  let prisma: PrismaService;

  const mockPrismaService = {
    addresses: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAddress = {
    id: 1,
    full_name: 'John Doe',
    address_line: '123 Test St.',
    city: 'Test City',
    state: 'Test State',
    zip_code: '12345',
    phone_number: '1234567890',
    is_default: false,
    user_id: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AddressService>(AddressService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all addresses for a user', async () => {
      const userId = 1;
      const mockAddresses = [
        { ...mockAddress, is_default: true },
        { ...mockAddress, id: 2, is_default: false },
      ];

      mockPrismaService.addresses.findMany.mockResolvedValue(mockAddresses);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockAddresses);
      expect(prisma.addresses.findMany).toHaveBeenCalledWith({
        where: { user_id: userId },
        orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
      });
    });
  });

  describe('findOne', () => {
    it('should return an address if it exists and belongs to the user', async () => {
      const addressId = 1;
      const userId = 1;

      mockPrismaService.addresses.findUnique.mockResolvedValue(mockAddress);

      const result = await service.findOne(addressId, userId);

      expect(result).toEqual(mockAddress);
      expect(prisma.addresses.findUnique).toHaveBeenCalledWith({
        where: { id: addressId },
      });
    });

    it('should throw NotFoundException if address does not exist', async () => {
      const addressId = 999;
      const userId = 1;

      mockPrismaService.addresses.findUnique.mockResolvedValue(null);

      await expect(service.findOne(addressId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if address belongs to different user', async () => {
      const addressId = 1;
      const userId = 1;
      const differentUserAddress = { ...mockAddress, user_id: 2 };

      mockPrismaService.addresses.findUnique.mockResolvedValue(
        differentUserAddress,
      );

      await expect(service.findOne(addressId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new address', async () => {
      const userId = 1;
      const createDto: CreateAddressDto = {
        full_name: 'John Doe',
        address_line: '123 Test St.',
        city: 'Test City',
        state: 'Test State',
        zip_code: '12345',
        phone_number: '1234567890',
        is_default: false,
      };

      mockPrismaService.addresses.create.mockResolvedValue({
        ...mockAddress,
        ...createDto,
      });

      const result = await service.create(userId, createDto);

      expect(result).toEqual({ ...mockAddress, ...createDto });
      expect(prisma.addresses.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          user_id: userId,
        },
      });
    });

    it('should update other addresses when creating a default address', async () => {
      const userId = 1;
      const createDto: CreateAddressDto = {
        full_name: 'John Doe',
        address_line: '123 Test St.',
        city: 'Test City',
        state: 'Test State',
        zip_code: '12345',
        phone_number: '1234567890',
        is_default: true,
      };

      mockPrismaService.addresses.create.mockResolvedValue({
        ...mockAddress,
        ...createDto,
      });

      await service.create(userId, createDto);

      expect(prisma.addresses.updateMany).toHaveBeenCalledWith({
        where: { user_id: userId },
        data: { is_default: false },
      });
    });
  });

  describe('update', () => {
    it('should update an existing address', async () => {
      const addressId = 1;
      const userId = 1;
      const updateDto = {
        full_name: 'Jane Doe',
        address_line: '456 Update St.',
        city: 'Update City',
        state: 'Update State',
        zip_code: '67890',
        phone_number: '0987654321',
        is_default: false,
      };

      mockPrismaService.addresses.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.addresses.update.mockResolvedValue({
        ...mockAddress,
        ...updateDto,
      });

      const result = await service.update(addressId, userId, updateDto);

      expect(result).toEqual({ ...mockAddress, ...updateDto });
      expect(prisma.addresses.update).toHaveBeenCalledWith({
        where: { id: addressId },
        data: updateDto,
      });
    });

    it('should update other addresses when setting a new default', async () => {
      const addressId = 1;
      const userId = 1;
      const updateDto = {
        is_default: true,
      };

      mockPrismaService.addresses.findUnique.mockResolvedValue(mockAddress);

      await service.update(addressId, userId, updateDto);

      expect(prisma.addresses.updateMany).toHaveBeenCalledWith({
        where: { user_id: userId },
        data: { is_default: false },
      });
    });
  });

  describe('setDefault', () => {
    it('should set an address as default', async () => {
      const addressId = 1;
      const userId = 1;
      const updatedAddress = { ...mockAddress, is_default: true };

      mockPrismaService.addresses.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.addresses.update.mockResolvedValue(updatedAddress);

      const result = await service.setDefault(addressId, userId);

      expect(result).toEqual(updatedAddress);
      expect(prisma.addresses.updateMany).toHaveBeenCalledWith({
        where: { user_id: userId },
        data: { is_default: false },
      });
      expect(prisma.addresses.update).toHaveBeenCalledWith({
        where: { id: addressId },
        data: { is_default: true },
      });
    });

    it('should throw ForbiddenException if address belongs to different user', async () => {
      const addressId = 1;
      const userId = 1;
      const differentUserAddress = { ...mockAddress, user_id: 2 };

      mockPrismaService.addresses.findUnique.mockResolvedValue(
        differentUserAddress,
      );

      await expect(service.setDefault(addressId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should remove an address', async () => {
      const addressId = 1;
      const userId = 1;

      mockPrismaService.addresses.findUnique.mockResolvedValue(mockAddress);

      await service.remove(addressId, userId);

      expect(prisma.addresses.delete).toHaveBeenCalledWith({
        where: { id: addressId },
      });
    });

    it('should throw ForbiddenException if address belongs to different user', async () => {
      const addressId = 1;
      const userId = 1;
      const differentUserAddress = { ...mockAddress, user_id: 2 };

      mockPrismaService.addresses.findUnique.mockResolvedValue(
        differentUserAddress,
      );

      await expect(service.remove(addressId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if address does not exist', async () => {
      const addressId = 999;
      const userId = 1;

      mockPrismaService.addresses.findUnique.mockResolvedValue(null);

      await expect(service.remove(addressId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
