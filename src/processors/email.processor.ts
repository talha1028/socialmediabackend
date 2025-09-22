import { Processor, Process } from '@nestjs/bull';
import { type Job } from 'bull';
import * as nodemailer from 'nodemailer';

@Processor('email-queue')
export class EmailProcessor {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  @Process('send-email')
  async handleSendEmail(job: Job) {
    console.log('sending email (email processor)')
    const { to, username } = job.data; // accept "to" and "username" in job

    const subject = '🎉 Welcome Aboard to Our App!';
    const body = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Hello ${username || 'there'}, 👋</h2>
        <p>Welcome aboard to <b>Our App</b>! 🚀</p>
        <p>We’re excited to have you join our community. Here’s to new connections, fun, and endless opportunities!</p>
        <br/>
        <p>Cheers,</p>
        <p><b>The Social App Team</b></p>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.EMAIL_USER || '"Social App" <no-reply@socialapp.com>',
      to,
      subject,
      html: body,
    });

    console.log(`✅ Welcome email sent to ${to}`);
  }
}
