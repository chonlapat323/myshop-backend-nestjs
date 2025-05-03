import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Users as PrismaUser } from '@prisma/client';
import { UserRole, UserRoleMap } from 'src/constants/user-role.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { deleteFile } from 'utils/file.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findUsers({
    role,
    page,
    limit,
    search,
  }: {
    role: string;
    page: number;
    limit: number;
    search: string;
  }) {
    const skip = (page - 1) * limit;

    const roleWhere = role ? { role_id: String(UserRoleMap[role]) } : {};

    const where: Prisma.UsersWhereInput = search
      ? {
          AND: [
            { ...roleWhere },
            {
              OR: [
                {
                  first_name: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  last_name: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              ],
            },
          ],
        }
      : {
          ...roleWhere,
        };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.users.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageCount: Math.ceil(total / limit),
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

    const { password, ...safeData } = dto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const data = {
      ...safeData,
      hashed_password: hashedPassword,
      avatar_url: avatarUrl ?? null,
      role_id: UserRole.MEMBER,
    };

    return this.prisma.users.create({ data });
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    avatarFilename?: string,
  ): Promise<PrismaUser> {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...safeData } = dto;

    const safeDataWithoutId = Object.fromEntries(
      Object.entries(safeData).filter(([key]) => key !== 'id'),
    ) as Prisma.UsersUpdateInput;

    const data: Prisma.UsersUpdateInput = {
      ...safeDataWithoutId,
      ...(avatarFilename
        ? { avatar_url: `/uploads/users/${avatarFilename}` }
        : {}),
    };

    if (password && password.trim() !== '') {
      data.hashed_password = await bcrypt.hash(password, 10);
    }

    return this.prisma.users.update({
      where: { id },
      data,
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    if (user.avatar_url) {
      deleteFile(user.avatar_url);
    }

    await this.prisma.users.delete({ where: { id } });

    return { message: 'User deleted successfully' };
  }
}
