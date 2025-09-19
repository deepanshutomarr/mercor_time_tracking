export interface Employee {
  _id: string;
  name: string;
  email: string;
  password?: string; // hashed, optional for type safety
  teamId: string;
  sharedSettingsId: string;
  title?: string;
  projects: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  deviceInfo?: DeviceInfo;
  activationToken?: string | null;
  activationTokenExpires?: Date | null;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  employees: string[];
  statuses: string[];
  priorities: string[];
  billable: boolean;
  deadline?: number;
  payroll?: ProjectPayroll;
  archived: boolean;
  screenshotSettings?: ScreenshotSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  _id: string;
  name: string;
  description?: string;
  projectId: string;
  employees: string[];
  deadline?: number;
  status?: string;
  labels: string[];
  priority?: string;
  billable: boolean;
  payroll?: TaskPayroll;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  _id: string;
  employeeId: string;
  projectId: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in milliseconds
  description?: string;
  isActive: boolean;
  screenshots: string[];
  deviceInfo: DeviceInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface Screenshot {
  _id: string;
  employeeId: string;
  timeEntryId: string;
  projectId: string;
  taskId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  hasPermission: boolean;
  takenAt: Date;
  createdAt: Date;
}

export interface ProjectPayroll {
  billRate: number;
  overtimeBillRate: number;
}

export interface TaskPayroll {
  billRate: number;
  overtimeBillRate: number;
}

export interface ScreenshotSettings {
  screenshotEnabled: boolean;
  interval: number; // in milliseconds
  quality: number; // 0-100
  maxSize: string; // e.g., "1920x1080"
}

export interface DeviceInfo {
  ipAddress: string;
  macAddress: string;
  userAgent: string;
  platform: string;
  os: string;
  osVersion: string;
  browser?: string;
  browserVersion?: string;
  screenResolution: string;
  timezone: string;
  language: string;
}

export interface Team {
  _id: string;
  name: string;
  description?: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SharedSettings {
  _id: string;
  name: string;
  screenshotSettings: ScreenshotSettings;
  timeTrackingSettings: TimeTrackingSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeTrackingSettings {
  allowManualTimeEntry: boolean;
  requireDescription: boolean;
  autoStartBreak: boolean;
  breakDuration: number; // in minutes
  maxDailyHours: number;
  minSessionDuration: number; // in minutes
}

export interface WindowAnalytics {
  employeeId?: string;
  teamId?: string;
  projectId?: string;
  taskId?: string;
  shiftId?: string;
  start: number;
  end: number;
  timezone?: string;
  totalTime: number;
  activeTime: number;
  idleTime: number;
  screenshots: number;
  activities: Activity[];
}

export interface Activity {
  application: string;
  title: string;
  url?: string;
  duration: number;
  startTime: Date;
  endTime: Date;
}

export interface ScreenshotResponse {
  screenshots: Screenshot[];
  total: number;
  hasMore: boolean;
  next?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TimeTrackingQuery extends PaginationQuery {
  start: number;
  end: number;
  timezone?: string;
  employeeId?: string;
  teamId?: string;
  projectId?: string;
  taskId?: string;
  shiftId?: string;
}

export interface ScreenshotQuery extends PaginationQuery {
  start: number;
  end: number;
  timezone?: string;
  taskId?: string;
  shiftId?: string;
  projectId?: string;
  sortBy?: ScreenshotSort;
  next?: string;
}

export enum ScreenshotSort {
  TAKEN_AT_ASC = 'takenAt',
  TAKEN_AT_DESC = '-takenAt',
  FILE_SIZE_ASC = 'fileSize',
  FILE_SIZE_DESC = '-fileSize'
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  teamId: string;
  sharedSettingsId: string;
  title?: string;
  projects?: string[];
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  title?: string;
  teamId?: string;
  sharedSettingsId?: string;
  projects?: string[];
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  employees: string[];
  statuses?: string[];
  priorities?: string[];
  billable?: boolean;
  deadline?: number;
  payroll?: ProjectPayroll;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  employees?: string[];
  statuses?: string[];
  priorities?: string[];
  billable?: boolean;
  deadline?: number;
  payroll?: ProjectPayroll;
  archived?: boolean;
  screenshotSettings?: ScreenshotSettings;
}

export interface CreateTaskRequest {
  name: string;
  description?: string;
  projectId: string;
  employees: string[];
  deadline?: number;
  status?: string;
  labels?: string[];
  priority?: string;
  billable?: boolean;
  payroll?: TaskPayroll;
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  employees?: string[];
  deadline?: number;
  status?: string;
  labels?: string[];
  priority?: string;
  billable?: boolean;
  payroll?: TaskPayroll;
}

export interface StartTimeTrackingRequest {
  projectId: string;
  taskId: string;
  description?: string;
}

export interface StopTimeTrackingRequest {
  timeEntryId: string;
  description?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'employee';
  iat: number;
  exp: number;
}
