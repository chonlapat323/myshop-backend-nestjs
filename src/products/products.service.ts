import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
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

  async findOne(id: number) {
    const data = await this.prisma.products.findUnique({
      where: { id },
      include: {
        product_image: true,
        variants: true,
        category: true,
        products_tags_tags: {
          include: {
            tags: true,
          },
        },
      },
    });

    if (!data) throw new NotFoundException('Product not found');

    return {
      ...data,
      tags: data.products_tags_tags.map((ptt) => ptt.tags),
    };
  }

  async findPaginated({
    page,
    limit,
    search,
    category_id,
    is_active,
  }: {
    page: number;
    limit: number;
    search: string;
    category_id?: string;
    is_active?: string;
  }) {
    const skip = (page - 1) * limit;
    const priceNumber = Number(search);
    const isPriceNumber = !isNaN(priceNumber);

    const orConditions: Prisma.ProductsWhereInput[] = [];

    if (search) {
      orConditions.push(
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          category: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          products_tags_tags: {
            some: {
              tags: {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      );

      if (isPriceNumber) {
        orConditions.push({
          price: {
            equals: priceNumber,
          },
        });
      }
    }

    const where: Prisma.ProductsWhereInput = {
      deleted_at: null,
      ...(search && {
        OR: orConditions,
      }),
      ...(category_id && {
        category_id: Number(category_id),
      }),
      ...(is_active !== undefined && {
        is_active: is_active === 'true',
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.products.findMany({
        skip,
        take: limit,
        where,
        orderBy: { created_at: 'desc' },
        include: {
          category: true,
          product_image: true,
          products_tags_tags: {
            include: {
              tags: true,
            },
          },
        },
      }),
      this.prisma.products.count({ where }),
    ]);

    const mapped = data.map((product) => ({
      ...product,
      tags: product.products_tags_tags.map((ptt) => ptt.tags),
    }));

    return {
      data: mapped,
      total,
      page,
      pageCount: Math.ceil(total / limit),
    };
  }

  async findBestSellers() {
    const data = await this.prisma.products.findMany({
      where: { is_best_seller: true, deleted_at: null, is_active: true },
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

    const mapped = data.map((product) => ({
      ...product,
      tags: product.products_tags_tags.map((ptt) => ptt.tags),
    }));

    return mapped;
  }

  async findByCategory(
    slug: string,
    search?: string,
    sort?: 'lowest' | 'highest',
  ) {
    const data = await this.prisma.products.findMany({
      where: {
        category: {
          link: slug,
        },
        is_active: true,
        //name: search ? { contains: search, mode: 'insensitive' } : undefined,
        OR: search
          ? [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                products_tags_tags: {
                  some: {
                    tags: {
                      name: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              },
            ]
          : undefined,
      },
      orderBy:
        sort === 'lowest'
          ? { price: 'asc' }
          : sort === 'highest'
            ? { price: 'desc' }
            : undefined,
      include: {
        product_image: true,
        products_tags_tags: {
          include: {
            tags: true,
          },
        },
      },
    });

    const mapped = data.map((product) => ({
      ...product,
      tags: product.products_tags_tags.map((ptt) => ptt.tags),
    }));

    return mapped;
  }

  async create(dto: CreateProductDto) {
    const { tags, variants, image_urls = [], ...productData } = dto;

    const tagUpserts =
      tags?.map((name) =>
        this.prisma.tags.upsert({
          where: { name },
          update: {},
          create: { name },
        }),
      ) || [];

    const createdTags = await this.prisma.$transaction(tagUpserts);

    const finalImages = image_urls.map((url, i) => ({
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

    const { variants, image_urls, tags, ...rest } = dto;

    const finalImages = image_urls!.map((img, i) => ({
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

    await this.prisma.products.update({
      where: { id },
      data: updateData,
    });

    await this.prisma.$transaction(
      finalImages.map((img) =>
        this.prisma.product_image.upsert({
          where: { id: img.id ?? 0 },
          update: img,
          create: img,
        }),
      ),
    );

    await this.prisma.products_tags_tags.deleteMany({
      where: { productsId: id },
    });

    if (tags && tags.length > 0) {
      const tagUpserts = tags.map((name) =>
        this.prisma.tags.upsert({
          where: { name },
          update: {},
          create: { name },
        }),
      );
      const createdTags = await this.prisma.$transaction(tagUpserts);

      await this.prisma.products_tags_tags.createMany({
        data: createdTags.map((tag) => ({
          productsId: id,
          tagsId: tag.id,
        })),
      });
    }

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
    }

    await this.prisma.product_image.delete({ where: { id } });

    return { message: 'Image removed successfully' };
  }
}
