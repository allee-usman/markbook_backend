import mongoose from 'mongoose'
import config from './env.config'

// Connect to MongoDB
const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.db.uri, {
      // Recommended options for production stability
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    console.log(`MongoDB connected: ${conn.connection.host}`)

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected — retrying...')
    })

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected')
    })

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB error:', err)
    })
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(1) // Exit process on failed initial connection
  }
}

// Graceful shutdown
export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close()
  console.log('🔌  MongoDB disconnected gracefully')
}

export default connectDB