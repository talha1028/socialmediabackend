import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, callback) => {
          // Decide folder based on fieldname
          let uploadPath = join(__dirname, '..', '..', 'uploads', 'others');

          if (file.fieldname === 'avatar') {
            uploadPath = join(__dirname, '..', '..', 'uploads', 'avatars');
          } else if (file.fieldname === 'media') {
            uploadPath = join(__dirname, '..', '..', 'uploads', 'media');
          }

          // Ensure folder exists
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }

          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  ],
  exports: [MulterModule],
})
export class MulterCustomModule {}
