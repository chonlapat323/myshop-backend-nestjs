import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admins.dto';
import { UpdateAdminDto } from './dto/update-admins.dto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Users as User } from '@prisma/client';
import { UserRole } from 'src/constants/user-role.enum';
import { deleteFile } from 'utils/file.util';
import { handlePrismaError } from 'src/common/prisma-error-handler';

@Injectable()
export class AdminsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: number): Promise<User | null> {
    return this.prisma.users.findUnique({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.users.findMany({
      where: { role_id: UserRole.ADMIN },
    });
  }

  async create(dto: CreateAdminDto, avatarUrl?: string): Promise<User> {
    const { password, confirm_password, ...safeData } = dto;
    const hashedPassword = await bcrypt.hash(dto.password!, 10);

    const data: Prisma.UsersCreateInput = {
      ...safeData,
      hashed_password: hashedPassword,
      avatar_url: avatarUrl ?? null,
      role_id: UserRole.ADMIN, // สมมุติ admin
    };

    try {
      return await this.prisma.users.create({ data });
    } catch (error) {
      handlePrismaError(error);
      throw error;
    }
  }

  async update(
    id_: number,
    dto: UpdateAdminDto,
    avatarFilename?: string,
  ): Promise<User> {
    const admin = await this.findById(id_);
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id_} not found`);
    }

    const { password, id, ...safeData } = dto;

    const updateData: Prisma.UsersUpdateInput = {
      ...safeData,
      ...(avatarFilename
        ? { avatar_url: `/uploads/users/${avatarFilename}` }
        : {}),
    };

    if (password && password.trim() !== '') {
      updateData.hashed_password = await bcrypt.hash(password, 10);
    }

    try {
      return await this.prisma.users.update({
        where: { id: id_ },
        data: updateData,
      });
    } catch (error) {
      handlePrismaError(error);
      throw error;
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    const admin = await this.findById(id);
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    if (admin.avatar_url) {
      deleteFile(admin.avatar_url);
    }

    await this.prisma.users.delete({ where: { id } });
    return { message: 'Admin deleted successfully' };
  }
}
