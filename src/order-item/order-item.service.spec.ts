import { Test, TestingModule } from '@nestjs/testing';
import { OrderItemService } from './order-item.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

describe('OrderItemService', () => {
  let service: OrderItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderItemService],
    }).compile();

    service = module.get<OrderItemService>(OrderItemService);
  });

  describe('create', () => {
    it('should return a message for creating order item', () => {
      const createDto = new CreateOrderItemDto();
      expect(service.create(createDto)).toBe(
        'This action adds a new orderItem',
      );
    });
  });

  describe('findAll', () => {
    it('should return a message for finding all order items', () => {
      expect(service.findAll()).toBe('This action returns all orderItem');
    });
  });

  describe('findOne', () => {
    it('should return a message for finding one order item', () => {
      expect(service.findOne(1)).toBe('This action returns a #1 orderItem');
    });
  });

  describe('update', () => {
    it('should return a message for updating order item', () => {
      const updateDto = new UpdateOrderItemDto();
      expect(service.update(1, updateDto)).toBe(
        'This action updates a #1 orderItem',
      );
    });
  });

  describe('remove', () => {
    it('should return a message for removing order item', () => {
      expect(service.remove(1)).toBe('This action removes a #1 orderItem');
    });
  });
});
