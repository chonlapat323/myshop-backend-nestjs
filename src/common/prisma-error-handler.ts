import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
): void {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const target = (error.meta?.target as string[])?.[0];

    switch (error.code) {
      case 'P2002':
        if (target === 'email') {
          throw new ConflictException('Email is already in use');
        }
        if (target === 'phone_number') {
          throw new ConflictException('Phone number is already in use');
        }
        if (target.includes('name')) {
          throw new ConflictException('Category name already exists.');
        }
        if (target.includes('link')) {
          throw new ConflictException('Category link already exists.');
        }
        throw new ConflictException('Duplicate data detected');

      case 'P2025':
        throw new NotFoundException('Record not found');

      case 'P2003':
        throw new BadRequestException(
          'Invalid reference or foreign key constraint failed',
        );

      case 'P2000':
        throw new BadRequestException('Value too long for field');

      default:
        throw new InternalServerErrorException('Unexpected database error');
    }
  }

  throw error;
}
