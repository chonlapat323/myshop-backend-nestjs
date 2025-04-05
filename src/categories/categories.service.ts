import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { QueryFailedError, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto, image?: string) {
    const category = this.categoryRepo.create({
      ...dto,
      image,
    });

    try {
      return await this.categoryRepo.save(category);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).code === '23505'
      ) {
        throw new ConflictException('ชื่อหมวดหมู่มีอยู่แล้ว');
      }
      throw new InternalServerErrorException('ไม่สามารถเพิ่มหมวดหมู่ได้');
    }
  }

  findAll() {
    return `This action returns all categories`;
  }

  async findOne(id: number) {
    const category = await this.categoryRepo.findOneBy({ id });
    if (!category) {
      throw new NotFoundException('ไม่พบหมวดหมู่');
    }
    return category;
  }

  async findPaginated(limit: number, skip: number) {
    const [data, total] = await this.categoryRepo.findAndCount({
      take: limit,
      skip,
      order: { created_at: 'DESC' }, // ถ้าคุณมี field นี้
    });

    return {
      data,
      total,
      page: skip / limit + 1,
      pageCount: Math.ceil(total / limit),
    };
  }

  async update(id: number, dto: UpdateCategoryDto, imagePath?: string) {
    const category = await this.categoryRepo.findOneBy({ id });
    if (!category) {
      throw new NotFoundException('ไม่พบหมวดหมู่');
    }

    // ถ้าอัปโหลดภาพใหม่ และ category มีภาพเดิม → ลบภาพเดิมออกจาก disk
    if (imagePath && category.image) {
      const oldImagePath = path.join(
        __dirname,
        '..',
        '..',
        'public',
        category.image,
      );
      fs.unlink(oldImagePath, (err) => {
        if (err) console.error('❌ Failed to remove old image:', err);
      });
    }

    Object.assign(category, dto);
    if (imagePath) {
      category.image = imagePath;
    }

    try {
      return await this.categoryRepo.save(category);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).code === '23505'
      ) {
        throw new ConflictException('ชื่อหมวดหมู่ซ้ำ');
      }
      throw new InternalServerErrorException('ไม่สามารถแก้ไขหมวดหมู่ได้');
    }
  }

  async remove(id: number) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // ✅ ลบไฟล์รูปภาพ ถ้ามี
    if (category.image) {
      const imagePath = path.join(__dirname, '..', '..', category.image);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error('❌ Error deleting image file:', err);
        } else {
          console.log('✅ Image file deleted:', imagePath);
        }
      });
    }

    await this.categoryRepo.remove(category);

    return { message: `Category with ID ${id} removed successfully.` };
  }
}
