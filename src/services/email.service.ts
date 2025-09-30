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

  async sendOtpEmail(to: string, username: string, otp: number) {
    const subject = '🔑 Verify Your Account';
    const body = `Hello ${username}, please use this OTP to verify your account: ${otp}`;
    await this.sendEmail(to, subject, body);
  }

  // 📩 Helper for notifications
  async sendNotificationEmail(to: string, subject: string, message: string) {
    await this.sendEmail(to, subject, message);
  }
}
