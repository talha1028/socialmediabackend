import { Processor, Process } from '@nestjs/bull';
import { type Job } from 'bull';
import * as nodemailer from 'nodemailer';
@Processor('email-queue')
export class EmailProcessor {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, 
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });
  }

@Process('send-email')
async handleSendEmail(job: Job<{ to: string; subject: string; body: string }>) {
  const { to, subject, body } = job.data;
  await this.transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: body,
  });

  console.log(`✅ Email sent to ${to}`);
}

}
