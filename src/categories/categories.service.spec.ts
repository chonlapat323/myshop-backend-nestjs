jest.mock('../../utils/file.util', () => ({
  deleteFile: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { deleteFile } from '../../utils/file.util';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockCategory = {
    id: 1,
    name: 'Test Category',
    description: 'Test Description',
    link: 'test-link',
    is_active: true,
    image: '/uploads/test-image.jpg',
    order: 1,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('findAllIncludingDeleted', () => {
    it('should return all categories including deleted ones', async () => {
      const mockCategories = [mockCategory];
      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAllIncludingDeleted();

      expect(result).toEqual(mockCategories);
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        orderBy: { order: 'asc', created_at: 'desc' },
      });
    });
  });

  describe('findActive', () => {
    it('should return only active and non-deleted categories', async () => {
      const mockCategories = [mockCategory];
      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findActive();

      expect(result).toEqual(mockCategories);
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: {
          is_active: true,
          deleted_at: null,
        },
        orderBy: { order: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findOne(1);

      expect(result).toEqual(mockCategory);
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPaginated', () => {
    const paginationParams = {
      page: 1,
      limit: 10,
      search: 'test',
      isActive: 'true',
    };

    it('should return paginated categories', async () => {
      const mockCategories = [mockCategory];
      const mockTotal = 1;
      mockPrismaService.$transaction.mockResolvedValue([
        mockCategories,
        mockTotal,
      ]);

      const result = await service.findPaginated(paginationParams);

      expect(result).toEqual({
        data: mockCategories,
        total: mockTotal,
        page: paginationParams.page,
        pageCount: Math.ceil(mockTotal / paginationParams.limit),
      });
    });
  });

  describe('create', () => {
    const createDto: CreateCategoryDto = {
      name: 'Test Category',
      description: 'Test Description',
      link: 'test-link',
      is_active: true,
    };

    it('should create a new category', async () => {
      mockPrismaService.category.create.mockResolvedValue(mockCategory);

      const result = await service.create(createDto, 'test-image.jpg');

      expect(result).toEqual(mockCategory);
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          image: 'test-image.jpg',
        },
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateCategoryDto = {
      name: 'Updated Category',
      is_active: false,
    };

    it('should update an existing category', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      const updatedCategory = { ...mockCategory, ...updateDto };
      mockPrismaService.category.update.mockResolvedValue(updatedCategory);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedCategory);
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          ...updateDto,
          image: mockCategory.image,
        },
      });
    });

    it('should delete old image when updating with new image', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      const updatedCategory = {
        ...mockCategory,
        image: '/uploads/new-image.jpg',
      };
      mockPrismaService.category.update.mockResolvedValue(updatedCategory);

      await service.update(1, updateDto, '/uploads/new-image.jpg');

      expect(deleteFile).toHaveBeenCalledWith('test-image.jpg');
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateOrder', () => {
    it('should update categories order', async () => {
      const orderData = [
        { id: 1, order: 2 },
        { id: 2, order: 1 },
      ];
      mockPrismaService.category.update.mockResolvedValueOnce(mockCategory);

      const result = await service.updateOrder(orderData);

      expect(result).toEqual({
        message: '✅ Categories reordered successfully',
      });
      expect(prisma.category.update).toHaveBeenCalledTimes(orderData.length);
    });
  });

  describe('remove', () => {
    it('should soft delete a category', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.category.update.mockResolvedValue({
        ...mockCategory,
        deleted_at: new Date(),
      });

      const result = await service.remove(1);

      expect(result).toEqual({
        message: 'Category with ID 1 removed successfully.',
      });
      expect(deleteFile).toHaveBeenCalledWith('test-image.jpg');
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deleted_at: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
