import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  timezone: string;
  status: 'ACTIVE' | 'DELETED' | 'ONHOLD';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    countryCode: { type: String, default: '+91', trim: true },
    timezone: { type: String, default: 'Asia/Kolkata', trim: true },
    status: { type: String, enum: ['ACTIVE', 'DELETED', 'ONHOLD'], default: 'ACTIVE' },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  {
    autoIndex: false,
    autoCreate: false,
    timestamps: false,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema, 'users');

export default User;
