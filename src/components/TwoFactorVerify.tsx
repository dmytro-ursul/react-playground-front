import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setToken, setUser } from './todoList/features/authSlice';
import { useVerifyTwoFactorMutation } from './todoList/services/apiSlice';
import '../styles/app.scss';

interface TwoFactorVerifyProps {
  tempToken: string;
  onBack: () => void;
}

const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({ tempToken, onBack }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verifyTwoFactor] = useVerifyTwoFactorMutation();
  const dispatch = useDispatch();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleSubmit(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
      setCode(newCode);
      if (pastedData.length === 6) {
        handleSubmit(pastedData);
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const handleSubmit = async (fullCode?: string) => {
    const codeToVerify = fullCode || code.join('');
    
    if (codeToVerify.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { verifyTwoFactor: result } = await verifyTwoFactor({
        tempToken,
        code: codeToVerify,
      }).unwrap();

      dispatch(setToken(result.token));
      dispatch(setUser(result.user));
    } catch (err: any) {
      console.error('2FA verification failed:', err);
      setError(err?.message || 'Invalid verification code. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form two-factor-form">
        <div className="two-factor-header">
          <button 
            type="button" 
            className="back-button" 
            onClick={onBack}
            disabled={isLoading}
          >
            ← Back
          </button>
          <h2>Two-Factor Authentication</h2>
        </div>
        
        <p className="two-factor-description">
          Enter the 6-digit code from your authenticator app
        </p>

        {error && (
          <div className="error-message error-auth">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="code-inputs" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading}
              className="code-input"
              autoComplete="one-time-code"
            />
          ))}
        </div>

        <button 
          type="button" 
          onClick={() => handleSubmit()}
          disabled={isLoading || code.join('').length !== 6}
          className="verify-button"
        >
          {isLoading ? (
            <>
              <div className="loading-spinner-small"></div>
              <span>Verifying...</span>
            </>
          ) : (
            'Verify'
          )}
        </button>

        <p className="two-factor-help">
          Open your authenticator app (Google Authenticator, Authy, etc.) 
          to view your verification code.
        </p>
      </div>
    </div>
  );
};

export default TwoFactorVerify;
