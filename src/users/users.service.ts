import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './create-user-dto';
import * as bcrypt from 'bcrypt';
import { pick } from 'src/common/utils/clean-dto.util';
import { UserRole } from 'src/constants/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | undefined | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findMemberById(id: string) {
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

  async create(dto: CreateUserDto, avatarUrl?: string): Promise<User> {
    const exitsting = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (exitsting) {
      throw new ConflictException('Email นี้ถูกใช้งานแล้ว');
    }

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

  async findByRoles(roleIds: string[]): Promise<User[]> {
    return this.usersRepository.find({
      where: roleIds.map((id) => ({ role_id: id })),
      order: { created_at: 'DESC' },
    });
  }
}
