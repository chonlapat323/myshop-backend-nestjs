import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SlideImage } from './slide-image.entity';
import { IsBoolean } from 'class-validator';

@Entity('slides')
export class Slide {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => SlideImage, (image) => image.slide, {
    cascade: true,
    eager: true,
  })
  images: SlideImage[];

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  create_at: Date;

  @UpdateDateColumn()
  update_at: Date;

  @IsBoolean()
  @Column({ type: 'boolean', default: false })
  is_default: boolean;
}
