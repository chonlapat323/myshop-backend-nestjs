// src/products/entities/variant.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from './product.entity';

@Entity('variants')
export class Variant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // เช่น "ดำ - ไซส์ M"

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price: number;

  @Column()
  stock: number;

  @Column({ nullable: true })
  imageUrl: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  product: Product;
}
