import React, { useEffect, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import '../styles/notificationPrompt.scss';

const NotificationPrompt: React.FC = () => {
  const { isSupported, isConfigured, notificationPermission, error, requestPermission } = useNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check localStorage to see if user has already dismissed the prompt
    const wasDismissed = localStorage.getItem('notificationPromptDismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Show prompt if notifications are supported and permission not yet granted
    if (isSupported && isConfigured && notificationPermission === 'default') {
      // Show after 3 seconds to not be intrusive
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isConfigured, isSupported, notificationPermission]);

  if (!showPrompt || dismissed || !isSupported || !isConfigured) {
    return null;
  }

  const handleAllow = async () => {
    setLoading(true);
    const granted = await requestPermission();
    setLoading(false);
    if (granted) {
      setShowPrompt(false);
      localStorage.setItem('notificationPromptDismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notificationPromptDismissed', 'true');
  };

  return (
    <div className="notification-prompt">
      <div className="notification-prompt-content">
        <div className="notification-prompt-icon">🔔</div>
        <div className="notification-prompt-text">
          <h3>Stay Updated!</h3>
          <p>Get due-date reminders even when the app is closed</p>
          {error && <p className="notification-prompt-error">{error}</p>}
        </div>
        <div className="notification-prompt-actions">
          <button 
            className="notification-prompt-allow"
            onClick={handleAllow}
            disabled={loading}
          >
            {loading ? 'Enabling…' : 'Allow'}
          </button>
          <button 
            className="notification-prompt-dismiss"
            onClick={handleDismiss}
            disabled={loading}
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;
