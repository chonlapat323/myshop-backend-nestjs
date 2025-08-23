import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import * as path from 'path';
import * as fs from 'fs';
import { deleteFile, moveTempSlideImage } from 'utils/file.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class SlidesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({
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

    const where: Prisma.SlidesWhereInput = {
      ...(isActive !== undefined && {
        is_active: isActive === 'true',
      }),
      ...(search && {
        OR: [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
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
      data,
      total,
      page,
      pageCount: Math.ceil(total / limit),
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

    const finalImages: Prisma.Slide_imagesCreateManyInput[] = imageUrls.map(
      (img, index) => ({
        url: moveTempSlideImage(img.url),
        order_image: index,
        slide_id: slide.id,
      }),
    );

    await this.prisma.slide_images.createMany({
      data: finalImages,
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
      // ลบรูปเก่า
      await this.prisma.slide_images.deleteMany({ where: { slide_id: id } });

      // map รูปใหม่
      const finalImages = imageUrls.map((img, index) => ({
        url: moveTempSlideImage(img.url),
        order_image: index,
        slide_id: id,
      }));

      // create รูปใหม่ทั้งหมด
      await this.prisma.slide_images.createMany({
        data: finalImages,
      });
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
    await deleteFile(image.url);
    await this.prisma.slide_images.delete({ where: { id } });

    return { message: 'Image removed successfully' };
  }

  async cleanupTempFiles() {
    const tempDir = path.join(process.cwd(), 'public', 'uploads', 'temp-uploads');
    
    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        let deletedCount = 0;
        
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          const stats = fs.statSync(filePath);
          
          // ลบไฟล์ที่เก่ากว่า 24 ชั่วโมง
          const hoursOld = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
          if (hoursOld > 24) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
        
        return { 
          message: `Cleaned up ${deletedCount} temp files older than 24 hours`,
          deletedCount 
        };
      }
      
      return { message: 'Temp directory not found' };
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
      throw new Error('Failed to cleanup temp files');
    }
  }
}
