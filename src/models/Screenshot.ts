import mongoose, { Document, Schema } from 'mongoose';
import { Screenshot } from '../types';

export type ScreenshotDocument = Screenshot & Document;

const ScreenshotSchema = new Schema<ScreenshotDocument>({
  employeeId: { 
    type: String, 
    required: true,
    ref: 'Employee'
  },
  timeEntryId: { 
    type: String, 
    required: true,
    ref: 'TimeEntry'
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
  filePath: { 
    type: String, 
    required: true,
    trim: true
  },
  fileName: { 
    type: String, 
    required: true,
    trim: true
  },
  fileSize: { 
    type: Number, 
    required: true,
    min: 0
  },
  mimeType: { 
    type: String, 
    required: true,
    trim: true
  },
  width: { 
    type: Number, 
    required: true,
    min: 1
  },
  height: { 
    type: Number, 
    required: true,
    min: 1
  },
  hasPermission: { 
    type: Boolean, 
    required: true,
    default: false
  },
  takenAt: { 
    type: Date, 
    required: true,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ScreenshotSchema.index({ employeeId: 1 });
ScreenshotSchema.index({ timeEntryId: 1 });
ScreenshotSchema.index({ projectId: 1 });
ScreenshotSchema.index({ taskId: 1 });
ScreenshotSchema.index({ takenAt: -1 });
ScreenshotSchema.index({ hasPermission: 1 });
ScreenshotSchema.index({ createdAt: -1 });

// Compound indexes
ScreenshotSchema.index({ employeeId: 1, takenAt: -1 });
ScreenshotSchema.index({ projectId: 1, takenAt: -1 });
ScreenshotSchema.index({ taskId: 1, takenAt: -1 });
ScreenshotSchema.index({ timeEntryId: 1, takenAt: -1 });

// Virtual for file size in MB
ScreenshotSchema.virtual('fileSizeMB').get(function() {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Virtual for file size in KB
ScreenshotSchema.virtual('fileSizeKB').get(function() {
  return (this.fileSize / 1024).toFixed(2);
});

// Virtual for aspect ratio
ScreenshotSchema.virtual('aspectRatio').get(function() {
  return (this.width / this.height).toFixed(2);
});

// Virtual for resolution string
ScreenshotSchema.virtual('resolution').get(function() {
  return `${this.width}x${this.height}`;
});

// Pre-save middleware
ScreenshotSchema.pre('save', function(next) {
  if (this.isModified('filePath')) {
    this.filePath = this.filePath.trim();
  }
  if (this.isModified('fileName')) {
    this.fileName = this.fileName.trim();
  }
  if (this.isModified('mimeType')) {
    this.mimeType = this.mimeType.trim();
  }
  next();
});

// Static methods
ScreenshotSchema.statics.findByEmployee = function(employeeId: string, startDate?: Date, endDate?: Date) {
  const query: any = { employeeId };
  
  if (startDate && endDate) {
    query.takenAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query).sort({ takenAt: -1 });
};

ScreenshotSchema.statics.findByProject = function(projectId: string, startDate?: Date, endDate?: Date) {
  const query: any = { projectId };
  
  if (startDate && endDate) {
    query.takenAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query).sort({ takenAt: -1 });
};

ScreenshotSchema.statics.findByTask = function(taskId: string, startDate?: Date, endDate?: Date) {
  const query: any = { taskId };
  
  if (startDate && endDate) {
    query.takenAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query).sort({ takenAt: -1 });
};

ScreenshotSchema.statics.findByTimeEntry = function(timeEntryId: string) {
  return this.find({ timeEntryId }).sort({ takenAt: -1 });
};

ScreenshotSchema.statics.findWithPermission = function(hasPermission: boolean = true) {
  return this.find({ hasPermission }).sort({ takenAt: -1 });
};

ScreenshotSchema.statics.getTotalSize = function(employeeId?: string, startDate?: Date, endDate?: Date) {
  const query: any = {};
  
  if (employeeId) {
    query.employeeId = employeeId;
  }
  
  if (startDate && endDate) {
    query.takenAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: query },
    { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
  ]);
};

ScreenshotSchema.statics.getCountByEmployee = function(employeeId?: string, startDate?: Date, endDate?: Date) {
  const query: any = {};
  
  if (employeeId) {
    query.employeeId = employeeId;
  }
  
  if (startDate && endDate) {
    query.takenAt = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: query },
    { $group: { _id: '$employeeId', count: { $sum: 1 } } }
  ]);
};

// Instance methods
ScreenshotSchema.methods.updatePermission = function(hasPermission: boolean) {
  this.hasPermission = hasPermission;
  return this.save();
};

ScreenshotSchema.methods.getFileUrl = function(baseUrl: string) {
  return `${baseUrl}/api/v1/screenshots/${this._id}/file`;
};

ScreenshotSchema.methods.getThumbnailUrl = function(baseUrl: string) {
  return `${baseUrl}/api/v1/screenshots/${this._id}/thumbnail`;
};

export default mongoose.model<ScreenshotDocument>('Screenshot', ScreenshotSchema);
