import { extname } from 'path';
import { Request } from 'express';

export function editFileName(
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
) {
  const name = file.originalname.split('.')[0].replace(/\s+/g, '-'); // ชื่อไฟล์ตัดนามสกุลและแทน space ด้วย '-'
  const fileExtName = extname(file.originalname); // เอาเฉพาะนามสกุลไฟล์
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join(''); // random 4 ตัว

  callback(null, `${name}-${Date.now()}-${randomName}${fileExtName}`);
}
