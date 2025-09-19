import axios, { AxiosInstance } from 'axios';
import { BrowserWindow } from 'electron';
import { isDev } from '../utils/environment';
import Store from 'electron-store';
import { StoreService } from './StoreService';

export class ApiService {
  private api: AxiosInstance;
  private baseURL: string;
  private storeService: StoreService;
  private initialized = false;

  constructor(storeService: StoreService) {
    this.storeService = storeService;
    this.baseURL = isDev 
      ? 'http://localhost:3000/api/v1'
      : 'https://api.mercor.com/api/v1';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  async initialize() {
    if (this.initialized) {
      console.log('API Service already initialized, skipping');
      return;
    }

    try {
      // Check if API server is available
      await this.checkServerAvailability();
      
      // Check authentication state with detailed logging
      const token = this.getStoredToken();
      const user = this.storeService.get('user');
      
      console.log('Checking stored credentials:', {
        hasToken: !!token,
        hasUser: !!user,
        token: token ? token.substring(0, 10) + '...' : null
      });
      
      // Verify token and user
      if (token && user) {
        try {
          // Verify token with API server
          const response = await this.api.get('/employee/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // If successful, update user data and emit auth state
          if (response.data.success) {
            this.storeService.set('user', response.data.data);
            this.emitAuthStateChange({ isAuthenticated: true, user: response.data.data });
            console.log('Credentials verified:', { userId: response.data.data.id });
          } else {
            throw new Error('Token validation failed');
          }
        } catch (error) {
          // If token verification fails, clear stored data
          console.warn('Token validation failed, clearing credentials');
          this.clearStoredToken();
          this.storeService.delete('user');
          this.emitAuthStateChange({ isAuthenticated: false });
        }
      } else {
        this.emitAuthStateChange({ isAuthenticated: false });
        console.log('No stored credentials found:', { reason: !token ? 'no token' : 'no user' });
      }

      this.initialized = true;
      console.log('API Service initialized');
    } catch (error: any) {
      console.error('Failed to initialize API Service:', error);
      throw error;
    }
  }

  private async checkServerAvailability() {
    try {
      await this.api.get('/health');
      console.log('API server is available');
    } catch (error: any) {
      console.error('API server is not available:', {
        status: error.response?.status,
        message: error.message
      });
      throw new Error('API server is not available');
    }
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearStoredToken();
          this.emitAuthStateChange({ isAuthenticated: false });
        }
        return Promise.reject(error);
      }
    );
  }

  getStoredToken(): string | null {
    return this.storeService.get('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  private setStoredToken(token: string) {
    this.storeService.set('auth_token', token);
  }

  private clearStoredToken() {
    this.storeService.delete('auth_token');
  }

  private emitAuthStateChange(data: { isAuthenticated: boolean; user?: any }) {
    try {
      const windows = BrowserWindow.getAllWindows();
      windows.forEach((window: BrowserWindow) => {
        window.webContents.send('auth:stateChange', data);
      });
    } catch (error) {
      console.error('Failed to emit auth state change:', error);
    }
  }

  async login(credentials: { email: string; password: string }) {
    try {
      console.log('Attempting login...');
      const response = await this.api.post('/employee/login', credentials);
      const { token, employee } = response.data.data;
      
      console.log('Login successful, storing credentials...');
      
      this.setStoredToken(token);
      this.storeService.set('user', employee);
      
      const storedToken = this.getStoredToken();
      const storedUser = this.storeService.get('user');
      console.log('Credentials stored:', { 
        hasToken: !!storedToken,
        hasUser: !!storedUser,
        userId: storedUser?.id
      });
      
      this.emitAuthStateChange({ isAuthenticated: true, user: employee });
      
      return { success: true, data: { token, employee } };
    } catch (error: any) {
      console.error('Login failed:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message
      });
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async logout() {
    try {
      this.clearStoredToken();
      this.storeService.delete('user');
      
      this.emitAuthStateChange({ isAuthenticated: false });
      return { success: true };
    } catch (error: any) {
      console.error('Logout failed:', error);
      throw new Error('Logout failed');
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.api.get('/employee/me');
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Failed to get user:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message
      });
      throw new Error(`Failed to get user: ${error.response?.data?.message || error.message}`);
    }
  }

  async getProjects() {
    try {
      const response = await this.api.get('/project');
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Failed to get projects:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message
      });
      throw new Error(`Failed to get projects: ${error.response?.data?.message || error.message}`);
    }
  }

  async getProjectTasks(projectId: string) {
    try {
      const response = await this.api.get(`/task?projectId=${projectId}`);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get tasks');
    }
  }

  async startTimeTracking(data: { projectId: string; taskId: string; description?: string }) {
    try {
      const response = await this.api.post('/time-tracking/start', data);
      return { success: true, data: response.data.data };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to start time tracking');
    }
  }

  async stopTimeTracking(timeEntryId: string) {
    try {
      const response = await this.api.post('/time-tracking/stop', { timeEntryId });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to stop time tracking');
    }
  }

  async getActiveTimeEntry() {
    try {
      const response = await this.api.get('/time-tracking/active');
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Failed to get active time entry:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message
      });
      throw new Error(`Failed to get active time entry: ${error.response?.data?.message || error.message}`);
    }
  }

  async getTimeTrackingHistory(params: any) {
    try {
      const response = await this.api.get('/time-tracking/employee/me', { params });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Failed to get time tracking history:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message
      });
      throw new Error(`Failed to get time tracking history: ${error.response?.data?.message || error.message}`);
    }
  }

  async getScreenshots(params: any) {
    try {
      const response = await this.api.get('/analytics/screenshot', { params });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Failed to get screenshots:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message
      });
      throw new Error(`Failed to get screenshots: ${error.response?.data?.message || error.message}`);
    }
  }

  async uploadScreenshot(screenshotData: any) {
    try {
      const formData = new FormData();
      formData.append('screenshot', screenshotData.file);
      formData.append('timeEntryId', screenshotData.timeEntryId);
      formData.append('projectId', screenshotData.projectId);
      formData.append('taskId', screenshotData.taskId);

      const response = await this.api.post('/analytics/screenshot/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Failed to upload screenshot:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message
      });
      throw new Error(`Failed to upload screenshot: ${error.response?.data?.message || error.message}`);
    }
  }
}