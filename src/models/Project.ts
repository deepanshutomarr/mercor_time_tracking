import mongoose, { Schema } from 'mongoose';
import { Project, ProjectPayroll, ScreenshotSettings } from '../types';
import { ProjectModel, ProjectDocument } from '../types/models';

const ProjectPayrollSchema = new Schema<ProjectPayroll>({
  billRate: { type: Number, required: true, min: 0 },
  overtimeBillRate: { type: Number, required: true, min: 0 }
}, { _id: false });

const ScreenshotSettingsSchema = new Schema<ScreenshotSettings>({
  screenshotEnabled: { type: Boolean, default: true },
  interval: { type: Number, default: 300000, min: 60000 }, // 5 minutes default
  quality: { type: Number, default: 80, min: 10, max: 100 },
  maxSize: { type: String, default: '1920x1080' }
}, { _id: false });

const ProjectSchema = new Schema<ProjectDocument>({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 2,
    maxlength: 200
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 1000
  },
  employees: [{ 
    type: String, 
    ref: 'Employee' 
  }],
  statuses: [{ 
    type: String, 
    trim: true,
    maxlength: 50
  }],
  priorities: [{ 
    type: String, 
    trim: true,
    maxlength: 50
  }],
  billable: { 
    type: Boolean, 
    default: true 
  },
  deadline: { 
    type: Number 
  },
  payroll: ProjectPayrollSchema,
  archived: { 
    type: Boolean, 
    default: false 
  },
  screenshotSettings: ScreenshotSettingsSchema
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ProjectSchema.index({ name: 1 });
ProjectSchema.index({ archived: 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ employees: 1 });

// Virtual for employee count
ProjectSchema.virtual('employeeCount').get(function() {
  return this.employees.length;
});

// Virtual for completion status
ProjectSchema.virtual('isCompleted').get(function() {
  if (!this.deadline) return false;
  return Date.now() > this.deadline;
});

// Pre-save middleware
ProjectSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }
  if (this.isModified('description')) {
    this.description = this.description?.trim();
  }
  next();
});

// Static methods
ProjectSchema.statics.findActiveProjects = function() {
  return this.find({ archived: false }).sort({ createdAt: -1 });
};

ProjectSchema.statics.findByEmployee = function(employeeId: string) {
  return this.find({ 
    employees: employeeId, 
    archived: false 
  }).sort({ createdAt: -1 });
};

ProjectSchema.statics.findBillableProjects = function() {
  return this.find({ 
    billable: true, 
    archived: false 
  }).sort({ createdAt: -1 });
};

// Instance methods
ProjectSchema.methods.addEmployee = function(employeeId: string) {
  if (!this.employees.includes(employeeId)) {
    this.employees.push(employeeId);
  }
  return this.save();
};

ProjectSchema.methods.removeEmployee = function(employeeId: string) {
  this.employees = this.employees.filter((id: string) => id !== employeeId);
  return this.save();
};

ProjectSchema.methods.archive = function() {
  this.archived = true;
  return this.save();
};

ProjectSchema.methods.unarchive = function() {
  this.archived = false;
  return this.save();
};

ProjectSchema.methods.updateScreenshotSettings = function(settings: Partial<ScreenshotSettings>) {
  this.screenshotSettings = { ...this.screenshotSettings, ...settings };
  return this.save();
};

export default mongoose.model<ProjectDocument, ProjectModel>('Project', ProjectSchema);
