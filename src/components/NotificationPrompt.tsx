import React, { useEffect, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import '../styles/notificationPrompt.scss';

const NotificationPrompt: React.FC = () => {
  const { isSupported, notificationPermission, requestPermission } = useNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check localStorage to see if user has already dismissed the prompt
    const wasDismissed = localStorage.getItem('notificationPromptDismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Show prompt if notifications are supported and permission not yet granted
    if (isSupported && notificationPermission === 'default') {
      // Show after 3 seconds to not be intrusive
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, notificationPermission]);

  if (!showPrompt || dismissed || !isSupported) {
    return null;
  }

  const handleAllow = async () => {
    const granted = await requestPermission();
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
          <p>Get notified when tasks are due today</p>
        </div>
        <div className="notification-prompt-actions">
          <button 
            className="notification-prompt-allow"
            onClick={handleAllow}
          >
            Allow
          </button>
          <button 
            className="notification-prompt-dismiss"
            onClick={handleDismiss}
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;
