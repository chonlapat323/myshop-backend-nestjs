// src/admins/entities/admin.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true, nullable: true }) // ✅ เพิ่ม nullable
  email: string;

  @Column({ nullable: true }) // ✅ เพิ่ม nullable
  hashed_password: string;

  @Column()
  avatar_url: string;

  @Column()
  role_id: number;
}
