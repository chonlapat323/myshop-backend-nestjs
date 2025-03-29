import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const editFileName = (
  _req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
) => {
  const fileExtName = extname(file.originalname);
  const randomName = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  callback(null, `${randomName}${fileExtName}`);
};

export const imageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};
