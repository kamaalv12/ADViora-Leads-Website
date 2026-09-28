import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUtmCampaign extends Document {
  userId: mongoose.Types.ObjectId;
  route?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  platform?: string;
  gclid?: string;
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  matchtype?: string;
  network?: string;
  device?: string;
  keyword?: string;
  placement?: string;
  campaignid?: string;
  adgroupid?: string;
  clientIp?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UtmCampaignSchema: Schema<IUtmCampaign> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    route: { type: String, trim: true },
    utm_source: { type: String, trim: true },
    utm_medium: { type: String, trim: true },
    utm_campaign: { type: String, trim: true },
    utm_content: { type: String, trim: true },
    utm_term: { type: String, trim: true },
    platform: { type: String, trim: true },
    gclid: { type: String, trim: true },
    fbclid: { type: String, trim: true },
    fbp: { type: String, trim: true },
    fbc: { type: String, trim: true },
    matchtype: { type: String, trim: true },
    network: { type: String, trim: true },
    device: { type: String, trim: true },
    keyword: { type: String, trim: true },
    placement: { type: String, trim: true },
    campaignid: { type: String, trim: true },
    adgroupid: { type: String, trim: true },
    clientIp: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  {
    autoIndex: false,
    autoCreate: false,
    timestamps: false,
  }
);

const UtmCampaign: Model<IUtmCampaign> =
  mongoose.models.UtmCampaign ||
  mongoose.model<IUtmCampaign>('UtmCampaign', UtmCampaignSchema, 'utm_campaigns');

export default UtmCampaign;
