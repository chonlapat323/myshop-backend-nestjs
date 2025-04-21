import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { PrismaService } from 'src/prisma/prisma.service';
import { addresses as PrismaAddress } from '@prisma/client';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private prisma: PrismaService,
  ) {}
  async create(userId: number, dto: CreateAddressDto) {
    const address = this.addressRepo.create({ ...dto, user_id: userId });

    // ถ้า is_default == true ต้อง set default address อื่นเป็น false ก่อน
    if (dto.is_default) {
      await this.addressRepo.update({ user_id: userId }, { is_default: false });
    }

    return this.addressRepo.save(address);
  }

  async findAll(userId: number) {
    return this.addressRepo.find({
      where: { user_id: userId },
      order: { is_default: 'DESC', created_at: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const address = await this.addressRepo.findOne({
      where: { id, user_id: userId },
    });

    if (!address) {
      throw new NotFoundException('ไม่พบที่อยู่');
    }

    return address;
  }

  async update(id: number, userId: number, dto: UpdateAddressDto) {
    const address = await this.findOne(id, userId);

    if (dto.is_default) {
      await this.addressRepo.update({ user_id: userId }, { is_default: false });
    }

    Object.assign(address, dto);

    return this.addressRepo.save(address);
  }

  async setDefault(addressId: number, userId: number): Promise<PrismaAddress> {
    // ตรวจสอบว่า address นี้เป็นของผู้ใช้จริง
    const address = await this.prisma.addresses.findUnique({
      where: { id: addressId },
    });

    if (!address || address.user_id !== userId) {
      throw new ForbiddenException('คุณไม่สามารถแก้ไขที่อยู่นี้ได้');
    }

    // 1. Set is_default = false สำหรับ address ทั้งหมดของ user นี้
    await this.prisma.addresses.updateMany({
      where: { user_id: userId },
      data: { is_default: false },
    });

    // 2. Set is_default = true สำหรับ address ที่เลือก
    const updated = await this.prisma.addresses.update({
      where: { id: addressId },
      data: { is_default: true },
    });

    return updated;
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
