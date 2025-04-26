import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCartItemCount(userId: number) {
    const result = await this.prisma.cart_item.aggregate({
      _sum: {
        quantity: true,
      },
      where: {
        cart: {
          user_id: userId,
        },
      },
    });
    //count: result?.items.reduce((sum, item) => sum + item.quantity, 0) || 0,
    return {
      count: result._sum.quantity || 0,
    };
  }

  async addItemToCart(userId: number, productId: number, quantity: number) {
    // 1. ค้นหา cart ของ user
    let cart = await this.prisma.cart.findFirst({
      where: { user_id: userId },
    });

    // 2. ถ้ายังไม่มี cart → สร้างใหม่
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          user_id: userId,
        },
      });
    }

    // 3. ตรวจสอบว่ามี cart_item อยู่แล้วไหม
    const existingItem = await this.prisma.cart_item.findFirst({
      where: {
        cart_id: cart.id,
        product_id: productId,
      },
    });

    // 4. ถ้ามี → update จำนวน
    if (existingItem) {
      return this.prisma.cart_item.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });
    }

    // 5. ถ้าไม่มี → ดึงราคาจาก product ก่อน
    const product = await this.prisma.products.findUnique({
      where: { id: productId },
    });

    if (!product) throw new NotFoundException('Product not found');

    // 6. เพิ่มรายการใหม่ลง cart_item
    return this.prisma.cart_item.create({
      data: {
        cart_id: cart.id,
        product_id: productId,
        quantity,
        price_snapshot: product.price,
        discount_snapshot: product.discountPrice ?? null,
      },
    });
  }

  async getCartByUserId(userId: number) {
    const cart = await this.prisma.cart.findFirst({
      where: { user_id: userId },
      include: {
        items: {
          orderBy: {
            created_at: 'asc',
          },
          include: {
            products: {
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

    if (!cart) {
      return {
        cart_id: null,
        items: [],
        total: 0,
      };
    }

    return {
      cart_id: cart.id,
      items: cart.items.map((item) => {
        const productImages = item.products.product_image;
        const mainImage =
          productImages.find((img) => img.is_main) || productImages[0];

        return {
          id: item.id,
          product_id: item.product_id,
          name: item.products.name,
          quantity: item.quantity,
          price_snapshot: item.price_snapshot,
          image: mainImage?.url ?? null,
        };
      }),
    };
  }

  async updateCartItemQuantity(
    cartItemId: number,
    quantity: number,
    userId: number,
  ) {
    const cartItem = await this.prisma.cart_item.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
      },
    });

    if (!cartItem || cartItem.cart.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.cart_item.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }

  async removeCartItem(cartItemId: number, userId: number) {
    const cartItem = await this.prisma.cart_item.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
      },
    });

    if (!cartItem || cartItem.cart.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.cart_item.delete({
      where: { id: cartItemId },
    });
  }
}
