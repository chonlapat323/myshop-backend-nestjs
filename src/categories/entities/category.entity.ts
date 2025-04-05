import { Product } from 'src/products/entities/product.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  image?: string; // สำหรับใช้แสดงรูป category บนหน้า UI

  @Column({ default: true })
  is_active: boolean;

  // ✅ ความสัมพันธ์กับสินค้า (1 category มีหลาย product)
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;
}
