import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Slide } from './slide.entity';
@Entity('slide_images')
export class SlideImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column({ default: 0 })
  order_image: number;

  @ManyToOne(() => Slide, (slide) => slide.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'slide_id' })
  slide: Slide;

  @Column()
  slide_id: string;
}
