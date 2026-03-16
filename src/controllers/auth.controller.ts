import { Response } from 'express'
import { AuthRequest } from '../types'
import catchAsync from '../helpers/async.helper'
import { sendSuccess, sendCreated } from '../helpers/response.helper'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../helpers/jwt.helper'
import { setAuthCookies, clearAuthCookies } from '../helpers/cookie.helper'
import { generateOtp, hashOtp, verifyOtp, otpExpiresAt } from '../helpers/otp.helper'
import { sendOtpEmail, sendPasswordResetEmail } from '../services/email.service'
import { AppError } from '../middlewares/error.middleware'
import User from '../models/user.model'
import School from '../models/school.model'
import { HTTP_STATUS, OTP_EXPIRES_MINUTES, USER_ROLES, COOKIE_NAMES } from '../constants'
import * as authValidator from '../validators/auth.validator'

// Helper: build JWT payload and set cookies 
const issueTokens = (res: Response, user: InstanceType<typeof User>): { accessToken: string; refreshToken: string } => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    schoolId: user.schoolId.toString(),
  }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)
  setAuthCookies(res, accessToken, refreshToken)
  return { accessToken, refreshToken }
}

// POST /auth/register 
// Creates a school + admin user, then sends OTP
export const register = catchAsync(async (req, res) => {
  const { fullName, email, password, schoolName, schoolType, city, country } =
    req.body as authValidator.RegisterInput

  // Check email not already taken
  const existing = await User.findOne({ email })
  if (existing) {
    throw new AppError('An account with this email already exists', HTTP_STATUS.CONFLICT)
  }

  // Create school first
  const school = await School.create({ name: schoolName, type: schoolType, city, country })

  // Generate OTP before creating user
  const otp = generateOtp()
  const hashedOtp = await hashOtp(otp)

  // Create admin user tied to school
  const user = await User.create({
    fullName,
    email,
    password,
    role: USER_ROLES.ADMIN,
    schoolId: school._id,
    isEmailVerified: false,
    emailOtp: hashedOtp,
    emailOtpExpiresAt: otpExpiresAt(OTP_EXPIRES_MINUTES),
  })

  // Send OTP email (non-blocking — don't fail registration if email fails)
  sendOtpEmail(email, fullName, otp).catch((err) =>
    console.error('Failed to send OTP email:', err),
  )

  sendCreated(res, 'Account created. Please verify your email with the OTP sent.', {
    userId: user._id,
    email: user.email,
  })
})

// POST /auth/verify-email
export const verifyEmail = catchAsync(async (req, res) => {
  const { email, otp } = req.body as authValidator.VerifyEmailInput

  const user = await User.findOne({ email }).select(
    '+emailOtp +emailOtpExpiresAt',
  )

  if (!user) {
    throw new AppError('No account found with this email', HTTP_STATUS.NOT_FOUND)
  }

  if (user.isEmailVerified) {
    throw new AppError('Email is already verified', HTTP_STATUS.BAD_REQUEST)
  }

  if (!user.emailOtp || user.isOtpExpired('email')) {
    throw new AppError('OTP has expired. Please request a new one.', HTTP_STATUS.BAD_REQUEST)
  }

  const isValid = await verifyOtp(otp, user.emailOtp)
  if (!isValid) {
    throw new AppError('Invalid OTP', HTTP_STATUS.BAD_REQUEST)
  }

  // Mark verified and clear OTP fields
  user.isEmailVerified = true
  user.emailOtp = undefined
  user.emailOtpExpiresAt = undefined
  await user.save()

  // Issue tokens so user is logged in immediately after verification
  const { accessToken } = issueTokens(res, user)

  sendSuccess(res, 'Email verified successfully', {
    user,
    accessToken,
  })
})

// POST /auth/resend-otp
export const resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body

  const user = await User.findOne({ email }).select('+emailOtp +emailOtpExpiresAt')

  if (!user) {
    throw new AppError('No account found with this email', HTTP_STATUS.NOT_FOUND)
  }

  if (user.isEmailVerified) {
    throw new AppError('Email is already verified', HTTP_STATUS.BAD_REQUEST)
  }

  const otp = generateOtp()
  user.emailOtp = await hashOtp(otp)
  user.emailOtpExpiresAt = otpExpiresAt(OTP_EXPIRES_MINUTES)
  await user.save()

  sendOtpEmail(email, user.fullName, otp).catch((err) =>
    console.error('Failed to resend OTP email:', err),
  )

  sendSuccess(res, 'OTP resent successfully. Check your email.')
})

// POST /auth/login─
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body as authValidator.LoginInput

  // findByEmail static includes password field
  const user = await (User as any).findByEmail(email)

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED)
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact your administrator.', HTTP_STATUS.FORBIDDEN)
  }

  if (!user.isEmailVerified) {
    // Resend OTP silently
    const otp = generateOtp()
    user.emailOtp = await hashOtp(otp)
    user.emailOtpExpiresAt = otpExpiresAt(OTP_EXPIRES_MINUTES)
    await user.save()
    sendOtpEmail(email, user.fullName, otp).catch(console.error)

    throw new AppError(
      'Email not verified. A new OTP has been sent to your email.',
      HTTP_STATUS.UNAUTHORIZED,
    )
  }

  // Update last login timestamp
  user.lastLoginAt = new Date()
  await user.save()

  const { accessToken } = issueTokens(res, user)

  sendSuccess(res, 'Logged in successfully', { user, accessToken })
})

// POST /auth/logout
export const logout = catchAsync(async (_req, res) => {
  clearAuthCookies(res)
  sendSuccess(res, 'Logged out successfully')
})

// POST /auth/refresh ─
export const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN]

  if (!token) {
    throw new AppError('Refresh token not found', HTTP_STATUS.UNAUTHORIZED)
  }

  const payload = verifyRefreshToken(token)

  if (payload.type !== 'refresh') {
    throw new AppError('Invalid token type', HTTP_STATUS.UNAUTHORIZED)
  }

  const user = await User.findById(payload.id)
  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', HTTP_STATUS.UNAUTHORIZED)
  }

  const { accessToken } = issueTokens(res, user)
  sendSuccess(res, 'Token refreshed', { accessToken })
})

// POST /auth/forgot-password─
export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body

  const user = await User.findOne({ email })

  // Always return success to prevent email enumeration
  if (!user) {
    sendSuccess(res, 'If an account exists with this email, you will receive an OTP.')
    return
  }

  const otp = generateOtp()
  user.passwordResetOtp = await hashOtp(otp)
  user.passwordResetOtpExpiresAt = otpExpiresAt(OTP_EXPIRES_MINUTES)
  await user.save()

  sendPasswordResetEmail(email, user.fullName, otp).catch(console.error)

  sendSuccess(res, 'If an account exists with this email, you will receive an OTP.')
})

// POST /auth/reset-password
export const resetPassword = catchAsync(async (req, res) => {
  const { email, otp, newPassword } = req.body as authValidator.ResetPasswordInput

  const user = await User.findOne({ email }).select(
    '+passwordResetOtp +passwordResetOtpExpiresAt',
  )

  if (!user || !user.passwordResetOtp) {
    throw new AppError('Invalid or expired reset request', HTTP_STATUS.BAD_REQUEST)
  }

  if (user.isOtpExpired('passwordReset')) {
    throw new AppError('OTP has expired. Please request a new one.', HTTP_STATUS.BAD_REQUEST)
  }

  const isValid = await verifyOtp(otp, user.passwordResetOtp)
  if (!isValid) {
    throw new AppError('Invalid OTP', HTTP_STATUS.BAD_REQUEST)
  }

  // Update password — pre-save hook will hash it
  user.password = newPassword
  user.passwordResetOtp = undefined
  user.passwordResetOtpExpiresAt = undefined
  await user.save()

  clearAuthCookies(res)
  sendSuccess(res, 'Password reset successfully. Please log in with your new password.')
})

// PATCH /auth/change-password (authenticated)
export const changePassword = catchAsync(async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body as authValidator.ChangePasswordInput

  const user = await User.findById(req.user!.id).select('+password')
  if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND)

  const isMatch = await user.comparePassword(currentPassword)
  if (!isMatch) {
    throw new AppError('Current password is incorrect', HTTP_STATUS.BAD_REQUEST)
  }

  user.password = newPassword
  await user.save()

  clearAuthCookies(res)
  sendSuccess(res, 'Password changed successfully. Please log in again.')
})

// GET /auth/me (authenticated)─
export const getMe = catchAsync(async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.id).populate('schoolId', 'name type city')
  if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND)
  sendSuccess(res, 'User fetched successfully', { user })
})