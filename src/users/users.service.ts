import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | undefined | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByRoles(roleIds: string[]): Promise<User[]> {
    return this.usersRepository.find({
      where: roleIds.map((id) => ({ role_id: id })),
      order: { created_at: 'DESC' },
    });
  }
}
