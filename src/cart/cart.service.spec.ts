import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;
  let prisma: PrismaService;

  const mockPrismaService = {
    cart: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    cart_item: {
      aggregate: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    products: {
      findUnique: jest.fn(),
    },
  };

  const mockUser = { id: 1 };
  const mockCart = { id: 1, user_id: mockUser.id };
  const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 100,
    discount_price: 80,
  };
  const mockCartItem = {
    id: 1,
    cart_id: mockCart.id,
    product_id: mockProduct.id,
    quantity: 2,
    price_snapshot: mockProduct.price,
    discount_snapshot: mockProduct.discount_price,
    cart: mockCart,
    products: {
      ...mockProduct,
      product_image: [
        {
          id: 1,
          url: 'test-image.jpg',
          is_main: true,
        },
      ],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getCartItemCount', () => {
    it('should return total quantity of items in cart', async () => {
      mockPrismaService.cart_item.aggregate.mockResolvedValue({
        _sum: { quantity: 5 },
      });

      const result = await service.getCartItemCount(mockUser.id);

      expect(result).toEqual({ count: 5 });
      expect(prisma.cart_item.aggregate).toHaveBeenCalledWith({
        _sum: { quantity: true },
        where: {
          cart: {
            user_id: mockUser.id,
          },
        },
      });
    });

    it('should return 0 if cart is empty', async () => {
      mockPrismaService.cart_item.aggregate.mockResolvedValue({
        _sum: { quantity: null },
      });

      const result = await service.getCartItemCount(mockUser.id);

      expect(result).toEqual({ count: 0 });
    });
  });

  describe('addItemToCart', () => {
    it('should create new cart and add item if cart does not exist', async () => {
      mockPrismaService.cart.findFirst.mockResolvedValue(null);
      mockPrismaService.cart.create.mockResolvedValue(mockCart);
      mockPrismaService.cart_item.findFirst.mockResolvedValue(null);
      mockPrismaService.products.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.cart_item.create.mockResolvedValue(mockCartItem);

      const result = await service.addItemToCart(
        mockUser.id,
        mockProduct.id,
        2,
      );

      expect(result).toEqual(mockCartItem);
      expect(prisma.cart.create).toHaveBeenCalledWith({
        data: { user_id: mockUser.id },
      });
      expect(prisma.cart_item.create).toHaveBeenCalledWith({
        data: {
          cart_id: mockCart.id,
          product_id: mockProduct.id,
          quantity: 2,
          price_snapshot: mockProduct.price,
          discount_snapshot: mockProduct.discount_price,
        },
      });
    });

    it('should update quantity if item already exists in cart', async () => {
      mockPrismaService.cart.findFirst.mockResolvedValue(mockCart);
      mockPrismaService.cart_item.findFirst.mockResolvedValue(mockCartItem);
      mockPrismaService.cart_item.update.mockResolvedValue({
        ...mockCartItem,
        quantity: 4,
      });

      const result = await service.addItemToCart(
        mockUser.id,
        mockProduct.id,
        2,
      );

      expect(result.quantity).toBe(4);
      expect(prisma.cart_item.update).toHaveBeenCalledWith({
        where: { id: mockCartItem.id },
        data: { quantity: 4 },
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.cart.findFirst.mockResolvedValue(mockCart);
      mockPrismaService.cart_item.findFirst.mockResolvedValue(null);
      mockPrismaService.products.findUnique.mockResolvedValue(null);

      await expect(service.addItemToCart(mockUser.id, 999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCartByUserId', () => {
    it('should return empty cart if user has no cart', async () => {
      mockPrismaService.cart.findFirst.mockResolvedValue(null);

      const result = await service.getCartByUserId(mockUser.id);

      expect(result).toEqual({
        cart_id: null,
        items: [],
        total: 0,
      });
    });

    it('should return cart with items', async () => {
      mockPrismaService.cart.findFirst.mockResolvedValue({
        ...mockCart,
        items: [mockCartItem],
      });

      const result = await service.getCartByUserId(mockUser.id);

      expect(result).toEqual({
        cart_id: mockCart.id,
        items: [
          {
            id: mockCartItem.id,
            product_id: mockCartItem.product_id,
            name: mockCartItem.products.name,
            quantity: mockCartItem.quantity,
            price_snapshot: mockCartItem.price_snapshot,
            image: mockCartItem.products.product_image[0].url,
          },
        ],
      });
    });
  });

  describe('updateCartItemQuantity', () => {
    it('should update cart item quantity', async () => {
      mockPrismaService.cart_item.findUnique.mockResolvedValue(mockCartItem);
      mockPrismaService.cart_item.update.mockResolvedValue({
        ...mockCartItem,
        quantity: 3,
      });

      const result = await service.updateCartItemQuantity(
        mockCartItem.id,
        3,
        mockUser.id,
      );

      expect(result.quantity).toBe(3);
      expect(prisma.cart_item.update).toHaveBeenCalledWith({
        where: { id: mockCartItem.id },
        data: { quantity: 3 },
      });
    });

    it('should throw ForbiddenException if cart item does not belong to user', async () => {
      mockPrismaService.cart_item.findUnique.mockResolvedValue({
        ...mockCartItem,
        cart: { ...mockCart, user_id: 999 },
      });

      await expect(
        service.updateCartItemQuantity(mockCartItem.id, 3, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeCartItem', () => {
    it('should remove cart item', async () => {
      mockPrismaService.cart_item.findUnique.mockResolvedValue(mockCartItem);
      mockPrismaService.cart_item.delete.mockResolvedValue(mockCartItem);

      await service.removeCartItem(mockCartItem.id, mockUser.id);

      expect(prisma.cart_item.delete).toHaveBeenCalledWith({
        where: { id: mockCartItem.id },
      });
    });

    it('should throw ForbiddenException if cart item does not belong to user', async () => {
      mockPrismaService.cart_item.findUnique.mockResolvedValue({
        ...mockCartItem,
        cart: { ...mockCart, user_id: 999 },
      });

      await expect(
        service.removeCartItem(mockCartItem.id, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
