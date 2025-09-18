// email.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { type Queue } from 'bull';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('email-queue') private emailQueue: Queue) {}

  async sendEmail(to: string, subject: string, body: string) {
    await this.emailQueue.add('send-email', { to, subject, body });
  }
}
