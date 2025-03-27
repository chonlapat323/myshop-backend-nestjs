// src/admins/admins.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from './admins.entity';
import { Repository } from 'typeorm';
import { CreateAdminDto } from './admins.dto';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
  ) {}

  async create(dto: CreateAdminDto, avatarUrl?: string) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    console.log('PASSWORD:::' + hashedPassword);
    const newAdmin = this.adminRepo.create({
      ...dto,
      hashed_password: hashedPassword,
      avatar_url: avatarUrl ?? '', // ✅ string หรือ null
    });

    return this.adminRepo.save(newAdmin);
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
