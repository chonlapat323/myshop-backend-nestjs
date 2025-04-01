// src/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Variant } from './entities/variant.entity';
import { Tag } from './entities/tag.entity';
import { CreateProductDto } from './dto/create-product.dto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  findAll() {
    return this.productRepo.find({ relations: ['variants', 'tags'] });
  }

  findOne(id: number) {
    return this.productRepo.findOne({
      where: { id },
      relations: ['variants', 'tags'],
    });
  }

  async findPaginated(limit: number, skip: number) {
    const [data, total] = await this.productRepo.findAndCount({
      relations: ['tags', 'variants'],
      take: limit,
      skip: skip,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page: skip / limit + 1,
      pageCount: Math.ceil(total / limit),
    };
  }

  async create(dto: CreateProductDto) {
    const { tags, variants, imageUrl, ...productData } = dto;

    // ✅ เตรียม tagEntities
    const tagEntities: Tag[] = [];

    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        let tag = await this.productRepo.manager.findOne(Tag, {
          where: { name: tagName },
        });

        if (!tag) {
          tag = this.productRepo.manager.create(Tag, { name: tagName });
          await this.productRepo.manager.save(tag);
        }

        tagEntities.push(tag);
      }
    }

    // ✅ เตรียม variantEntities
    const variantEntities: Variant[] = [];
    if (variants && variants.length > 0) {
      for (const variant of variants) {
        variantEntities.push(this.productRepo.manager.create(Variant, variant));
      }
    }

    // ✅ จัดการ imageUrl (ย้ายไฟล์ถ้าจำเป็น)
    let finalImageUrl = imageUrl;
    if (imageUrl?.startsWith('/temp-uploads/')) {
      const filename = imageUrl.split('/').pop();
      if (!filename) throw new Error('Invalid imageUrl');

      const tempPath = path.join(
        __dirname,
        '..',
        '..',
        'temp-uploads',
        filename,
      );
      const finalPath = path.join(__dirname, '..', '..', 'uploads', filename);

      if (fs.existsSync(tempPath)) {
        fs.renameSync(tempPath, finalPath);
        finalImageUrl = `/uploads/${filename}`;
      }
    }

    // ✅ สร้าง Product entity
    const product = this.productRepo.create({
      ...productData,
      imageUrl: finalImageUrl,
      tags: tagEntities, // ✅ now Tag[]
      variants: variantEntities, // ✅ now Variant[]
    });

    return this.productRepo.save(product);
  }

  async update(id: number, data: Partial<Product>) {
    await this.productRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return this.productRepo.remove(product);
  }
}
