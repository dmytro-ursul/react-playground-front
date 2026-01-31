import { useState, useEffect } from 'react';
import { offlineSyncService } from '../services/offlineSyncService';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(offlineSyncService.getOnlineStatus());

  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe(setIsOnline);
    return unsubscribe;
  }, []);

  return isOnline;
}

export function usePendingMutationsCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribeToPendingCount(setCount);
    return unsubscribe;
  }, []);

  return count;
}
