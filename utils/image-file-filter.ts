import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

export function imageFileFilter(
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  const ext = extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return callback(
      new BadRequestException(`Unsupported file type: ${ext}`) as any,
      false,
    );
  }

  callback(null, true);
}
