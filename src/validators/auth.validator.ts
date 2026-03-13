import { z } from 'zod'

//  Reusable field schemas
const emailSchema = z
  .string({ required_error: 'Email is required' })
  .email('Please provide a valid email')
  .toLowerCase()
  .trim()

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password cannot exceed 72 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

const fullNameSchema = z
  .string({ required_error: 'Full name is required' })
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name cannot exceed 100 characters')
  .trim()

//  Register (Admin signup — creates school + admin user)
export const registerSchema = z.object({
  body: z.object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    schoolName: z
      .string({ required_error: 'School name is required' })
      .min(2, 'School name must be at least 2 characters')
      .max(150)
      .trim(),
    schoolType: z.enum(['primary', 'secondary', 'college', 'other'], {
      required_error: 'School type is required',
    }),
    city: z.string().max(100).trim().optional(),
    country: z.string().max(100).trim().optional(),
  }),
})

//  Login 
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string({ required_error: 'Password is required' }),
  }),
})

//  Verify email OTP ─
export const verifyEmailSchema = z.object({
  body: z.object({
    email: emailSchema,
    otp: z
      .string({ required_error: 'OTP is required' })
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d+$/, 'OTP must contain only digits'),
  }),
})

//  Resend OTP ─
export const resendOtpSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
})

//  Forgot password 
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
})

// Reset password 
export const resetPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
    otp: z
      .string({ required_error: 'OTP is required' })
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d+$/, 'OTP must contain only digits'),
    newPassword: passwordSchema,
  }),
})

// Change password (authenticated)
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string({ required_error: 'Current password is required' }),
    newPassword: passwordSchema,
  }),
})

// Inferred types 
export type RegisterInput = z.infer<typeof registerSchema>['body']
export type LoginInput = z.infer<typeof loginSchema>['body']
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['body']
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body']
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body']