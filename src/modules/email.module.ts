// email.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailService } from '../services/email.service'
import { EmailProcessor } from '../processors/email.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-queue',       // queue name
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
