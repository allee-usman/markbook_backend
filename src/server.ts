// Load env config first before anything else 
import './config/env.config'

import http from 'http'
import app from './app'
import connectDB, { disconnectDB } from './config/db.config'
import config from './config/env.config'

const PORT = config.server.port

// Create HTTP server 
const server = http.createServer(app)

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB before accepting requests
    await connectDB()

    server.listen(PORT, () => {
      console.log(`\nMarkbook API is up & running in ${config.server.nodeEnv} mode`)
      console.log(`Server:   http://localhost:${PORT}`)
      console.log(`Health:   http://localhost:${PORT}/health`)
      console.log(`API base: http://localhost:${PORT}/api/v1\n`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
const shutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} received — shutting down gracefully...`)

  server.close(async () => {
    console.log('HTTP server closed')
    await disconnectDB()
    console.log('Goodbye!\n')
    process.exit(0)
  })

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('❌  Graceful shutdown timed out — forcing exit')
    process.exit(1)
  }, 10_000)
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌  Unhandled Rejection:', reason)
  server.close(() => process.exit(1))
})

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('❌  Uncaught Exception:', error)
  process.exit(1)
})

// OS signals for graceful shutdown
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Boot
startServer()