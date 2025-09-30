// src/multer/multer-custom.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

function ensureDir(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, callback) => {
          let uploadPath = join(__dirname, '..', '..', 'uploads', 'others');

          // Decide folder based on endpoint + fieldname
          if (req.originalUrl.includes('/users') && file.fieldname === 'avatar') {
            uploadPath = join(__dirname, '..', '..', 'uploads', 'avatars');
          } else if (req.originalUrl.includes('/posts') && file.fieldname === 'media') {
            uploadPath = join(__dirname, '..', '..', 'uploads', 'media');
          }

          ensureDir(uploadPath);
          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB default limit
    }),
  ],
  exports: [MulterModule],
})
export class MulterCustomModule {}
