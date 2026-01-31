import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import { RootState } from '../store';
import { useGetCurrentUserQuery } from './todoList/services/apiSlice';
import TwoFactorSetup from './TwoFactorSetup';
import '../styles/app.scss';

const SecuritySettings: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const { data: userData, isLoading } = useGetCurrentUserQuery(undefined, {
    skip: !token,
  });

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
