import nodemailer, { Transporter } from 'nodemailer'
import config from '../config/env.config'

// Create reusable transporter 
const createTransporter = (): Transporter => {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  })
}

// Generic send email
const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  const transporter = createTransporter()
  await transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
  })
}

// Send OTP verification email 
export const sendOtpEmail = async (
  to: string,
  name: string,
  otp: string,
): Promise<void> => {
  const subject = 'Verify your EduDesk account'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">Welcome to EduDesk, ${name}!</h2>
      <p style="color: #374151;">Use the OTP below to verify your email address. It expires in <strong>${config.otp.expiresMinutes} minutes</strong>.</p>
      <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #7c3aed;">${otp}</span>
      </div>
      <p style="color: #6b7280; font-size: 13px;">If you didn't create an EduDesk account, you can safely ignore this email.</p>
    </div>
  `
  await sendEmail(to, subject, html)
}

// Send password reset OTP email 
export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  otp: string,
): Promise<void> => {
  const subject = 'Reset your EduDesk password'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">Password Reset Request</h2>
      <p style="color: #374151;">Hi ${name}, use the OTP below to reset your password. It expires in <strong>${config.otp.expiresMinutes} minutes</strong>.</p>
      <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #7c3aed;">${otp}</span>
      </div>
      <p style="color: #6b7280; font-size: 13px;">If you didn't request a password reset, please ignore this email.</p>
    </div>
  `
  await sendEmail(to, subject, html)
}