import React from 'react';
import { useOnlineStatus, usePendingMutationsCount, useSyncingStatus } from '../hooks/useOnlineStatus';

const NetworkStatusIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const pendingCount = usePendingMutationsCount();
  const isSyncing = useSyncingStatus();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className={`network-status ${isOnline ? 'online' : 'offline'}`}>
      <div className="network-status-content">
        {!isOnline ? (
          <>
            <span className="status-icon">📴</span>
            <span className="status-text">Offline Mode</span>
            {pendingCount > 0 && (
              <span className="pending-badge">{pendingCount} pending</span>
            )}
          </>
        ) : isSyncing ? (
          <>
            <span className="status-icon">🔄</span>
            <span className="status-text">Syncing {pendingCount} {pendingCount === 1 ? 'change' : 'changes'}...</span>
          </>
        ) : (
          <>
            <span className="status-icon">⚠️</span>
            <span className="status-text">{pendingCount} {pendingCount === 1 ? 'change' : 'changes'} pending</span>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkStatusIndicator;
