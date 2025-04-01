// src/tasks/cleanup.service.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CleanupService {
  private tempDir = path.join(__dirname, '..', '..', 'temp-uploads');

  @Cron('0 */30 * * * *') // ทุก 30 นาที
  handleTempCleanup() {
    const files = fs.readdirSync(this.tempDir);
    const now = Date.now();

    files.forEach((file) => {
      const filePath = path.join(this.tempDir, file);
      const stats = fs.statSync(filePath);
      const ageInMinutes = (now - stats.ctimeMs) / 1000 / 60;

      if (ageInMinutes > 60) {
        fs.unlinkSync(filePath);
        console.log(`🧹 Deleted temp file: ${file}`);
      }
    });
  }
}
