// src/admins/admins.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from './admins.entity';
import { Repository } from 'typeorm';
import { CreateAdminDto } from './admins.dto';
import * as bcrypt from 'bcrypt';

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
}
