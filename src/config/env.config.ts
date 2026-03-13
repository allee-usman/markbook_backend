import dotenv from 'dotenv'
import path from 'path'

// Load .env file from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Validate required env vars at startup
const required = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
]

required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`)
    process.exit(1)
  }
})

// Typed config object
const config = {
  server: {
    port: Number(process.env.PORT) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
  },
  db: {
    uri: process.env.MONGO_URI as string,
  },
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  cookie: {
    secret: process.env.COOKIE_SECRET || 'cookie_secret',
  },
  email: {
    host: process.env.SMTP_HOST as string,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER as string,
    pass: process.env.SMTP_PASS as string,
    from: process.env.EMAIL_FROM || 'EduDesk <noreply@edudesk.app>',
  },
  otp: {
    expiresMinutes: Number(process.env.OTP_EXPIRES_IN_MINUTES) || 10,
  },
  client: {
    url: process.env.CLIENT_URL || 'http://localhost:5173',
  },
} as const

export default config