// src/address/entities/address.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/users/user.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  full_name: string;

  @Column()
  address_line: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  zip_code: string;

  @Column()
  phone_number: string;

  @Column({ default: false })
  is_default: boolean;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
