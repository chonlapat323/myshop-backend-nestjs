import { Injectable } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

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

    if (!product) throw new Error('Product not found');

    const price = product.discountPrice ?? product.price;

    // 6. เพิ่มรายการใหม่ลง cart_item
    return this.prisma.cart_item.create({
      data: {
        cart_id: cart.id,
        product_id: productId,
        quantity,
        price_snapshot: price,
      },
    });
  }

  create(createCartDto: CreateCartDto) {
    return 'This action adds a new cart';
  }

  findAll() {
    return `This action returns all cart`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cart`;
  }

  update(id: number, updateCartDto: UpdateCartDto) {
    return `This action updates a #${id} cart`;
  }

  remove(id: number) {
    return `This action removes a #${id} cart`;
  }
}
