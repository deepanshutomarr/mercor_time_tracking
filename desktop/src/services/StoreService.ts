import Store from 'electron-store';

// Extend StoreSchema to include cache items
interface StoreSchema {
  user: any;
  auth_token: string | null;
  settings: {
    screenshotInterval: number;
    autoStart: boolean;
    minimizeToTray: boolean;
    notifications: boolean;
    theme: string;
  };
  activeTimeEntry: any;
  projects: any[];
  tasks: any[];
  [key: `cache.${string}`]: { value: any; timestamp: number; ttl: number } | undefined;
}

export class StoreService {
  private store: Store<StoreSchema>;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'mercor-time-tracking',
      defaults: {
        user: null,
        auth_token: null,
        settings: {
          screenshotInterval: 300000, // 5 minutes
          autoStart: false,
          minimizeToTray: true,
          notifications: true,
          theme: 'system'
        },
        activeTimeEntry: null,
        projects: [],
        tasks: []
      }
    });
  }

  logStoreInitialization(): Promise<void> {
    const data = this.store.store;
    console.log('Store initialized:', {
      path: this.store.path,
      hasData: Object.keys(data || {}).length > 0,
      availableKeys: Object.keys(data || {}),
      storedToken: this.get('auth_token') ? 'present' : 'missing',
      storedUser: this.get('user') ? 'present' : 'missing'
    });
    return Promise.resolve();
  }

  // Core storage methods
  has(key: keyof StoreSchema): boolean {
    return this.store.has(key);
  }

  get<K extends keyof StoreSchema>(key: K): StoreSchema[K] {
    return this.store.get(key);
  }

  set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void {
    this.store.set(key, value);
  }

  delete<K extends keyof StoreSchema>(key: K): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  // User methods
  getUser() {
    return this.get('user');
  }

  setUser(user: any) {
    this.set('user', user);
  }

  clearUser() {
    this.delete('user');
  }

  // Settings methods
  getSettings() {
    return this.get('settings');
  }

  getSettingKey<K extends keyof StoreSchema['settings']>(key: K): StoreSchema['settings'][K] {
    const settings = this.getSettings();
    return settings[key];
  }

  setSettingKey<K extends keyof StoreSchema['settings']>(key: K, value: StoreSchema['settings'][K]) {
    const settings = this.getSettings();
    settings[key] = value;
    this.set('settings', settings);
  }

  // Time tracking methods
  getActiveTimeEntry() {
    return this.get('activeTimeEntry');
  }

  setActiveTimeEntry(entry: any) {
    this.set('activeTimeEntry', entry);
  }

  clearActiveTimeEntry() {
    this.delete('activeTimeEntry');
  }

  // Projects methods
  getProjects() {
    return this.get('projects');
  }

  setProjects(projects: any[]) {
    this.set('projects', projects);
  }

  // Tasks methods
  getTasks() {
    return this.get('tasks');
  }

  setTasks(tasks: any[]) {
    this.set('tasks', tasks);
  }

  // Cache methods with proper typing
  getCacheItem<T>(key: string): { value: T; timestamp: number; ttl: number } | null {
    return this.get(`cache.${key}` as keyof StoreSchema) || null;
  }

  setCacheItem<T>(key: string, value: T, ttl: number = 3600000) { // 1 hour default TTL
    const cacheData = {
      value,
      timestamp: Date.now(),
      ttl
    };
    this.set(`cache.${key}` as keyof StoreSchema, cacheData);
  }

  isCacheValid(key: string): boolean {
    const cacheData = this.getCacheItem<any>(key);
    if (!cacheData) {
      return false;
    }

    const now = Date.now();
    return (now - cacheData.timestamp) < cacheData.ttl;
  }

  clearCache(key?: string) {
    if (key) {
      this.delete(`cache.${key}` as keyof StoreSchema);
    } else {
      // Clear all cache entries
      const keys = Object.keys(this.store.store);
      keys.forEach(k => {
        if (k.startsWith('cache.')) {
          this.delete(k as keyof StoreSchema);
        }
      });
    }
  }

  // Data management
  exportData(): StoreSchema {
    return this.store.store;
  }

  importData(data: Partial<StoreSchema>): void {
    Object.entries(data).forEach(([key, value]) => {
      this.set(key as keyof StoreSchema, value as any);
    });
  }

  resetSettings(): void {
    this.delete('settings');
  }

  resetAll(): void {
    this.clear();
  }
}