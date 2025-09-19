import mongoose, { Document, Schema } from 'mongoose';
import { SharedSettings, ScreenshotSettings, TimeTrackingSettings } from '../types';

export interface SharedSettingsDocument extends Omit<SharedSettings, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const ScreenshotSettingsSchema = new Schema<ScreenshotSettings>({
  screenshotEnabled: { type: Boolean, default: true },
  interval: { type: Number, default: 300000, min: 60000 }, // 5 minutes default
  quality: { type: Number, default: 80, min: 10, max: 100 },
  maxSize: { type: String, default: '1920x1080' }
}, { _id: false });

const TimeTrackingSettingsSchema = new Schema<TimeTrackingSettings>({
  allowManualTimeEntry: { type: Boolean, default: true },
  requireDescription: { type: Boolean, default: false },
  autoStartBreak: { type: Boolean, default: false },
  breakDuration: { type: Number, default: 15, min: 0 }, // in minutes
  maxDailyHours: { type: Number, default: 12, min: 1, max: 24 },
  minSessionDuration: { type: Number, default: 1, min: 1 } // in minutes
}, { _id: false });

const SharedSettingsSchema = new Schema<SharedSettingsDocument>({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  screenshotSettings: ScreenshotSettingsSchema,
  timeTrackingSettings: TimeTrackingSettingsSchema
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
SharedSettingsSchema.index({ name: 1 });
SharedSettingsSchema.index({ createdAt: -1 });

// Static methods
SharedSettingsSchema.statics.findByName = function(name: string) {
  return this.findOne({ name: { $regex: name, $options: 'i' } });
};

// Instance methods
SharedSettingsSchema.methods.updateScreenshotSettings = function(settings: Partial<ScreenshotSettings>) {
  this.screenshotSettings = { ...this.screenshotSettings, ...settings };
  return this.save();
};

SharedSettingsSchema.methods.updateTimeTrackingSettings = function(settings: Partial<TimeTrackingSettings>) {
  this.timeTrackingSettings = { ...this.timeTrackingSettings, ...settings };
  return this.save();
};

export default mongoose.model<SharedSettingsDocument>('SharedSettings', SharedSettingsSchema);
