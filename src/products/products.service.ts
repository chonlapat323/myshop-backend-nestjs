// src/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import {
  CreateProductDto,
  ImageUrlDto,
  UpdateProductDto,
} from './dto/create-product.dto';
import { Prisma } from '@prisma/client';
import { moveTempProductImage } from 'utils/file.util';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.products.findMany({
      include: {
        product_image: true,
        variants: true,
        products_tags_tags: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.products.findUnique({
      where: { id },
      include: {
        product_image: true,
        variants: true,
        products_tags_tags: true,
        category: true,
      },
    });
  }

  async findPaginated(limit: number, skip: number) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.products.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          product_image: true,
          products_tags_tags: {
            include: {
              tags: true,
            },
          },
        },
      }),
      this.prisma.products.count(),
    ]);

    const mapped = data.map((product) => ({
      ...product,
      tags: product.products_tags_tags.map((ptt) => ptt.tags),
    }));

    return {
      data: mapped,
      total,
      page: skip / limit + 1,
      pageCount: Math.ceil(total / limit),
    };
  }

  async findBestSellers() {
    return this.prisma.products.findMany({
      where: { is_best_seller: true },
      orderBy: { updated_at: 'desc' },
      take: 4,
      include: {
        product_image: true,
        products_tags_tags: {
          include: {
            tags: true,
          },
        },
      },
    });
  }

  async findByCategory(
    slug: string,
    search?: string,
    sort?: 'lowest' | 'highest',
  ) {
    return this.prisma.products.findMany({
      where: {
        category: {
          link: slug,
        },
        is_active: true,
        name: search ? { contains: search, mode: 'insensitive' } : undefined,
      },
      orderBy:
        sort === 'lowest'
          ? { price: 'asc' }
          : sort === 'highest'
            ? { price: 'desc' }
            : undefined,
      include: { product_image: true },
    });
  }

  async create(dto: CreateProductDto) {
    const { tags, variants, imageUrls = [], ...productData } = dto;

    const tagUpserts =
      tags?.map((name) =>
        this.prisma.tags.upsert({
          where: { name },
          update: {},
          create: { name },
        }),
      ) || [];

    const createdTags = await this.prisma.$transaction(tagUpserts);

    const finalImages = imageUrls.map((url, i) => ({
      url: moveTempProductImage(url.url),
      is_main: i === 0,
      order_image: i,
    }));

    return this.prisma.products.create({
      data: {
        ...productData,
        product_image: { create: finalImages },
        variants: { create: variants ?? [] },
        products_tags_tags: {
          create: createdTags.map((tag) => ({ tagsId: tag.id })),
        },
      },
    });
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.prisma.products.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    const { variants, imageUrls, tags, ...rest } = dto;

    const finalImages = imageUrls!.map((img, i) => ({
      id: img.id,
      url: moveTempProductImage(img.url),
      productId: id,
      order_image: i,
      is_main: i === 0,
    }));

    const updateData: any = {
      ...rest,
      category_id: dto.category_id ?? null,
    };

    // update product main info
    await this.prisma.products.update({
      where: { id },
      data: updateData,
    });

    // upsert product_image
    await this.prisma.$transaction(
      finalImages.map((img) =>
        this.prisma.product_image.upsert({
          where: { id: img.id ?? 0 }, // fallback to id: 0 if new
          update: img,
          create: img,
        }),
      ),
    );

    return this.prisma.products.findUnique({
      where: { id },
      include: { product_image: true },
    });
  }

  async remove(id: number) {
    const product = await this.prisma.products.findUnique({
      where: { id },
      include: { product_image: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    for (const img of product.product_image) {
      const filename = img.url.split('/').pop();
      const filePath = path.join(
        process.cwd(),
        'public',
        'uploads',
        'products',
        filename!,
      );
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    return this.prisma.products.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async removeImage(id: number) {
    const image = await this.prisma.product_image.findUnique({ where: { id } });
    if (!image) throw new NotFoundException('Image not found');

    const filename = image.url.split('/').pop();
    const filePath = path.join(
      process.cwd(),
      'public',
      'uploads',
      'products',
      filename!,
    );

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn('⚠️ Failed to delete image file:', err.message);
      // ไม่โยน error เพราะไฟล์หายไม่ถือเป็น failure ใหญ่
    }

    await this.prisma.product_image.delete({ where: { id } });

    return { message: 'Image removed successfully' };
  }

  async syncImages(productId: number, imageUrls: ImageUrlDto[]) {
    const existingImages = await this.prisma.product_image.findMany({
      where: { productId },
    });
    const existingMap = new Map(existingImages.map((img) => [img.url, img]));
    const incomingUrls = imageUrls.map((img) => img.url);

    const toDelete = existingImages.filter(
      (img) => !incomingUrls.includes(img.url),
    );
    await this.prisma.product_image.deleteMany({
      where: { id: { in: toDelete.map((img) => img.id) } },
    });

    const imagesToSave = imageUrls.map((img, i) => {
      const existing = existingMap.get(img.url);
      return existing
        ? { ...existing, order_image: i, is_main: i === 0 }
        : { url: img.url, productId, order_image: i, is_main: i === 0 };
    });

    await this.prisma.$transaction(
      imagesToSave.map((img) => {
        if ('id' in img && typeof img.id === 'number') {
          // มี id → upsert
          return this.prisma.product_image.upsert({
            where: { id: img.id },
            update: {
              url: img.url,
              productId: img.productId,
              order_image: img.order_image,
              is_main: img.is_main,
            },
            create: {
              url: img.url,
              productId: img.productId,
              order_image: img.order_image,
              is_main: img.is_main,
            },
          });
        } else {
          // ไม่มี id → สร้างใหม่
          return this.prisma.product_image.create({
            data: {
              url: img.url,
              productId: img.productId,
              order_image: img.order_image,
              is_main: img.is_main,
            },
          });
        }
      }),
    );
  }
}
