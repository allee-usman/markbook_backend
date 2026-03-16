import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { OTP_LENGTH } from '../constants'

// Generate a numeric OTP of configurable length 
export const generateOtp = (): string => {
  const max = Math.pow(10, OTP_LENGTH)
  const min = Math.pow(10, OTP_LENGTH - 1)
  return String(crypto.randomInt(min, max))
}

// Hash OTP before storing in DB (never store plain OTP) 
export const hashOtp = async (otp: string): Promise<string> => {
  return bcrypt.hash(otp, 10)
}

// Compare plain OTP against stored hash 
export const verifyOtp = async (plain: string, hashed: string): Promise<boolean> => {
  return bcrypt.compare(plain, hashed)
}

// Calculate OTP expiry date 
export const otpExpiresAt = (minutes: number): Date => {
  return new Date(Date.now() + minutes * 60 * 1000)
}