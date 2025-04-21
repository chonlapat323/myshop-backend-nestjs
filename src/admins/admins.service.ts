// src/admins/admins.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAdminDto, UpdateAdminDto } from './admins.dto';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { User } from 'src/users/user.entity';
import { pick } from 'src/common/utils/clean-dto.util';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(User)
    private readonly adminRepo: Repository<User>,
  ) {}

  async findById(id: number): Promise<User | null> {
    return this.adminRepo.findOneBy({ id });
  }

  async create(dto: CreateAdminDto, avatarUrl?: string) {
    const hashedPassword = await bcrypt.hash(dto.password!, 10);
    const newAdmin = this.adminRepo.create({
      ...dto,
      hashed_password: hashedPassword,
      avatar_url: avatarUrl ?? '', // ✅ string หรือ null
    });

    return this.adminRepo.save(newAdmin);
  }

  async update(
    id: number,
    dto: UpdateAdminDto,
    avatarFilename?: string,
  ): Promise<User> {
    const admin = await this.adminRepo.findOneBy({ id });
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    if (dto.password && dto.password.trim() !== '') {
      dto.hashed_password = await bcrypt.hash(dto.password, 10);
    }

    // ✅ ถ้ามีการอัปโหลด avatar ใหม่
    if (avatarFilename) {
      dto.avatar_url = `/uploads/${avatarFilename}`;
    }

    const updateData = pick(dto, [
      'first_name',
      'last_name',
      'email',
      'hashed_password',
      'role_id',
      'phone_number',
      'is_active',
      'note',
      'avatar_url',
    ]);

    await this.adminRepo.update(id, updateData);

    return this.adminRepo.findOneByOrFail({ id });
  }

  async findAll() {
    return this.adminRepo.find();
  }

  async remove(id: number) {
    const admin = await this.adminRepo.findOne({ where: { id } });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    // ลบไฟล์ avatar ถ้ามี
    if (admin.avatar_url) {
      const filePath = path.join(
        __dirname,
        '..',
        '..',
        'public',
        admin.avatar_url,
      );
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('❌ Failed to delete avatar:', err.message);
        } else {
          console.log('🗑️ Avatar deleted:', filePath);
        }
      });
    }

    await this.adminRepo.delete(id);
    return { message: 'Admin deleted successfully' };
  }
}
