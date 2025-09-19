import mongoose, { Schema } from 'mongoose';
import { Employee, DeviceInfo } from '../types';
import { EmployeeModel, EmployeeDocument } from '../types/models';

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

const EmployeeSchema = new Schema<EmployeeDocument>({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Do not return password by default
  },
  teamId: { 
    type: String, 
    required: true,
    ref: 'Team'
  },
  sharedSettingsId: { 
    type: String, 
    required: true,
    ref: 'SharedSettings'
  },
  title: { 
    type: String, 
    trim: true,
    maxlength: 100
  },
  projects: [{ 
    type: String, 
    ref: 'Project' 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLoginAt: { 
    type: Date 
  },
  deviceInfo: DeviceInfoSchema,
  activationToken: {
    type: String,
    default: null
  },
  activationTokenExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
EmployeeSchema.index({ teamId: 1 });
EmployeeSchema.index({ isActive: 1 });
EmployeeSchema.index({ createdAt: -1 });

// Virtual for full name
EmployeeSchema.virtual('fullName').get(function() {
  return this.name;
});

// Pre-save middleware
EmployeeSchema.pre('save', async function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }
  // Hash password if modified
  if (this.isModified('password')) {
    const bcrypt = require('bcryptjs');
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Static methods
EmployeeSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

EmployeeSchema.statics.findActiveEmployees = function() {
  return this.find({ isActive: true }).sort({ createdAt: -1 });
};

EmployeeSchema.statics.findByTeam = function(teamId: string) {
  return this.find({ teamId, isActive: true }).sort({ createdAt: -1 });
};

// Instance methods
EmployeeSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

EmployeeSchema.methods.addProject = function(projectId: string) {
  if (!this.projects.includes(projectId)) {
    this.projects.push(projectId);
  }
  return this.save();
};

EmployeeSchema.methods.removeProject = function(projectId: string) {
  this.projects = this.projects.filter((id: string) => id !== projectId);
  return this.save();
};

EmployeeSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

EmployeeSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

export default mongoose.model<EmployeeDocument, EmployeeModel>('Employee', EmployeeSchema);
