import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
    shopName: { type: String, trim: true },
    shopAddress: { type: String, trim: true },
    shopType: { type: String, enum: ['Small', 'Medium', 'Large'], default: 'Small' },
    district: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);