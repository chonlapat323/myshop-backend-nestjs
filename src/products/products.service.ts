// src/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Variant } from './entities/variant.entity';
import { Tag } from './entities/tag.entity';
import {
  CreateProductDto,
  ImageUrlDto,
  UpdateProductDto,
} from './dto/create-product.dto';
import * as path from 'path';
import * as fs from 'fs';
import { ProductImage } from './entities/product-image.entity';
// product.service.ts
import { In } from 'typeorm';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepo: Repository<ProductImage>,
  ) {}

  findAll() {
    return this.productRepo.find({ relations: ['tags', 'variants', 'images'] });
  }

  findOne(id: number) {
    return this.productRepo.findOne({
      where: { id },
      relations: ['tags', 'variants', 'images'],
    });
  }

  async findPaginated(limit: number, skip: number) {
    const [data, total] = await this.productRepo.findAndCount({
      relations: ['tags', 'variants', 'images'],
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
    const { tags, variants, imageUrls = [], ...productData } = dto;
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

    // ✅ เตรียม imageEntities
    const imageEntities: ProductImage[] = [];
    // 🔍 ย้ายไฟล์จาก temp → uploads และเปลี่ยน path ให้ถูกต้อง
    for (const [index, url] of imageUrls.entries()) {
      let finalUrl = url.url;

      if (url.url.startsWith('/temp-uploads/')) {
        const filename = url.url.split('/').pop();
        if (!filename) continue;

        const tempPath = path.join(
          __dirname,
          '..',
          '..',
          'temp-uploads',
          filename,
        );
        const finalPath = path.join(
          __dirname,
          '..',
          '..',
          'uploads',
          'products',
          filename,
        );

        if (fs.existsSync(tempPath)) {
          fs.renameSync(tempPath, finalPath);
          finalUrl = `/uploads/products/${filename}`; // ✅ ต้องใช้ path นี้เท่านั้น
        }
      }

      const image = this.productRepo.manager.create(ProductImage, {
        url: finalUrl, // ✅ เก็บ path ที่ถูกต้อง
        is_main: index === 0,
        order_image: index, // ✅ เพิ่มตรงนี้
      });
      imageEntities.push(image);
    }

    // ✅ สร้าง Product entity
    const product = this.productRepo.create({
      ...productData,
      images: imageEntities,
      tags: tagEntities,
      variants: variantEntities,
    });

    return this.productRepo.save(product);
  }

  async update(id: number, dto: UpdateProductDto) {
    // 🔸 แยก field ที่ไม่ต้องการให้เข้า repo
    const { variants, imageUrls, tags, ...rest } = dto;

    // ✅ update ส่วนหลักก่อน
    await this.productRepo.update(id, {
      ...rest,
      // ถ้าต้องแปลง tags string เป็น array → ทำที่นี่
    });
    if (imageUrls) {
      await this.syncImages(id, imageUrls);
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['images'], // ✅ ต้องดึงรูปมาด้วย
    });

    if (!product) throw new NotFoundException('Product not found');

    // ✅ ลบรูปจาก filesystem
    for (const img of product.images) {
      const filename = img.url.split('/').pop(); // /uploads/xxxx.jpg → xxxx.jpg
      const filePath = path.join(
        __dirname,
        '..',
        '..',
        'uploads',
        'products',
        filename!,
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // ✅ ลบจาก DB
    return await this.productRepo.remove(product);
  }

  async removeImage(id: number) {
    const image = await this.productRepo.manager.findOne(ProductImage, {
      where: { id },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }
    const productId = image.productId;
    const wasMain = image.is_main;
    const filename = image.url.split('/').pop();
    const imagePath = path.join(
      __dirname,
      '..',
      '..',
      'uploads',
      'products',
      filename!,
    );
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    } else {
      console.log('error path');
    }
    await this.productRepo.manager.remove(ProductImage, image);
    const result: any = {
      success: true,
      message: 'Image removed successfully',
      newMainImage: null,
    };

    if (wasMain) {
      const remainingImages = await this.productImageRepo.find({
        where: { productId },
        order: { order_image: 'ASC' },
      });
      for (let i = 0; i < remainingImages.length; i++) {
        remainingImages[i].order_image = i;
      }
      if (remainingImages.length > 0) {
        remainingImages[0].is_main = true;

        await this.productImageRepo.save(remainingImages[0]);
        // result.newMainImage = promoted;
      }
    }

    return result;
  }

  async syncImages(productId: number, imageUrls: ImageUrlDto[]) {
    const existingImages = await this.productImageRepo.find({
      where: { productId },
    });

    const existingMap = new Map(existingImages.map((img) => [img.url, img]));

    const incomingUrls = imageUrls.map((img) => img.url);

    // 🔥 ลบรูปที่ไม่มีในรายการใหม่
    const toDelete = existingImages.filter(
      (img) => !incomingUrls.includes(img.url),
    );
    if (toDelete.length > 0) {
      await this.productImageRepo.delete({
        id: In(toDelete.map((img) => img.id)),
      });
    }

    // ➕ เพิ่ม/อัปเดตรูปใหม่ + อัปเดตลำดับและ main
    const imagesToSave: ProductImage[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const { url } = imageUrls[i];
      const existing = existingMap.get(url);
      if (existing) {
        existing.order_image = i;
        existing.is_main = i === 0;
        imagesToSave.push(existing);
      } else {
        imagesToSave.push(
          this.productImageRepo.create({
            url,
            productId,
            order_image: i,
            is_main: i === 0,
          }),
        );
      }
    }

    await this.productImageRepo.save(imagesToSave);
  }
}
