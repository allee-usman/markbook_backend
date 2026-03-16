import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'
import { verifyAccessToken } from '../helpers/jwt.helper'
import { sendError } from '../helpers/response.helper'
import { HTTP_STATUS, COOKIE_NAMES, UserRole } from '../constants'

// ── Authenticate — verify JWT from cookie or Authorization header ──────────────
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    // Support both cookie-based and Bearer token auth
    let token: string | undefined =
      req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN]

    if (!token) {
      const authHeader = req.headers.authorization
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1]
      }
    }

    if (!token) {
      sendError(res, 'Authentication required', HTTP_STATUS.UNAUTHORIZED)
      return
    }

    const payload = verifyAccessToken(token)

    if (payload.type !== 'access') {
      sendError(res, 'Invalid token type', HTTP_STATUS.UNAUTHORIZED)
      return
    }

    // Attach decoded user to request for downstream use
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      schoolId: payload.schoolId,
    }

    next()
  } catch {
    sendError(res, 'Invalid or expired token', HTTP_STATUS.UNAUTHORIZED)
  }
}

// ── Authorize — restrict access to specific roles ─────────────────────────────
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', HTTP_STATUS.UNAUTHORIZED)
      return
    }

    if (!roles.includes(req.user.role)) {
      sendError(
        res,
        'You do not have permission to perform this action',
        HTTP_STATUS.FORBIDDEN,
      )
      return
    }

    next()
  }
}