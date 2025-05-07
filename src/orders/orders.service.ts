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

  async findPaginated({
    page,
    limit,
    search,
  }: {
    page: number;
    limit: number;
    search: string;
  }) {
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(search && {
        OR: [
          {
            order_number: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            tracking_number: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            shipping_full_name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        where,
        include: {
          Users: { select: { id: true, email: true } },
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
      }),
      this.prisma.order.count({ where }),
    ]);

    const mapped = orders.map((order) => ({
      id: order.id,
      userId: order.userId,
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
      shipping_address: {
        full_name: order.shipping_full_name,
        address_line: order.shipping_address_line1,
        city: order.shipping_city,
        zip_code: order.shipping_zip,
        country: order.shipping_country,
        phone_number: order.shipping_phone,
        state: order.shipping_state,
      },
      User: {
        id: order.Users.id,
        email: order.Users.email,
      },
    }));

    return {
      data: mapped,
      total,
      page,
      pageCount: Math.ceil(total / limit),
    };
  }

  async findByUserId(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: {
          userId,
          order_status: {
            not: OrderStatus.cancelled,
          },
        },
        skip,
        take: limit,
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
      }),
      this.prisma.order.count({
        where: {
          userId,
          order_status: {
            not: OrderStatus.cancelled,
          },
        },
      }),
    ]);

    const mapped = orders.map((order) => ({
      id: order.id,
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
      shipping_address: {
        full_name: order.shipping_full_name,
        address_line: order.shipping_address_line1,
        city: order.shipping_city,
        zip_code: order.shipping_zip,
        country: order.shipping_country,
        phone_number: order.shipping_phone,
        state: order.shipping_state,
      },
    }));

    return {
      data: mapped,
      total,
      page,
      pageCount: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        Users: { select: { id: true, email: true } },
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
      userId: order.userId,
      order_number: order.order_number,
      total_price: Number(order.total_price),
      order_status: order.order_status,
      created_at: order.created_at.toISOString(),
      tracking_number: order.tracking_number ?? undefined,
      user_name: order.Users?.email ?? null,
      items: order.order_items.map((item) => ({
        id: item.id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: Number(item.price),
        discount_price: order.discount_value,
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
      shipping_address: {
        full_name: order.shipping_full_name,
        address_line: order.shipping_address_line1,
        city: order.shipping_city,
        zip_code: order.shipping_zip,
        country: order.shipping_country,
        phone_number: order.shipping_phone!,
        state: order.shipping_state!,
      },
    };
  }

  async create(userId: number, dto: CreateOrderDto) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const products = await this.prisma.products.findMany({
      where: { id: { in: dto.items.map((i) => i.productId) } },
    });

    const orderNumber = await this.generateOrderNumber();
    const discount = dto.discountValue || 0;

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
        discount_price: product.discount_price,
      };
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const shipping = dto.shippingCost || 0;
    const total = subtotal - discount + shipping;

    const cart = await this.prisma.cart.findFirst({
      where: { user_id: userId },
    });

    const orderData = {
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
      shipping_phone: dto.shippingPhone,
      shipping_country: dto.shippingCountry,
      shipping_state: dto.shippingState,
    };

    const result = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({ data: orderData });

      await tx.order_items.createMany({
        data: orderItems.map((item) => ({
          ...item,
          orderId: createdOrder.id,
        })),
      });

      if (cart) {
        await tx.cart_item.deleteMany({ where: { cart_id: cart.id } });
        await tx.cart.delete({ where: { id: cart.id } });
      }

      return createdOrder;
    });

    return result;
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

  async cancelOrderAdmin(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId },
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
