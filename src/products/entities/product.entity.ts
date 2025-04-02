// src/products/entities/product.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Variant } from './variant.entity';
import { Tag } from './tag.entity';
import { ProductImage } from './product-image.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  discountPrice: number;

  @Column()
  stock: number;

  @Column()
  sku: string;

  @Column()
  brand: string;

  @OneToMany(() => Variant, (variant) => variant.product, { cascade: true })
  variants: Variant[];

  @ManyToMany(() => Tag, (tag) => tag.products, { cascade: true })
  @JoinTable() // จำเป็นสำหรับฝั่ง owner ของ ManyToMany
  tags: Tag[];

  @Column({ default: 0 })
  soldCount: number;

  // เพิ่มใน Product entity
  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
    eager: true,
  })
  images: ProductImage[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
