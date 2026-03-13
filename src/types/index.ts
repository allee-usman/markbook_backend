import { Request } from 'express'
import { Types } from 'mongoose'
import { UserRole } from '../constants'

// Authenticated request — extends Express Request with user payload
export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: UserRole
    schoolId: string
  }
}

// Generic API response shape
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  errors?: unknown
}

// Pagination meta
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

// JWT payload
export interface JwtPayload {
  id: string
  email: string
  role: UserRole
  schoolId: string
  type: 'access' | 'refresh'
}

// Mongoose ObjectId helper
export type MongoId = Types.ObjectId | string