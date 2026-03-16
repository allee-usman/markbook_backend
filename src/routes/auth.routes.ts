import { Router } from 'express'
import * as authController from '../controllers/auth.controller'
import validate from '../middlewares/validate.middleware'
import { authenticate } from '../middlewares/auth.middleware'
import * as authValidator from '../validators/auth.validator'

const router = Router()

// Public routes
router.post('/register', validate(authValidator.registerSchema), authController.register)
router.post('/login', validate(authValidator.loginSchema), authController.login)
router.post('/verify-email', validate(authValidator.verifyEmailSchema), authController.verifyEmail)
router.post('/resend-otp', validate(authValidator.resendOtpSchema), authController.resendOtp)
router.post('/forgot-password', validate(authValidator.forgotPasswordSchema), authController.forgotPassword)
router.post('/reset-password', validate(authValidator.resetPasswordSchema), authController.resetPassword)
router.post('/refresh', authController.refreshToken)

// Protected routes
router.use(authenticate)
router.post('/logout', authController.logout)
router.get('/me', authController.getMe)
router.patch('/change-password', validate(authValidator.changePasswordSchema), authController.changePassword)

export default router