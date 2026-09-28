import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IServiceEnquiry extends Document {
  userId: mongoose.Types.ObjectId;
  interest: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceEnquirySchema: Schema<IServiceEnquiry> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    interest: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  {
    autoIndex: false,
    autoCreate: false,
    timestamps: false,
  }
);

const ServiceEnquiry: Model<IServiceEnquiry> =
  mongoose.models.ServiceEnquiry ||
  mongoose.model<IServiceEnquiry>('ServiceEnquiry', ServiceEnquirySchema, 'service_enquiries');

export default ServiceEnquiry;
