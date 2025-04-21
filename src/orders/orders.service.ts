import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { DeepPartial, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/product.entity';
import { User } from 'src/users/user.entity';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderItem } from 'src/order-item/entities/order-item.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Order } from 'types/member/order';
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private prisma: PrismaService,
  ) {}

  async create(userId: number, dto: CreateOrderDto) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const products = await this.prisma.products.findMany({
      where: { id: { in: dto.items.map((i) => i.productId) } },
    });

    const orderNumber = await this.generateOrderNumber();

    // คำนวณราคาจาก product snapshot
    const orderItems = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product)
        throw new NotFoundException(`Product ${item.productId} not found`);
      const price =
        product.price instanceof Prisma.Decimal
          ? product.price.toNumber()
          : Number(product.price);
      return {
        productId: product.id,
        product_name: product.name,
        quantity: item.quantity,
        price: price,
      };
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const discount = dto.discountValue || 0;
    const shipping = dto.shippingCost || 0;
    const total = subtotal - discount + shipping;

    // สร้าง order
    const order = await this.prisma.order.create({
      data: {
        userId: userId,
        order_number: orderNumber,
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
      },
    });

    // สร้าง order_items
    await this.prisma.order_items.createMany({
      data: orderItems.map((item) => ({
        ...item,
        orderId: order.id, // ✅ แก้จาก order_id
        productId: item.productId, // ✅ แก้จาก product_id
      })),
    });

    const cart = await this.prisma.cart.findFirst({
      where: { user_id: userId },
    });

    if (cart) {
      await this.prisma.cart_item.deleteMany({
        where: { cart_id: cart.id },
      });

      await this.prisma.cart.delete({
        where: { id: cart.id },
      });
    }

    return order;
  }

  // findAll(): Promise<Order[]> {
  //   return this.orderRepository.find({
  //     relations: ['user', 'items', 'items.product'],
  //     order: { created_at: 'DESC' },
  //   });
  // }

  async findByUserId(userId: number): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { created_at: 'desc' },
      include: {
        order_items: {
          include: {
            product: {
              include: {
                product_image: {
                  where: { is_main: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      order_number: order.order_number,
      total_price: Number(order.total_price),
      status: order.status,
      created_at: order.created_at.toISOString(), // ✅ แปลงเป็น string
      items: order.order_items.map((item) => ({
        id: item.id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: Number(item.price),
        product: {
          product_image: item.product.product_image.map((img) => ({
            id: img.id,
            is_main: img.is_main,
            url: img.url,
            productId: img.productId,
            order_image: img.order_image,
          })),
        },
      })),
    }));
  }

  // async findOne(id: number): Promise<Order> {
  //   const order = await this.orderRepository.findOne({
  //     where: { id },
  //     relations: ['user', 'items', 'items.product'],
  //   });
  //   if (!order) throw new NotFoundException('Order not found');
  //   return order;
  // }

  // async update(id: number, dto: UpdateOrderDto): Promise<Order> {
  //   const order = await this.orderRepository.findOneBy({ id });
  //   if (!order) {
  //     throw new NotFoundException('Order not found');
  //   }

  //   if (dto.status) {
  //     order.status = dto.status;
  //   }

  //   return await this.orderRepository.save(order);
  // }

  // async remove(id: number): Promise<void> {
  //   const order = await this.findOne(id);
  //   await this.orderRepository.remove(order);
  // }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    const prefix = `ORD${yyyymmdd}`;

    // หา order ล่าสุดของวันนั้น (ใช้ order_number LIKE 'ORDyyyymmdd%')
    const latestOrder = await this.prisma.order.findFirst({
      where: {
        order_number: {
          startsWith: prefix,
        },
      },
      orderBy: {
        order_number: 'desc',
      },
    });

    let nextNumber = 1;
    if (latestOrder) {
      const last3Digits = latestOrder.order_number.slice(-3);
      nextNumber = parseInt(last3Digits, 10) + 1;
    }

    const padded = nextNumber.toString().padStart(3, '0');
    return `${prefix}${padded}`;
  }
}
