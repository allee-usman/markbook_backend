import mongoose, { Document, Schema, Model } from 'mongoose'
import bcrypt from 'bcryptjs'
import { USER_ROLES, UserRole } from '../constants'

// Interface: document fields 
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  schoolId: mongoose.Types.ObjectId
  fullName: string
  email: string
  password: string
  role: UserRole
  avatarUrl?: string
  isEmailVerified: boolean

  // OTP fields — stored hashed, cleared after use
  emailOtp?: string
  emailOtpExpiresAt?: Date
  passwordResetOtp?: string
  passwordResetOtpExpiresAt?: Date

  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date

  // Instance methods 
  comparePassword(candidatePassword: string): Promise<boolean>
  isOtpExpired(type: 'email' | 'passwordReset'): boolean
}

// Interface: static/model methods
interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>
}

// Schema
const userSchema = new Schema<IUser>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School ID is required'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.TEACHER,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // OTP fields — hashed before save
    emailOtp: { type: String, select: false },
    emailOtpExpiresAt: { type: Date, select: false },
    passwordResetOtp: { type: String, select: false },
    passwordResetOtpExpiresAt: { type: Date, select: false },

    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // auto createdAt + updatedAt
    toJSON: {
      // Remove sensitive fields from JSON output
      transform: (_doc, ret) => {
        delete ret.password
        delete ret.emailOtp
        delete ret.emailOtpExpiresAt
        delete ret.passwordResetOtp
        delete ret.passwordResetOtpExpiresAt
        delete ret.__v
        return ret
      },
    },
  },
)

// Indexes─
userSchema.index({ schoolId: 1, role: 1 })
userSchema.index({ email: 1 })

// Pre-save middleware: hash password if modified 
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Instance method: compare plain password against hash 
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

// Instance method: check if an OTP has expired 
userSchema.methods.isOtpExpired = function (
  type: 'email' | 'passwordReset',
): boolean {
  const expiresAt =
    type === 'email' ? this.emailOtpExpiresAt : this.passwordResetOtpExpiresAt
  if (!expiresAt) return true
  return new Date() > expiresAt
}

// Static method: find user by email (includes password for auth)
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() }).select('+password')
}

const User = mongoose.model<IUser, IUserModel>('User', userSchema)

export default User