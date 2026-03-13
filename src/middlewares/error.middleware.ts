import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { sendError } from '../helpers/response.helper'
import { HTTP_STATUS } from '../constants'
import config from '../config/env.config'

// Custom App Error class 
export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true // distinguish from unexpected errors
    Error.captureStackTrace(this, this.constructor)
  }
}

// Global error handler middleware 
const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Default error
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR
  let message = 'Something went wrong. Please try again later.'

  // Operational / known errors
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  }

  // Mongoose validation error─
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = HTTP_STATUS.BAD_REQUEST
    message = Object.values(err.errors).map((e) => e.message).join(', ')
  }

  // Mongoose duplicate key error 
  else if ((err as NodeJS.ErrnoException).code === '11000') {
    statusCode = HTTP_STATUS.CONFLICT
    const field = Object.keys((err as any).keyValue || {})[0] || 'field'
    message = `${field} already exists`
  }

  // Mongoose cast error (invalid ObjectId)─
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = HTTP_STATUS.BAD_REQUEST
    message = `Invalid ${err.path}: ${err.value}`
  }

  // JWT errors
  else if (err instanceof TokenExpiredError) {
    statusCode = HTTP_STATUS.UNAUTHORIZED
    message = 'Token has expired, please log in again'
  } else if (err instanceof JsonWebTokenError) {
    statusCode = HTTP_STATUS.UNAUTHORIZED
    message = 'Invalid token'
  }

  // Log unexpected errors in development
  if (config.server.isDev && !(err instanceof AppError)) {
    console.error('Unexpected error:', err)
  }

  sendError(res, message, statusCode)
}

export default errorHandler