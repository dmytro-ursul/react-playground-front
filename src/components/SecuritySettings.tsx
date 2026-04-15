import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import { RootState } from '../store';
import {
  useGetCurrentUserQuery,
  useGetActiveSessionsQuery,
  useRevokeSessionMutation,
  useLogoutAllMutation,
} from './todoList/services/apiSlice';
import { setToken } from './todoList/features/authSlice';
import TwoFactorSetup from './TwoFactorSetup';
import { useNotifications } from '../hooks/useNotifications';
import '../styles/app.scss';

const parseUserAgent = (ua: string | null): string => {
  if (!ua) return 'Unknown Device';
  if (ua.includes('iPhone') || ua.includes('iPad')) return '📱 iOS Device';
  if (ua.includes('Android')) return '📱 Android Device';
  if (ua.includes('Mac OS')) return '💻 Mac';
  if (ua.includes('Windows')) return '💻 Windows';
  if (ua.includes('Linux')) return '💻 Linux';
  return '🌐 Unknown Device';
};

const formatRelativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const SecuritySettings: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [resubscribing, setResubscribing] = useState(false);
  const { data: userData, isLoading } = useGetCurrentUserQuery(undefined, {
    skip: !token,
  });
  const { data: sessionsData, isLoading: sessionsLoading } = useGetActiveSessionsQuery(undefined, {
    skip: !token,
  });
  const [revokeSession] = useRevokeSessionMutation();
  const [logoutAll] = useLogoutAllMutation();
  const {
    isSupported: notificationsSupported,
    isSubscribed,
    isConfigured: notificationsConfigured,
    notificationPermission,
    resubscribe,
  } = useNotifications();

  if (!token) {
    return <Navigate to="/login" />;
  }

  const user = userData?.currentUser;

  return (
    <div className="security-settings-container">
      <div className="security-settings-content">
        <div className="security-settings-header">
          <Link to="/" className="back-link">← Back to Tasks</Link>
          <h1>Security Settings</h1>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading settings...</p>
          </div>
        ) : (
          <>
            <section className="settings-section">
              <h2>Account Information</h2>
              <div className="info-row">
                <span className="info-label">Username:</span>
                <span className="info-value">{user?.username || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email || 'N/A'}</span>
              </div>
            </section>

            <section className="settings-section">
              <h2>Password</h2>
              <p className="section-description">
                Keep your account secure with a strong password.
              </p>
              <Link to="/change-password" className="btn-action">
                Change Password
              </Link>
            </section>

            <section className="settings-section">
              <h2>Two-Factor Authentication (2FA)</h2>
              <p className="section-description">
                Add an extra layer of security to your account by requiring a verification code from your phone.
              </p>
              
              <div className={`two-factor-status-badge ${user?.otpEnabled ? 'enabled' : 'disabled'}`}>
                {user?.otpEnabled ? (
                  <>🔒 Enabled - Your account is protected with 2FA</>
                ) : (
                  <>🔓 Disabled - Enable 2FA for better security</>
                )}
              </div>

              <button 
                className={`btn-action ${user?.otpEnabled ? 'btn-warning' : 'btn-primary'}`}
                onClick={() => setShowTwoFactorSetup(true)}
              >
                {user?.otpEnabled ? 'Manage 2FA' : 'Enable 2FA'}
              </button>
            </section>

            <section className="settings-section">
              <h2>Notifications</h2>
              {!notificationsSupported ? (
                <p className="section-description">Push notifications are not supported in this browser.</p>
              ) : !notificationsConfigured ? (
                <p className="section-description">Push notifications are not configured on the server.</p>
              ) : notificationPermission === 'denied' ? (
                <p className="section-description">Notifications are blocked. Enable them in your browser/OS settings.</p>
              ) : notificationPermission === 'granted' && isSubscribed ? (
                <div className="two-factor-status-badge enabled">🔔 Notifications enabled</div>
              ) : notificationPermission === 'granted' && !isSubscribed ? (
                <>
                  <div className="two-factor-status-badge disabled">⚠️ Subscription lost — notifications won't be delivered</div>
                  <button
                    className="btn-action btn-primary"
                    disabled={resubscribing}
                    onClick={async () => {
                      setResubscribing(true);
                      await resubscribe();
                      setResubscribing(false);
                    }}
                  >
                    {resubscribing ? 'Re-enabling…' : 'Re-enable Notifications'}
                  </button>
                </>
              ) : (
                <p className="section-description">Open the app and allow notifications when prompted.</p>
              )}
            </section>

            <section className="settings-section">
              <h2>Active Sessions</h2>
              <p className="section-description">
                Manage your active login sessions. Revoke access from devices you don't recognize.
              </p>
              {sessionsLoading ? (
                <p className="section-description">Loading sessions...</p>
              ) : (
                <>
                  <div className="sessions-list">
                    {sessionsData?.activeSessions?.map((session) => (
                      <div key={session.id} className={`session-item ${session.current ? 'current' : ''}`}>
                        <div className="session-info">
                          <div className="session-device">
                            {parseUserAgent(session.userAgent)}
                            {session.current && <span className="current-badge">Current</span>}
                          </div>
                          <div className="session-meta">
                            <span>{session.ipAddress || 'Unknown IP'}</span>
                            <span>Active {formatRelativeTime(session.lastActiveAt)}</span>
                            <span>Created {formatRelativeTime(session.createdAt)}</span>
                          </div>
                        </div>
                        {!session.current && (
                          <button
                            className="btn-action btn-warning btn-small"
                            onClick={async () => {
                              if (window.confirm('Revoke this session?')) {
                                await revokeSession({ sessionId: session.id });
                              }
                            }}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {(sessionsData?.activeSessions?.length ?? 0) > 1 && (
                    <button
                      className="btn-action btn-warning"
                      onClick={async () => {
                        if (window.confirm('Sign out of all other sessions?')) {
                          const result = await logoutAll().unwrap();
                          alert(`${result.logoutAll.revokedCount} session(s) revoked.`);
                        }
                      }}
                    >
                      Sign Out All Other Sessions
                    </button>
                  )}
                </>
              )}
            </section>

            <section className="settings-section">
              <h2>Recommended Apps</h2>
              <p className="section-description">
                You can use any TOTP-compatible authenticator app:
              </p>
              <ul className="app-list">
                <li>Google Authenticator</li>
                <li>Microsoft Authenticator</li>
                <li>Authy</li>
                <li>1Password</li>
                <li>Bitwarden</li>
              </ul>
            </section>
          </>
        )}
      </div>

      {showTwoFactorSetup && (
        <TwoFactorSetup onClose={() => setShowTwoFactorSetup(false)} />
      )}
    </div>
  );
};

export default SecuritySettings;
