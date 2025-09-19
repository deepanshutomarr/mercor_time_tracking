import mongoose, { Document, Schema } from 'mongoose';
import { TimeEntry, DeviceInfo } from '../types';
import { TimeEntryModel, TimeEntryDocument } from '../types/models';

const DeviceInfoSchema = new Schema<DeviceInfo>({
  ipAddress: { type: String, required: true },
  macAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  platform: { type: String, required: true },
  os: { type: String, required: true },
  osVersion: { type: String, required: true },
  browser: { type: String },
  browserVersion: { type: String },
  screenResolution: { type: String, required: true },
  timezone: { type: String, required: true },
  language: { type: String, required: true }
}, { _id: false });

const TimeEntrySchema = new Schema<TimeEntryDocument>({
  employeeId: { 
    type: String, 
    required: true,
    ref: 'Employee'
  },
  projectId: { 
    type: String, 
    required: true,
    ref: 'Project'
  },
  taskId: { 
    type: String, 
    required: true,
    ref: 'Task'
  },
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date 
  },
  duration: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 500
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  screenshots: [{ 
    type: String, 
    ref: 'Screenshot' 
  }],
  deviceInfo: DeviceInfoSchema
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
TimeEntrySchema.index({ employeeId: 1 });
TimeEntrySchema.index({ projectId: 1 });
TimeEntrySchema.index({ taskId: 1 });
TimeEntrySchema.index({ startTime: -1 });
TimeEntrySchema.index({ endTime: -1 });
TimeEntrySchema.index({ isActive: 1 });
TimeEntrySchema.index({ createdAt: -1 });

// Compound indexes
TimeEntrySchema.index({ employeeId: 1, startTime: -1 });
TimeEntrySchema.index({ projectId: 1, startTime: -1 });
TimeEntrySchema.index({ taskId: 1, startTime: -1 });
TimeEntrySchema.index({ employeeId: 1, isActive: 1 });

// Virtual for duration in hours
TimeEntrySchema.virtual('durationHours').get(function() {
  return this.duration / (1000 * 60 * 60);
});

// Virtual for duration in minutes
TimeEntrySchema.virtual('durationMinutes').get(function() {
  return this.duration / (1000 * 60);
});

// Virtual for formatted duration
TimeEntrySchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / (1000 * 60 * 60));
  const minutes = Math.floor((this.duration % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((this.duration % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
});

// Pre-save middleware
TimeEntrySchema.pre('save', function(next) {
  // Calculate duration if endTime is set
  if (this.endTime && this.startTime) {
    this.duration = this.endTime.getTime() - this.startTime.getTime();
    this.isActive = false;
  } else if (this.isActive) {
    // For active entries, calculate duration up to now
    this.duration = Date.now() - this.startTime.getTime();
  }
  
  if (this.isModified('description')) {
    this.description = this.description?.trim();
  }
  
  next();
});

// Static methods
TimeEntrySchema.statics.findByEmployee = function(employeeId: string, startDate?: Date, endDate?: Date) {
  const query: any = { employeeId };
  if (startDate && endDate) {
    query.startTime = { $gte: startDate, $lte: endDate };
  }
  return this.find(query);
};

TimeEntrySchema.statics.findByProject = function(projectId: string, startDate?: Date, endDate?: Date) {
  const query: any = { projectId };
  
  if (startDate && endDate) {
    query.startTime = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query).sort({ startTime: -1 });
};

TimeEntrySchema.statics.findByTask = function(taskId: string, startDate?: Date, endDate?: Date) {
  const query: any = { taskId };
  
  if (startDate && endDate) {
    query.startTime = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query).sort({ startTime: -1 });
};

TimeEntrySchema.statics.findActiveEntries = function(employeeId?: string) {
  const query: any = { isActive: true };
  if (employeeId) {
    query.employeeId = employeeId;
  }
  return this.find(query);
};

TimeEntrySchema.statics.getTotalDuration = function(employeeId: string, startDate?: Date, endDate?: Date) {
  const query: any = { employeeId, isActive: false };
  
  if (startDate && endDate) {
    query.startTime = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: query },
    { $group: { _id: null, totalDuration: { $sum: '$duration' } } }
  ]);
};

// Instance methods
TimeEntrySchema.methods.stop = function(endTime?: Date) {
  this.endTime = endTime || new Date();
  this.isActive = false;
  this.duration = this.endTime.getTime() - this.startTime.getTime();
  return this.save();
};

TimeEntrySchema.methods.addScreenshot = function(screenshotId: string) {
  if (!this.screenshots.includes(screenshotId)) {
    this.screenshots.push(screenshotId);
  }
  return this.save();
};

TimeEntrySchema.methods.removeScreenshot = function(screenshotId: string) {
  this.screenshots = this.screenshots.filter((id: string) => id !== screenshotId);
  return this.save();
};

TimeEntrySchema.methods.updateDescription = function(description: string) {
  this.description = description.trim();
  return this.save();
};

export default mongoose.model<TimeEntryDocument, TimeEntryModel>('TimeEntry', TimeEntrySchema);
