import { offlineStorage, OfflineMutation } from './offlineStorage';

type MutationExecutor = (mutation: OfflineMutation) => Promise<void>;

class OfflineSyncService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private pendingCountListeners: Set<(count: number) => void> = new Set();
  private mutationExecutors: Map<string, MutationExecutor> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
      this.setupServiceWorkerListener();
    }
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('📶 Network: Online');
      this.isOnline = true;
      this.notifyListeners();
      this.syncPendingMutations();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Network: Offline');
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  private setupServiceWorkerListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_OFFLINE_MUTATIONS') {
          this.syncPendingMutations();
        }
      });
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.isOnline));
  }

  private async notifyPendingCountListeners() {
    const mutations = await offlineStorage.getMutations();
    this.pendingCountListeners.forEach((listener) => listener(mutations.length));
  }

  // Register mutation executors for each mutation type
  registerMutationExecutor(type: string, executor: MutationExecutor) {
    this.mutationExecutors.set(type, executor);
  }

  // Check online status
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Subscribe to online status changes
  subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Subscribe to pending mutations count changes
  subscribeToPendingCount(listener: (count: number) => void): () => void {
    this.pendingCountListeners.add(listener);
    this.notifyPendingCountListeners(); // Initial call
    return () => this.pendingCountListeners.delete(listener);
  }

  // Queue a mutation for offline execution
  async queueMutation(
    type: OfflineMutation['type'],
    payload: any
  ): Promise<{ queued: boolean; executed: boolean }> {
    if (this.isOnline) {
      // Try to execute immediately
      return { queued: false, executed: true };
    }

    const tempId = payload?.id != null ? Number(payload.id) : null;
    const isTemp = typeof tempId === 'number' && !Number.isNaN(tempId) && tempId < 0;

    if (isTemp) {
      const mutations = await offlineStorage.getMutations();

      if (type === 'updateTask') {
        const existing = mutations.find(
          (m) => m.type === 'createTask' && m.payload?.clientId === tempId
        );

        if (existing) {
          const updatedPayload = {
            ...existing.payload,
            name: payload.name ?? existing.payload.name,
            projectId: payload.projectId ?? existing.payload.projectId,
            dueDate: payload.dueDate ?? existing.payload.dueDate,
            completed: typeof payload.completed === 'boolean' ? payload.completed : existing.payload.completed,
            position: typeof payload.position === 'number' ? payload.position : existing.payload.position,
          };
          await offlineStorage.updateMutation(existing.id, { payload: updatedPayload });
          await this.notifyPendingCountListeners();
          return { queued: true, executed: false };
        }
      }

      if (type === 'removeTask') {
        const existing = mutations.find(
          (m) => m.type === 'createTask' && m.payload?.clientId === tempId
        );
        if (existing) {
          await offlineStorage.removeMutation(existing.id);
          await this.notifyPendingCountListeners();
          return { queued: true, executed: false };
        }
      }

      if (type === 'updateProject') {
        const existing = mutations.find(
          (m) => m.type === 'createProject' && m.payload?.clientId === tempId
        );
        if (existing) {
          const updatedPayload = {
            ...existing.payload,
            name: payload.name ?? existing.payload.name,
            position: typeof payload.position === 'number' ? payload.position : existing.payload.position,
          };
          await offlineStorage.updateMutation(existing.id, { payload: updatedPayload });
          await this.notifyPendingCountListeners();
          return { queued: true, executed: false };
        }
      }

      if (type === 'removeProject') {
        const existing = mutations.find(
          (m) => m.type === 'createProject' && m.payload?.clientId === tempId
        );
        if (existing) {
          await offlineStorage.removeMutation(existing.id);
          await this.notifyPendingCountListeners();
          return { queued: true, executed: false };
        }
      }
    }

    // Queue for later
    await offlineStorage.addMutation({ type, payload });
    await this.notifyPendingCountListeners();
    
    // Request background sync if available
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      try {
        await (registration as any).sync.register('sync-mutations');
      } catch (err) {
        console.log('Background sync registration failed:', err);
      }
    }

    return { queued: true, executed: false };
  }

  // Sync all pending mutations
  async syncPendingMutations(): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline || this.isSyncing) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const mutations = await offlineStorage.getMutations();
      console.log(`🔄 Syncing ${mutations.length} pending mutations...`);

      // Sort by timestamp to maintain order
      mutations.sort((a, b) => a.timestamp - b.timestamp);

      for (const mutation of mutations) {
        const executor = this.mutationExecutors.get(mutation.type);
        if (!executor) {
          console.warn(`No executor found for mutation type: ${mutation.type}`);
          failed++;
          continue;
        }

        try {
          await executor(mutation);
          await offlineStorage.removeMutation(mutation.id);
          synced++;
          console.log(`✅ Synced mutation: ${mutation.type}`);
        } catch (error) {
          console.error(`❌ Failed to sync mutation: ${mutation.type}`, error);
          failed++;
        }
      }

      await this.notifyPendingCountListeners();
      console.log(`🔄 Sync complete: ${synced} synced, ${failed} failed`);
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed };
  }

  // Get count of pending mutations
  async getPendingCount(): Promise<number> {
    const mutations = await offlineStorage.getMutations();
    return mutations.length;
  }
}

export const offlineSyncService = new OfflineSyncService();
