import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import * as bcrypt from 'bcrypt';
import { pick } from 'src/common/utils/clean-dto.util';
import { UserRole } from 'src/constants/user-role.enum';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findUsers({ role, page }: { role?: string; page: number }) {
    const take = 10;
    const skip = (page - 1) * take;

    const where: any = {};

    if (role) {
      const roleMap = {
        member: '3',
        admin: '1',
        supervisor: '2',
      };
      where.role_id = roleMap[role];
    }

    const [items, count] = await this.usersRepository.findAndCount({
      where,
      take,
      skip,
      order: { created_at: 'DESC' },
    });

    return {
      items,
      totalPages: Math.ceil(count / take),
    };
  }

  async findByEmail(email: string): Promise<User | undefined | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findUserById(id: string) {
    const member = await this.usersRepository.findOne({ where: { id } });

    if (!member) {
      throw new NotFoundException('ไม่พบผู้ใช้นี้ในระบบ');
    }

    // ✅ ตรวจสอบว่า role_id เป็น member (เช่น '3')
    if (member.role_id !== '3') {
      throw new NotFoundException('ผู้ใช้นี้ไม่ใช่สมาชิก');
    }

    return member;
  }

  async findByRoles(roleIds: string[]): Promise<User[]> {
    return this.usersRepository.find({
      where: roleIds.map((id) => ({ role_id: id })),
      order: { created_at: 'DESC' },
    });
  }

  async create(dto: CreateUserDto, avatarUrl?: string): Promise<User> {
    const exitsting = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (exitsting) {
      throw new ConflictException('Email นี้ถูกใช้งานแล้ว');
    }

    console.log(dto.password);
    const hashed = await bcrypt.hash(dto.password, 10);

    const userData = pick(dto, [
      'first_name',
      'last_name',
      'email',
      'phone_number',
      'note',
      'is_active',
    ]);
    const user = this.usersRepository.create({
      ...userData,
      hashed_password: hashed,
      avatar_url: avatarUrl,
      role_id: UserRole.MEMBER,
    });

    return await this.usersRepository.save(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, dto); // ✅ merge dto เข้า user
    return this.usersRepository.save(user);
  }

  async remove(id: string) {
    const admin = await this.usersRepository.findOne({ where: { id } });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    // ลบไฟล์ avatar ถ้ามี
    if (admin.avatar_url) {
      const filePath = path.join(
        __dirname,
        '..',
        '..',
        'public',
        'users',
        admin.avatar_url,
      );
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('❌ Failed to delete avatar:', err.message);
        } else {
          console.log('🗑️ Avatar deleted:', filePath);
        }
      });
    }

    await this.usersRepository.delete(id);
    return { message: 'Admin deleted successfully' };
  }
}
