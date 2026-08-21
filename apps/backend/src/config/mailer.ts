import nodemailer from 'nodemailer';
import { env } from './env.js';

// One shared SMTP transport (Gmail app-password compatible) reused for every outbound email.
export const mailer = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

export const mailerConfig = {
  from: env.SMTP_FROM ?? env.SMTP_USER,
} as const;
