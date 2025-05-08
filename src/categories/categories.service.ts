import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category as Category, Prisma } from '@prisma/client';
import { deleteFile } from 'utils/file.util';
import { handlePrismaError } from 'src/common/prisma-error-handler';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllIncludingDeleted(): Promise<Category[]> {
    return this.prisma.category.findMany({
      orderBy: { order: 'asc', created_at: 'desc' },
    });
  }

  findActive(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        is_active: true,
        deleted_at: null,
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('ไม่พบหมวดหมู่');
    }
    return category;
  }

  async findPaginated({
    page,
    limit,
    search,
    isActive,
  }: {
    page: number;
    limit: number;
    search: string;
    isActive?: string;
  }) {
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {
      deleted_at: null,
      ...(isActive !== undefined && {
        is_active: isActive === 'true',
      }),
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { order: 'asc' },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageCount: Math.ceil(total / limit),
    };
  }

  async create(dto: CreateCategoryDto, image?: string): Promise<Category> {
    try {
      return await this.prisma.category.create({
        data: {
          ...dto,
          image,
        },
      });
    } catch (error) {
      handlePrismaError(error);
      throw error;
    }
  }

  async update(
    id: number,
    dto: UpdateCategoryDto,
    imagePath?: string,
  ): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('ไม่พบหมวดหมู่');
    }

    if (imagePath && category.image) {
      const relativePath = category.image.replace('/uploads/', '');
      await deleteFile(relativePath);
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...dto,
          image: imagePath ?? category.image,
        },
      });
    } catch (error: any) {
      handlePrismaError(error);
      throw error;
    }
  }

  async updateOrder(data: { id: number; order: number }[]) {
    const updatePromises = data.map((item) =>
      this.prisma.category.update({
        where: { id: item.id },
        data: { order: item.order },
      }),
    );

    await Promise.all(updatePromises);
    return { message: '✅ Categories reordered successfully' };
  }

  async remove(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (category.image) {
      const relativePath = category.image.replace('/uploads/', '');
      await deleteFile(relativePath);
    }
    await this.prisma.category.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: `Category with ID ${id} removed successfully.` };
  }
}
