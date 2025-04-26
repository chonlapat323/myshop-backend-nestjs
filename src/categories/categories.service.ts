import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { category as Category } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import { deleteFile } from 'utils/file.util';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllIncludingDeleted(): Promise<Category[]> {
    return this.prisma.category.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  findActive(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        is_active: true,
        deleted_at: null,
      },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('ไม่พบหมวดหมู่');
    }
    return category;
  }

  async findPaginated(limit: number, skip: number) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        where: {
          deleted_at: null,
        },
      }),
      this.prisma.category.count({ where: { deleted_at: null } }),
    ]);

    return {
      data,
      total,
      page: skip / limit + 1,
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
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('ชื่อหมวดหมู่มีอยู่แล้ว');
      }
      throw new InternalServerErrorException('ไม่สามารถเพิ่มหมวดหมู่ได้');
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
      if (error.code === 'P2002') {
        throw new ConflictException('ชื่อหมวดหมู่ซ้ำ');
      }
      throw new InternalServerErrorException('ไม่สามารถแก้ไขหมวดหมู่ได้');
    }
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
