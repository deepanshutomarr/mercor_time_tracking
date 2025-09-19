import { Model, Document } from 'mongoose';
import { Employee, Project, Task, ScreenshotSettings } from './index';

// Employee model interfaces
interface EmployeeModel extends Model<EmployeeDocument> {
  findByEmail(email: string): Promise<EmployeeDocument | null>;
  findActiveEmployees(): Promise<EmployeeDocument[]>;
  findByTeam(teamId: string): Promise<EmployeeDocument[]>;
}

interface EmployeeDocument extends Employee, Document {
  password: string;
  updateLastLogin(): Promise<EmployeeDocument>;
  addProject(projectId: string): Promise<EmployeeDocument>;
  removeProject(projectId: string): Promise<EmployeeDocument>;
  deactivate(): Promise<EmployeeDocument>;
  activate(): Promise<EmployeeDocument>;
}

// Project model interfaces
interface ProjectModel extends Model<ProjectDocument> {
  findActiveProjects(): Promise<ProjectDocument[]>;
  findByEmployee(employeeId: string): Promise<ProjectDocument[]>;
  findBillableProjects(): Promise<ProjectDocument[]>;
}

interface ProjectDocument extends Project, Document {
  addEmployee(employeeId: string): Promise<ProjectDocument>;
  removeEmployee(employeeId: string): Promise<ProjectDocument>;
  archive(): Promise<ProjectDocument>;
  unarchive(): Promise<ProjectDocument>;
  updateScreenshotSettings(settings: Partial<ScreenshotSettings>): Promise<ProjectDocument>;
}

// Task model interfaces
interface TaskModel extends Model<TaskDocument> {
  findByProject(projectId: string): Promise<TaskDocument[]>;
  findByEmployee(employeeId: string): Promise<TaskDocument[]>;
  findByStatus(status: string): Promise<TaskDocument[]>;
  findByPriority(priority: string): Promise<TaskDocument[]>;
  findOverdue(): Promise<TaskDocument[]>;
}

interface TaskDocument extends Task, Document {
  addEmployee(employeeId: string): Promise<TaskDocument>;
  removeEmployee(employeeId: string): Promise<TaskDocument>;
  updateStatus(status: string): Promise<TaskDocument>;
  updatePriority(priority: string): Promise<TaskDocument>;
  addLabel(label: string): Promise<TaskDocument>;
  removeLabel(label: string): Promise<TaskDocument>;
}

// TimeEntry model interfaces
interface TimeEntryModel extends Model<TimeEntryDocument> {
  findActiveEntries(employeeId?: string): Promise<TimeEntryDocument[]>;
  findByEmployee(employeeId: string, startDate?: Date, endDate?: Date): Promise<TimeEntryDocument[]>;
}

interface TimeEntryDocument extends Document {
  employeeId: string;
  projectId: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  description?: string;
  isActive: boolean;
  screenshots: string[];
  deviceInfo?: any;
  formattedDuration: string;
  addScreenshot(screenshotId: string): Promise<TimeEntryDocument>;
  stop(endTime?: Date): Promise<TimeEntryDocument>;
  updateDescription(description: string): Promise<TimeEntryDocument>;
}

export {
  EmployeeModel,
  EmployeeDocument,
  ProjectModel,
  ProjectDocument,
  TaskModel,
  TaskDocument,
  TimeEntryModel,
  TimeEntryDocument
};