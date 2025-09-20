import mongoose from 'mongoose';
import { uuidv7 } from 'uuidv7';

const clickSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String },
  source: { type: String },
  geolocation: {
    country: { type: String },
    region: { type: String },
    city: { type: String },
  },
});

const urlSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv7 },
  originalUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  clicks: [clickSchema],
});

export default mongoose.model('Url', urlSchema);