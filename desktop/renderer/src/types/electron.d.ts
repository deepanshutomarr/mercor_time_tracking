interface TimeEntry {
  _id: string;
  projectId: string;
  taskId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  isActive: boolean;
  description?: string;
  project?: {
    _id: string;
    name: string;
    description?: string;
  };
  task?: {
    _id: string;
    name: string;
    description?: string;
  };
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  billable: boolean;
}

interface Task {
  _id: string;
  name: string;
  description?: string;
  projectId: string;
  priority: string;
  status: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  title?: string;
  teamId: string;
}

export {}

declare global {
  interface Window {
    electronAPI: {
      // Window management
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;

      // Time tracking
      onTimeTrackingUpdate: (callback: (data: { type: 'started' | 'stopped', entry: TimeEntry }) => void) => void;
      removeAllListeners: (event: string) => void;
      getActiveTimeEntry: () => Promise<ApiResponse<TimeEntry | null>>;
      getProjects: () => Promise<ApiResponse<Project[]>>;
      getProjectTasks: (projectId: string) => Promise<ApiResponse<Task[]>>;
      startTimeTracking: (data: { projectId: string, taskId: string, description?: string }) => Promise<ApiResponse<TimeEntry>>;
      stopTimeTracking: (timeEntryId: string) => Promise<ApiResponse<TimeEntry>>;

      // Authentication
      getUser: () => Promise<ApiResponse<User | null>>;
      onAuthStateChange: (callback: (data: { isAuthenticated: boolean, user?: User }) => void) => void;
    }
  }
}