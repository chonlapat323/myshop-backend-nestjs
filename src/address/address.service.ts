import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { addresses as PrismaAddress } from '@prisma/client';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateAddressDto): Promise<PrismaAddress> {
    if (dto.is_default) {
      await this.prisma.addresses.updateMany({
        where: { user_id: userId },
        data: { is_default: false },
      });
    }

    return this.prisma.addresses.create({
      data: {
        ...dto,
        user_id: userId,
      },
    });
  }

  async findAll(userId: number): Promise<PrismaAddress[]> {
    return this.prisma.addresses.findMany({
      where: { user_id: userId },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });
  }

  async findOne(id: number, userId: number): Promise<PrismaAddress> {
    const address = await this.prisma.addresses.findUnique({
      where: { id },
    });

    if (!address || address.user_id !== userId) {
      throw new NotFoundException('ไม่พบที่อยู่');
    }

    return address;
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateAddressDto,
  ): Promise<PrismaAddress> {
    await this.findOne(id, userId);

    if (dto.is_default) {
      await this.prisma.addresses.updateMany({
        where: { user_id: userId },
        data: { is_default: false },
      });
    }

    return this.prisma.addresses.update({
      where: { id },
      data: dto,
    });
  }

  async setDefault(addressId: number, userId: number): Promise<PrismaAddress> {
    const address = await this.prisma.addresses.findUnique({
      where: { id: addressId },
    });

    if (!address || address.user_id !== userId) {
      throw new ForbiddenException('คุณไม่สามารถแก้ไขที่อยู่นี้ได้');
    }

    await this.prisma.addresses.updateMany({
      where: { user_id: userId },
      data: { is_default: false },
    });

    return this.prisma.addresses.update({
      where: { id: addressId },
      data: { is_default: true },
    });
  }

  async remove(id: number, userId: number): Promise<void> {
    const address = await this.prisma.addresses.findUnique({
      where: { id },
    });

    if (!address || address.user_id !== userId) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์ลบที่อยู่นี้');
    }

    await this.prisma.addresses.delete({
      where: { id },
    });
  }
}
