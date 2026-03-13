import { Response } from 'express'
import config from '../config/env.config'
import { COOKIE_NAMES } from '../constants'

// Cookie options factory 
const cookieOptions = (maxAgeMs: number): object => ({
  httpOnly: true,  // not accessible via JS
  secure: config.server.isProd, // HTTPS only in production
  sameSite: config.server.isProd ? 'strict' : 'lax',
  maxAge: maxAgeMs,
})

// Attach access + refresh tokens as HttpOnly cookies 
export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
): void => {
  res.cookie(
    COOKIE_NAMES.ACCESS_TOKEN,
    accessToken,
    cookieOptions(7 * 24 * 60 * 60 * 1000),    // 7 days
  )
  res.cookie(
    COOKIE_NAMES.REFRESH_TOKEN,
    refreshToken,
    cookieOptions(30 * 24 * 60 * 60 * 1000),   // 30 days
  )
}

// Clear auth cookies on logout─
export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN)
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN)
}