import { OrderItem } from 'src/order-item/entities/order-item.entity';
import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  order_number: string;

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column({ type: 'numeric' })
  subtotal_price: number;

  @Column({ type: 'numeric', default: 0 })
  discount_value: number;

  @Column({ nullable: true })
  coupon_code: string;

  @Column({ type: 'numeric', default: 0 })
  shipping_cost: number;

  @Column()
  total_price: number;

  @Column()
  payment_method: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';

  // Shipping Info
  @Column()
  shipping_full_name: string;

  @Column()
  shipping_address_line1: string;

  @Column({ nullable: true })
  shipping_address_line2: string;

  @Column()
  shipping_city: string;

  @Column()
  shipping_zip: string;

  @Column()
  shipping_country: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
