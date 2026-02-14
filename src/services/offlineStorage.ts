// IndexedDB database for offline storage
const DB_NAME = 'todo-offline-db';
const DB_VERSION = 1;

interface OfflineMutation {
  id: string;
  type: 'createTask' | 'updateTask' | 'removeTask' | 'createProject' | 'updateProject' | 'removeProject';
  payload: any;
  timestamp: number;
}

interface CachedData {
  key: string;
  data: any;
  timestamp: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<IDBDatabase> | null = null;
  private isAvailable: boolean = typeof indexedDB !== 'undefined';

  constructor() {
    if (this.isAvailable) {
      this.dbReady = this.initDB();
    }
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable) {
        reject(new Error('IndexedDB not available'));
        return;
      }
      
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store for pending mutations
        if (!db.objectStoreNames.contains('mutations')) {
          db.createObjectStore('mutations', { keyPath: 'id' });
        }
        
        // Store for cached data
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
        
        // Store for projects data (offline viewing)
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
      };
    });
  }

  async addMutation(mutation: Omit<OfflineMutation, 'id' | 'timestamp'>): Promise<string> {
    if (!this.isAvailable || !this.dbReady) {
      return '';
    }
    
    const db = await this.dbReady;
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const record: OfflineMutation = {
      ...mutation,
      id,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('mutations', 'readwrite');
      const store = tx.objectStore('mutations');
      const request = store.add(record);
      
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getMutations(): Promise<OfflineMutation[]> {
    if (!this.isAvailable || !this.dbReady) {
      return [];
    }
    
    const db = await this.dbReady;
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mutations', 'readonly');
      const store = tx.objectStore('mutations');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeMutation(id: string): Promise<void> {
    if (!this.isAvailable || !this.dbReady) {
      return;
    }
    
    const db = await this.dbReady;
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mutations', 'readwrite');
      const store = tx.objectStore('mutations');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateMutation(id: string, updates: Partial<OfflineMutation>): Promise<void> {
    if (!this.isAvailable || !this.dbReady) {
      return;
    }

    const db = await this.dbReady;

    return new Promise((resolve, reject) => {
      const tx = db.transaction('mutations', 'readwrite');
      const store = tx.objectStore('mutations');
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const existing = getReq.result as OfflineMutation | undefined;
        if (!existing) {
          resolve();
          return;
        }

        const updated: OfflineMutation = {
          ...existing,
          ...updates,
          id: existing.id,
          timestamp: existing.timestamp,
        };

        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  }

  async clearMutations(): Promise<void> {
    if (!this.isAvailable || !this.dbReady) {
      return;
    }
    
    const db = await this.dbReady;
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mutations', 'readwrite');
      const store = tx.objectStore('mutations');
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async cacheData(key: string, data: any): Promise<void> {
    if (!this.isAvailable || !this.dbReady) {
      return;
    }
    
    const db = await this.dbReady;
    const record: CachedData = {
      key,
      data,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readwrite');
      const store = tx.objectStore('cache');
      const request = store.put(record);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    if (!this.isAvailable || !this.dbReady) {
      return null;
    }
    
    const db = await this.dbReady;
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cache', 'readonly');
      const store = tx.objectStore('cache');
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result as CachedData | undefined;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveProjects(projects: any[]): Promise<void> {
    if (!this.isAvailable || !this.dbReady) {
      return;
    }
    
    const db = await this.dbReady;
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('projects', 'readwrite');
      const store = tx.objectStore('projects');
      
      // Clear existing and add new
      store.clear();
      projects.forEach((project) => {
        store.put(project);
      });
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getProjects(): Promise<any[]> {
    if (!this.isAvailable || !this.dbReady) {
      return [];
    }
    
    const db = await this.dbReady;
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('projects', 'readonly');
      const store = tx.objectStore('projects');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
export type { OfflineMutation };
