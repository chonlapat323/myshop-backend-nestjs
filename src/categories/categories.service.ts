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

  findOne(id: number) {
    return `This action returns a #${id} category`;
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

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return `This action updates a #${id} category`;
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
