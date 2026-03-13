import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import config from './config/env.config'
import routes from './routes'
import errorHandler from './middlewares/error.middleware'
import { HTTP_STATUS } from './constants'

const app: Application = express()

// Security headers 
app.use(helmet())

// CORS — allow only the frontend origin 
app.use(
  cors({
    origin: config.client.url,
    credentials: true, // required for cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

// Rate limiting — global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
})

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
})

app.use(globalLimiter)
app.use('/api/v1/auth', authLimiter)

// Request logging (dev only)
if (config.server.isDev) {
  app.use(morgan('dev'))
}

// Body parsers
app.use(express.json({ limit: '10kb' })) // guard against large payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// Cookie parser
app.use(cookieParser(config.cookie.secret))

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Markbook API is running',
    environment: config.server.nodeEnv,
    timestamp: new Date().toISOString(),
  })
})

// API routes
app.use('/api/v1', routes)

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
  })
})

// Global error handler
app.use(errorHandler)

export default app