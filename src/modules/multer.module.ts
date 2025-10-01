import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          let uploadPath = join(__dirname, '..', '..', 'uploads');

          if (req.originalUrl.startsWith('/users') && file.fieldname === 'avatar') {
            uploadPath = join(uploadPath, 'avatars');
          } else if (req.originalUrl.startsWith('/posts') && file.fieldname === 'media') {
            uploadPath = join(uploadPath, 'media');
          }

          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + '-' + file.originalname);
        },
      }),
    }),
  ],
  exports: [MulterModule],
})
export class MulterCustomModule {}
