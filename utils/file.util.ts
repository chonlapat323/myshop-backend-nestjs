import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';

export function generateTempFilename(originalName: string) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = extname(originalName);
  return `temp-${uniqueSuffix}${ext}`;
}

export function moveTempProductImage(originalUrl: string): string {
  if (!originalUrl.startsWith('/uploads/temp-uploads/')) return originalUrl;

  const filename = originalUrl.split('/').pop();
  if (!filename) return originalUrl;

  const tempPath = path.join(
    process.cwd(),
    'public',
    'uploads',
    'temp-uploads',
    filename,
  );
  const finalPath = path.join(
    process.cwd(),
    'public',
    'uploads',
    'products',
    filename,
  );
  const slidesDir = path.join(process.cwd(), 'public', 'uploads', 'products');
  if (fs.existsSync(tempPath)) {
    if (!fs.existsSync(slidesDir)) {
      fs.mkdirSync(slidesDir, { recursive: true });
    }
    fs.renameSync(tempPath, finalPath);
    return `/uploads/products/${filename}`;
  }

  return originalUrl;
}

export function moveTempSlideImage(originalUrl: string): string {
  if (!originalUrl.startsWith('/uploads/temp-uploads/')) return originalUrl;

  const filename = originalUrl.split('/').pop();
  if (!filename) return originalUrl;

  const tempPath = path.join(
    process.cwd(),
    'public',
    'uploads',
    'temp-uploads',
    filename,
  );
  const finalPath = path.join(
    process.cwd(),
    'public',
    'uploads',
    'slides',
    filename,
  );
  const slidesDir = path.join(process.cwd(), 'public', 'uploads', 'slides');

  if (fs.existsSync(tempPath)) {
    if (!fs.existsSync(slidesDir)) {
      fs.mkdirSync(slidesDir, { recursive: true });
    }
    fs.renameSync(tempPath, finalPath);
    return `/uploads/slides/${filename}`;
  }

  return originalUrl;
}

export function deleteFile(relativePath: string) {
  const filePath = path.join(process.cwd(), 'public', relativePath);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('❌ Failed to delete file:', err.message);
    }
  });
}
