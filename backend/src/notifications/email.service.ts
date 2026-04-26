import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('smtp.host');
    if (!host) {
      this.logger.warn('SMTP_HOST is not configured. Email notifications will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: this.configService.get<number>('smtp.port') ?? 587,
      auth: {
        user: this.configService.get<string>('smtp.user'),
        pass: this.configService.get<string>('smtp.pass'),
      },
    });
  }

  async sendMail(to: string, subject: string, text: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Email not sent to ${to}: SMTP not configured`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('smtp.from') ?? 'noreply@healthcare.example.com',
        to,
        subject,
        text,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      // Do NOT rethrow — email failure should not break the main flow
    }
  }
}
