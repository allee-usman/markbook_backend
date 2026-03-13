import { Response } from 'express'
import { ApiResponse, PaginatedResponse, PaginationMeta } from '../types'
import { HTTP_STATUS } from '../constants'

// Send a success response
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = HTTP_STATUS.OK,
): void => {
  const response: ApiResponse<T> = { success: true, message, data }
  res.status(statusCode).json(response)
}

// Send a created response 
export const sendCreated = <T>(res: Response, message: string, data?: T): void => {
  sendSuccess(res, message, data, HTTP_STATUS.CREATED)
}

// Send an error response
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors?: unknown,
): void => {
  const response: ApiResponse = { success: false, message, errors }
  res.status(statusCode).json(response)
}

// Send a paginated response 
export const sendPaginated = <T>(
  res: Response,
  message: string,
  items: T[],
  pagination: PaginationMeta,
): void => {
  const data: PaginatedResponse<T> = { items, pagination }
  sendSuccess(res, message, data)
}

// Build pagination meta from query params 
export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit)
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}