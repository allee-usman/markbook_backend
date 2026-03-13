//  HTTP Status Codes 
export const HTTP_STATUS = {
  OK: 200 as number,
  CREATED: 201 as number,
  NO_CONTENT: 204 as number,
  BAD_REQUEST: 400 as number,
  UNAUTHORIZED: 401 as number,
  FORBIDDEN: 403 as number,
  NOT_FOUND: 404 as number,
  CONFLICT: 409 as number,
  UNPROCESSABLE: 422 as number,
  TOO_MANY_REQUESTS: 429 as number,
  INTERNAL_SERVER_ERROR: 500 as number,
} as const

//  User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

//  Token Types 
export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  EMAIL_VERIFY: 'email_verify',
  PASSWORD_RESET: 'password_reset',
} as const

//  OTP 
export const OTP_LENGTH = 6
export const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_IN_MINUTES) || 10

//  Pagination defaults 
export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 100

//  Cookie names
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const

//  Task statuses
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  UNDER_REVIEW: 'under_review',
  COMPLETED: 'completed',
} as const

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS]

//  Attendance statuses
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
} as const

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS]