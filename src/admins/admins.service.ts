import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admins.dto';
import { UpdateAdminDto } from './dto/update-admins.dto';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import { pick } from 'src/common/utils/clean-dto.util';
import { users as User } from '@prisma/client';
import { UserRole } from 'src/constants/user-role.enum';

@Injectable()
export class AdminsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: number): Promise<User | null> {
    return this.prisma.users.findUnique({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.users.findMany({
      where: { role_id: UserRole.ADMIN }, // สมมุติ admin คือ role_id = 1
    });
  }

  async create(dto: CreateAdminDto, avatarUrl?: string) {
    const { password, confirm_password, ...safeData } = dto;
    const hashedPassword = await bcrypt.hash(dto.password!, 10);

    const data = {
      ...safeData,
      hashed_password: hashedPassword,
      avatar_url: avatarUrl ?? null,
      role_id: UserRole.ADMIN, // สมมุติ admin
    };

    return this.prisma.users.create({ data });
  }

  async update(
    id: number,
    dto: UpdateAdminDto,
    avatarFilename?: string,
  ): Promise<User> {
    const admin = await this.findById(id);
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    if (dto.password && dto.password.trim() !== '') {
      dto.hashed_password = await bcrypt.hash(dto.password, 10);
    }

    const data = pick(dto, [
      'first_name',
      'last_name',
      'email',
      'hashed_password',
      'role_id',
      'phone_number',
      'is_active',
      'note',
    ]);

    if (avatarFilename) {
      data.avatar_url = `/uploads/users/${avatarFilename}`;
    }

    return this.prisma.users.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    const admin = await this.findById(id);
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    if (admin.avatar_url) {
      const filePath = path.join(process.cwd(), 'public', admin.avatar_url);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('❌ Failed to delete avatar:', err.message);
        }
      });
    }

    await this.prisma.users.delete({ where: { id } });
    return { message: 'Admin deleted successfully' };
  }
}
