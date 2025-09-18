// email.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { type Job } from 'bull';
import * as nodemailer from 'nodemailer';

@Processor('email-queue')
export class EmailProcessor {
  @Process('send-email')
  async handleSendEmail(job: Job) {
    const { to, subject, body } = job.data;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@socialapp.com',
      to,
      subject,
      html: body,
    });

    console.log(`Email sent to ${to}`);
  }
}
