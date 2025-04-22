import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { pick } from 'src/common/utils/clean-dto.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { users as PrismaUser } from '@prisma/client';
import { UserRole, UserRoleMap } from 'src/constants/user-role.enum';
import * as path from 'path';
import * as fs from 'fs';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findUsers({ role, page }: { role?: string; page: number }) {
    const take = 10;
    const skip = (page - 1) * take;

    const where = role ? { role_id: String(UserRoleMap[role]) } : {};

    const [items, count] = await this.prisma.$transaction([
      this.prisma.users.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.users.count({ where }),
    ]);

    return {
      items,
      totalPages: Math.ceil(count / take),
    };
  }

  async findByEmail(email: string): Promise<PrismaUser | null> {
    return this.prisma.users.findUnique({ where: { email } });
  }

  async findUserById(id: number): Promise<PrismaUser> {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้นี้ในระบบ');
    return user;
  }

  async findByRoles(roleIds: string[]): Promise<PrismaUser[]> {
    return this.prisma.users.findMany({
      where: { role_id: { in: roleIds } },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(dto: CreateUserDto, avatarUrl?: string): Promise<PrismaUser> {
    const existing = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email นี้ถูกใช้งานแล้ว');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const userData = pick(dto, [
      'first_name',
      'last_name',
      'email',
      'phone_number',
      'note',
      'is_active',
    ]);

    return this.prisma.users.create({
      data: {
        ...userData,
        hashed_password: hashed,
        avatar_url: avatarUrl,
        role_id: UserRole.MEMBER,
      },
    });
  }

  async update(id: number, dto: UpdateUserDto): Promise<PrismaUser> {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.users.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    if (user.avatar_url) {
      const filePath = path.join(
        __dirname,
        '..',
        '..',
        'public',
        'users',
        user.avatar_url,
      );
      fs.unlink(filePath, (err) => {
        if (err) console.error('❌ Failed to delete avatar:', err.message);
        else console.log('🗑️ Avatar deleted:', filePath);
      });
    }

    await this.prisma.users.delete({ where: { id } });

    return { message: 'User deleted successfully' };
  }
}
