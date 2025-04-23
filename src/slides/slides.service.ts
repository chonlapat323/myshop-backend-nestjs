import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import * as path from 'path';
import * as fs from 'fs';
import { moveTempSlideImage } from 'utils/file.util';

@Injectable()
export class SlidesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 10, isActive?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (isActive !== undefined) {
      where.is_active = isActive === 'true';
    }

    const [slides, total] = await this.prisma.$transaction([
      this.prisma.slides.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          slide_images: true,
        },
      }),
      this.prisma.slides.count({ where }),
    ]);

    return {
      data: slides,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    };
  }

  async findOne(id: number) {
    const slide = await this.prisma.slides.findUnique({
      where: { id },
      include: { slide_images: true },
    });

    if (!slide) throw new NotFoundException('Slide not found');
    return slide;
  }

  async findDefault() {
    const slide = await this.prisma.slides.findFirst({
      where: { is_default: true },
      include: { slide_images: true },
    });

    if (!slide) throw new NotFoundException('ไม่พบสไลด์ default');
    return slide;
  }

  async create(dto: CreateSlideDto) {
    const { imageUrls = [], ...slideData } = dto;

    if (dto.is_default) {
      await this.prisma.slides.updateMany({
        data: { is_default: false },
        where: { is_default: true },
      });
    }

    const slide = await this.prisma.slides.create({
      data: {
        ...slideData,
      },
    });

    const finalImages = imageUrls.map((img, index) => ({
      url: moveTempSlideImage(img.url),
      order_image: index,
      slide_id: slide.id,
    }));

    await this.prisma.slide_images.createMany({
      data: finalImages as any, // safe cast due to filtering above
    });

    return this.findOne(slide.id);
  }

  async update(id: number, dto: UpdateSlideDto) {
    const { imageUrls, ...rest } = dto;

    const slide = await this.prisma.slides.findUnique({ where: { id } });
    if (!slide) throw new NotFoundException('Slide not found');

    if (dto.is_default) {
      await this.prisma.slides.updateMany({
        data: { is_default: false },
        where: { is_default: true },
      });
    }

    await this.prisma.slides.update({
      where: { id },
      data: rest,
    });

    if (imageUrls) {
      const finalImages = imageUrls.map((img, index) => ({
        id: img.id,
        url: moveTempSlideImage(img.url),
        order_image: index,
        slide_id: id,
      }));

      await this.prisma.$transaction(
        finalImages.map((img) =>
          this.prisma.slide_images.upsert({
            where: { id: img.id ?? 0 },
            update: img,
            create: img,
          }),
        ),
      );
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.prisma.slide_images.deleteMany({ where: { slide_id: id } });
    await this.prisma.slides.delete({ where: { id } });
    return { message: 'Slide deleted successfully' };
  }

  async removeImage(id: number) {
    const image = await this.prisma.slide_images.findUnique({ where: { id } });
    if (!image) throw new NotFoundException('Image not found');

    const filename = image.url.split('/').pop();
    const filePath = path.join(
      process.cwd(),
      'public',
      'uploads',
      'slides',
      filename!,
    );

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn('⚠️ Failed to delete image file:', err.message);
    }

    await this.prisma.slide_images.delete({ where: { id } });

    return { message: 'Image removed successfully' };
  }
}
