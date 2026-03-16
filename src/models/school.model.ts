import mongoose, { Document, Schema } from 'mongoose'

// Interface
export interface ISchool extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  type: 'primary' | 'secondary' | 'college' | 'other'
  city?: string
  country?: string
  logoUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Schema 
const schoolSchema = new Schema<ISchool>(
  {
    name: {
      type: String,
      required: [true, 'School name is required'],
      trim: true,
      minlength: [2, 'School name must be at least 2 characters'],
      maxlength: [150, 'School name cannot exceed 150 characters'],
    },
    type: {
      type: String,
      enum: ['primary', 'secondary', 'college', 'other'],
      required: [true, 'School type is required'],
    },
    city: {
      type: String,
      trim: true,
      default: null,
    },
    country: {
      type: String,
      trim: true,
      default: null,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        return ret
      },
    },
  },
)

const School = mongoose.model<ISchool>('School', schoolSchema)

export default School