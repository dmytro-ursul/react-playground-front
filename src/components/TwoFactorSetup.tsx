import React, { useState, useEffect } from 'react';
import { 
  useSetupTwoFactorMutation, 
  useEnableTwoFactorMutation,
  useDisableTwoFactorMutation,
  useGetCurrentUserQuery
} from './todoList/services/apiSlice';
import '../styles/app.scss';

interface TwoFactorSetupProps {
  onClose: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onClose }) => {
  const [step, setStep] = useState<'loading' | 'setup' | 'verify' | 'disable'>('loading');
  const [qrCodeSvg, setQrCodeSvg] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: userData, refetch: refetchUser } = useGetCurrentUserQuery();
  const [setupTwoFactor] = useSetupTwoFactorMutation();
  const [enableTwoFactor] = useEnableTwoFactorMutation();
  const [disableTwoFactor] = useDisableTwoFactorMutation();

  const isEnabled = userData?.currentUser?.otpEnabled ?? false;

  const initSetup = async () => {
    try {
      setStep('loading');
      const { setupTwoFactor: result } = await setupTwoFactor().unwrap();
      setQrCodeSvg(result.qrCodeSvg);
      setSecret(result.secret);
      setStep('setup');
    } catch (err: any) {
      console.error('Failed to setup 2FA:', err);
      setError(err?.message || 'Failed to setup 2FA');
      setStep('setup');
    }
  };

  useEffect(() => {
    if (isEnabled) {
      setStep('disable');
    } else {
      initSetup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled]);

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await enableTwoFactor({ code }).unwrap();
      setSuccess('Two-factor authentication has been enabled!');
      await refetchUser();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to enable 2FA:', err);
      setError(err?.message || 'Invalid verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await disableTwoFactor({ password, code }).unwrap();
      setSuccess('Two-factor authentication has been disabled.');
      await refetchUser();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to disable 2FA:', err);
      setError(err?.message || 'Failed to disable 2FA');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setSuccess('Secret copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (step === 'loading') {
    return (
      <div className="two-factor-setup-modal">
        <div className="two-factor-setup-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Setting up two-factor authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'disable') {
    return (
      <div className="two-factor-setup-modal">
        <div className="two-factor-setup-content">
          <div className="two-factor-setup-header">
            <h2>Disable Two-Factor Authentication</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>

          <div className="two-factor-status enabled">
            <span className="status-icon">🔒</span>
            <span>Two-factor authentication is currently <strong>enabled</strong></span>
          </div>

          {error && <div className="error-message error-auth"><span>{error}</span></div>}
          {success && <div className="success-message"><span>{success}</span></div>}

          <form onSubmit={handleDisable}>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter your password"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="disable-code">Verification Code</label>
              <input
                id="disable-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                placeholder="Enter 6-digit code"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="two-factor-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-danger" disabled={isSubmitting}>
                {isSubmitting ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="two-factor-setup-modal">
      <div className="two-factor-setup-content">
        <div className="two-factor-setup-header">
          <h2>Set Up Two-Factor Authentication</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="two-factor-status disabled">
          <span className="status-icon">🔓</span>
          <span>Two-factor authentication is currently <strong>disabled</strong></span>
        </div>

        {error && <div className="error-message error-auth"><span>{error}</span></div>}
        {success && <div className="success-message"><span>{success}</span></div>}

        <div className="setup-instructions">
          <h3>Step 1: Scan QR Code</h3>
          <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)</p>
          
          <div className="qr-code-container" dangerouslySetInnerHTML={{ __html: qrCodeSvg }} />

          <div className="manual-entry">
            <p>Can't scan? Enter this code manually:</p>
            <div className="secret-code">
              <code>{secret}</code>
              <button type="button" className="btn-copy" onClick={copySecret} title="Copy to clipboard">
                📋
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleEnable}>
          <div className="form-group">
            <h3>Step 2: Verify</h3>
            <label htmlFor="verify-code">Enter the 6-digit code from your app:</label>
            <input
              id="verify-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
              placeholder="000000"
              disabled={isSubmitting}
              className="verification-input"
              autoComplete="one-time-code"
              required
            />
          </div>

          <div className="two-factor-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || code.length !== 6}>
              {isSubmitting ? 'Enabling...' : 'Enable 2FA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorSetup;
