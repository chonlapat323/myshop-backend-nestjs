import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, OrderStatus } from '@prisma/client';
import { Order } from 'types/member/order';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateOrderDto) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const products = await this.prisma.products.findMany({
      where: { id: { in: dto.items.map((i) => i.productId) } },
    });

    const orderNumber = await this.generateOrderNumber();

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
        price,
      };
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const discount = dto.discountValue || 0;
    const shipping = dto.shippingCost || 0;
    const total = subtotal - discount + shipping;

    const order = await this.prisma.order.create({
      data: {
        userId,
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

    await this.prisma.order_items.createMany({
      data: orderItems.map((item) => ({
        ...item,
        orderId: order.id,
      })),
    });

    const cart = await this.prisma.cart.findFirst({
      where: { user_id: userId },
    });

    if (cart) {
      await this.prisma.cart_item.deleteMany({ where: { cart_id: cart.id } });
      await this.prisma.cart.delete({ where: { id: cart.id } });
    }

    return order;
  }

  async findAll(): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { id: true, email: true } },
        order_items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
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
      email: order.users.email,
      order_number: order.order_number,
      total_price: Number(order.total_price),
      order_status: order.order_status,
      created_at: order.created_at.toISOString(),
      tracking_number: order.tracking_number ?? null,
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

  async findByUserId(userId: number): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        order_status: {
          not: OrderStatus.cancelled,
        },
      },
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
      order_status: order.order_status,
      created_at: order.created_at.toISOString(),
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
      tracking_number: order.tracking_number ?? null,
    }));
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, email: true } },
        order_items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
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

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      id: order.id,
      order_number: order.order_number,
      total_price: Number(order.total_price),
      order_status: order.order_status,
      created_at: order.created_at.toISOString(),
      tracking_number: order.tracking_number ?? undefined,
      user_name: order.users?.email ?? null,
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
    };
  }

  async updateOrder(id: number, data: UpdateOrderDto) {
    return this.prisma.order.update({
      where: { id },
      data: {
        order_status: data.order_status,
        tracking_number: data.tracking_number ?? null,
      },
    });
  }

  async cancelOrder(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.order_status === OrderStatus.cancelled) {
      throw new BadRequestException('Order already cancelled');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { order_status: OrderStatus.cancelled },
    });
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `ORD${yyyymmdd}`;

    const latestOrder = await this.prisma.order.findFirst({
      where: { order_number: { startsWith: prefix } },
      orderBy: { order_number: 'desc' },
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
