import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { DeepPartial, Like, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/product.entity';
import { User } from 'src/users/user.entity';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderItem } from 'src/order-item/entities/order-item.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    if (!userId || userId === 'undefined') {
      throw new BadRequestException('Invalid or missing user ID');
    }

    const user = await this.userRepository.findOneBy({ id: String(userId) });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    let subtotal = 0;
    const orderItems: OrderItem[] = [];

    for (const item of dto.items) {
      const product = await this.productRepository.findOneBy({
        id: item.productId,
      });
      if (!product) {
        throw new NotFoundException(`Product ID ${item.productId} not found`);
      }

      const orderItem = new OrderItem();
      orderItem.product = product;
      orderItem.product_name = product.name;
      orderItem.quantity = item.quantity;
      orderItem.price = product.price;

      subtotal += product.price * item.quantity;
      orderItems.push(orderItem);
    }

    const discount = dto.discountValue || 0;
    const shipping = dto.shippingCost || 0;
    const total = subtotal - discount + shipping;
    const orderNumber = await this.generateOrderNumber();

    const order = this.orderRepository.create({
      order_number: orderNumber,
      user,
      items: orderItems,
      subtotal_price: subtotal,
      discount_value: discount,
      coupon_code: dto.couponCode || null,
      shipping_cost: shipping,
      total_price: total,
      payment_method: dto.paymentMethod,
      status: 'pending',
      shipping_full_name: dto.shippingFullName,
      shipping_address_line1: dto.shippingAddressLine1,
      shipping_address_line2: dto.shippingAddressLine2 || null,
      shipping_city: dto.shippingCity,
      shipping_zip: dto.shippingZip,
      shipping_country: dto.shippingCountry,
    } as DeepPartial<Order>);

    return await this.orderRepository.save(order);
  }

  findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['user', 'items', 'items.product'],
      order: { created_at: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async update(id: number, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (dto.status) {
      order.status = dto.status;
    }

    return await this.orderRepository.save(order);
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    // หา order ล่าสุดของวันนั้น
    const latestOrder = await this.orderRepository.findOne({
      where: {
        order_number: Like(`ORD${yyyymmdd}%`),
      },
      order: {
        order_number: 'DESC',
      },
    });

    let nextNumber = 1;
    if (latestOrder) {
      const last3Digits = latestOrder.order_number.slice(-3);
      nextNumber = parseInt(last3Digits) + 1;
    }

    const padded = nextNumber.toString().padStart(3, '0');
    return `ORD${yyyymmdd}${padded}`;
  }
}
