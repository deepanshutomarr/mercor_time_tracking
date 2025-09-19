import mongoose, { Schema } from 'mongoose';
import { TeamModel, TeamDocument } from '../types/team';

const TeamSchema = new Schema<TeamDocument>({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 500
  },
  members: [{ 
    type: String, 
    ref: 'Employee' 
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
TeamSchema.index({ name: 1 });
TeamSchema.index({ createdAt: -1 });

// Virtual for member count
TeamSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Instance methods
TeamSchema.methods.addMember = function(employeeId: string) {
  if (!this.members.includes(employeeId)) {
    this.members.push(employeeId);
  }
  return this.save();
};

TeamSchema.methods.removeMember = function(employeeId: string) {
  this.members = this.members.filter((id: string) => id !== employeeId);
  return this.save();
};

// Static methods
TeamSchema.statics.findByName = function(name: string) {
  return this.findOne({ name: { $regex: name, $options: 'i' } });
};

// Instance methods
TeamSchema.methods.addMember = function(employeeId: string) {
  if (!this.members.includes(employeeId)) {
    this.members.push(employeeId);
  }
  return this.save();
};

TeamSchema.methods.removeMember = function(employeeId: string) {
  this.members = this.members.filter((id: string) => id !== employeeId);
  return this.save();
};

export default mongoose.model<TeamDocument, TeamModel>('Team', TeamSchema);
