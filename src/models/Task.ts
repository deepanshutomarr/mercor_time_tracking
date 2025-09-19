import mongoose, { Schema } from 'mongoose';
import { Task, TaskPayroll } from '../types';
import { TaskModel, TaskDocument } from '../types/models';

const TaskPayrollSchema = new Schema<TaskPayroll>({
  billRate: { type: Number, required: true, min: 0 },
  overtimeBillRate: { type: Number, required: true, min: 0 }
}, { _id: false });

const TaskSchema = new Schema<TaskDocument>({
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
  projectId: { 
    type: String, 
    required: true,
    ref: 'Project'
  },
  employees: [{ 
    type: String, 
    ref: 'Employee' 
  }],
  deadline: { 
    type: Number 
  },
  status: { 
    type: String, 
    trim: true,
    maxlength: 50,
    default: 'pending'
  },
  labels: [{ 
    type: String, 
    trim: true,
    maxlength: 50
  }],
  priority: { 
    type: String, 
    trim: true,
    maxlength: 50,
    default: 'medium',
    enum: ['low', 'medium', 'high', 'urgent']
  },
  billable: { 
    type: Boolean, 
    default: true 
  },
  payroll: TaskPayrollSchema
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
TaskSchema.index({ name: 1 });
TaskSchema.index({ projectId: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ employees: 1 });
TaskSchema.index({ createdAt: -1 });

// Virtual for employee count
TaskSchema.virtual('employeeCount').get(function() {
  return this.employees.length;
});

// Virtual for completion status
TaskSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Virtual for overdue status
TaskSchema.virtual('isOverdue').get(function() {
  if (!this.deadline) return false;
  return Date.now() > this.deadline && this.status !== 'completed';
});

// Pre-save middleware
TaskSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }
  if (this.isModified('description')) {
    this.description = this.description?.trim();
  }
  if (this.isModified('status')) {
    this.status = this.status?.trim();
  }
  if (this.isModified('priority')) {
    this.priority = this.priority?.trim();
  }
  next();
});

// Static methods
TaskSchema.statics.findByProject = function(projectId: string) {
  return this.find({ projectId }).sort({ createdAt: -1 });
};

TaskSchema.statics.findByEmployee = function(employeeId: string) {
  return this.find({ 
    employees: employeeId 
  }).sort({ createdAt: -1 });
};

TaskSchema.statics.findByStatus = function(status: string) {
  return this.find({ status }).sort({ createdAt: -1 });
};

TaskSchema.statics.findByPriority = function(priority: string) {
  return this.find({ priority }).sort({ createdAt: -1 });
};

TaskSchema.statics.findOverdue = function() {
  return this.find({ 
    deadline: { $lt: Date.now() },
    status: { $ne: 'completed' }
  }).sort({ deadline: 1 });
};

// Instance methods
TaskSchema.methods.addEmployee = function(employeeId: string) {
  if (!this.employees.includes(employeeId)) {
    this.employees.push(employeeId);
  }
  return this.save();
};

TaskSchema.methods.removeEmployee = function(employeeId: string) {
  this.employees = this.employees.filter((id: string) => id !== employeeId);
  return this.save();
};

TaskSchema.methods.updateStatus = function(status: string) {
  this.status = status;
  return this.save();
};

TaskSchema.methods.updatePriority = function(priority: string) {
  this.priority = priority;
  return this.save();
};

TaskSchema.methods.addLabel = function(label: string) {
  if (!this.labels.includes(label)) {
    this.labels.push(label);
  }
  return this.save();
};

TaskSchema.methods.removeLabel = function(label: string) {
  this.labels = this.labels.filter((l: string) => l !== label);
  return this.save();
};

export default mongoose.model<TaskDocument, TaskModel>('Task', TaskSchema);
