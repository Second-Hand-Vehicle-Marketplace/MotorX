import nodemailer from 'nodemailer';
import { env } from './env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}): Promise<boolean> {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('SMTP credentials are not configured; skipping email send.');
    return false;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });

    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('SMTP email send failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

export default transporter;
