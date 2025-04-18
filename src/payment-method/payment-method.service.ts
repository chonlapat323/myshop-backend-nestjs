import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePaymentMethodDto) {
    return this.prisma.paymentMethod.create({
      data: {
        ...dto,
        user_id: userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const payment = await this.prisma.paymentMethod.findFirst({
      where: { id, user_id: userId },
    });

    if (!payment) throw new NotFoundException('Payment method not found');
    return payment;
  }

  async update(id: string, userId: string, dto: UpdatePaymentMethodDto) {
    await this.findOne(id, userId);

    return this.prisma.paymentMethod.update({
      where: { id },
      data: dto,
    });
  }

  async setDefault(id: string, userId: string) {
    const payment = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!payment || payment.user_id !== userId) {
      throw new NotFoundException('Payment method not found');
    }

    await this.prisma.paymentMethod.updateMany({
      where: { user_id: userId },
      data: { is_default: false },
    });

    const updated = await this.prisma.paymentMethod.update({
      where: { id },
      data: { is_default: true },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.paymentMethod.delete({
      where: { id },
    });
  }
}
