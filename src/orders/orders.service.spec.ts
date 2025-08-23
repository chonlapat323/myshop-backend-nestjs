import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return an order', async () => {
      const mockOrder = {
        id: 1,
        userId: 1,
        order_number: 'ORDER123',
        total_price: 100,
        order_status: OrderStatus.pending,
        created_at: new Date(),
        tracking_number: null,
        Users: {
          id: 1,
          email: 'test@example.com',
        },
        order_items: [
          {
            id: 1,
            product_name: 'Test Product',
            quantity: 1,
            price: 100,
            product: {
              product_image: [
                {
                  id: 1,
                  is_main: true,
                  url: 'test.jpg',
                  productId: 1,
                  order_image: 1,
                },
              ],
            },
          },
        ],
        discount_value: 0,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findOne(1);
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });
});
