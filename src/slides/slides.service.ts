import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Slide } from './entities/slide.entity';
import { SlideImage } from './entities/slide-image.entity';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
@Injectable()
export class SlidesService {
  constructor(
    @InjectRepository(Slide)
    private readonly slideRepository: Repository<Slide>,

    @InjectRepository(SlideImage)
    private readonly slideImageRepository: Repository<SlideImage>,
  ) {}

  // slides.service.ts
  async findAll(page = 1, limit = 10, isActive?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (isActive !== undefined) {
      where.is_active = isActive === 'true';
    }

    const [slides, total] = await this.slideRepository.findAndCount({
      where,
      take: limit,
      skip,
      order: { created_at: 'DESC' },
      relations: ['images'],
    });

    return {
      data: slides,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    };
  }

  async findOne(id: string): Promise<Slide> {
    const slide = await this.slideRepository.findOne({ where: { id } });
    if (!slide) {
      throw new NotFoundException('Slide not found');
    }
    return slide;
  }

  async findDefault(): Promise<Slide> {
    const slide = await this.slideRepository.findOne({
      where: { is_default: true },
    });

    if (!slide) {
      throw new NotFoundException('ไม่พบสไลด์ default');
    }

    return slide;
  }

  async create(dto: CreateSlideDto) {
    const { imageUrls = [], ...slideData } = dto;
    const imageEntities: SlideImage[] = [];

    if (dto.is_default) {
      await this.slideRepository
        .createQueryBuilder()
        .update()
        .set({ is_default: false })
        .execute();
    }

    for (const [index, img] of imageUrls.entries()) {
      let finalUrl = img.url;

      if (img.url.startsWith('/public/temp-uploads/')) {
        const filename = img.url.split('/').pop();
        if (!filename) continue;

        const tempPath = path.join(
          __dirname,
          '..',
          '..',
          'public',
          'temp-uploads',
          filename,
        );
        const finalPath = path.join(
          __dirname,
          '..',
          '..',
          'public',
          'uploads',
          'slides',
          filename,
        );

        if (fs.existsSync(tempPath)) {
          fs.renameSync(tempPath, finalPath);
          finalUrl = `/public/uploads/slides/${filename}`;
        }
      }

      const image = this.slideRepository.manager.create(SlideImage, {
        url: finalUrl,
        order_image: index,
      });

      imageEntities.push(image);
    }

    const slide = this.slideRepository.create({
      ...slideData,
      images: imageEntities,
    });

    return this.slideRepository.save(slide);
  }

  async update(id: string, dto: UpdateSlideDto) {
    const { imageUrls, ...rest } = dto;
    const slide = await this.slideRepository.findOne({ where: { id } });
    if (!slide) throw new NotFoundException('Slide not found');

    if (dto.is_default) {
      await this.slideRepository
        .createQueryBuilder()
        .update()
        .set({ is_default: false })
        .where('is_default = true')
        .execute();
    }
    // 🔸 merge ข้อมูลอื่น ๆ เช่น title, description, is_active, is_default
    Object.assign(slide, rest);

    // ✅ บันทึกข้อมูล slide หลักก่อน
    await this.slideRepository.save(slide);

    // 🔸 Sync image ถ้ามี
    if (imageUrls) {
      await this.syncSlideImages(id, imageUrls);
    }

    return this.findOne(id);
  }

  private async syncSlideImages(
    slideId: string,
    images: { id?: number; url: string }[],
  ) {
    const finalImages: SlideImage[] = [];

    for (const [index, img] of images.entries()) {
      let finalUrl = img.url;

      if (img.url.startsWith('/public/temp-uploads/')) {
        const filename = img.url.split('/').pop();
        if (!filename) continue;

        const tempPath = path.join(
          __dirname,
          '..',
          '..',
          'public',
          'temp-uploads',
          filename,
        );
        const finalPath = path.join(
          __dirname,
          '..',
          '..',
          'public',
          'uploads',
          'slides',
          filename,
        );

        if (fs.existsSync(tempPath)) {
          fs.renameSync(tempPath, finalPath);
          finalUrl = `/public/uploads/slides/${filename}`;
        }
      }

      finalImages.push(
        this.slideRepository.manager.create(SlideImage, {
          id: img.id, // ถ้ามี id แสดงว่าเป็นรูปเดิม
          url: finalUrl,
          order_image: index,
          slide_id: slideId,
        }),
      );
    }

    // 🔸 ลบรูปเก่าทิ้งทั้งหมดก่อน แล้วค่อย insert ใหม่ (ง่ายและปลอดภัยกว่า)
    await this.slideImageRepository.delete({ slide_id: slideId });
    await this.slideImageRepository.save(finalImages);
  }

  remove(id: number) {
    return `This action removes a #${id} slide`;
  }
}
