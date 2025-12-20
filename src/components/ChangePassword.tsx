import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { request } from 'graphql-request';
import AppSettings from '../settings';
import { CHANGE_PASSWORD } from './todoList/queries/auth';
import { RootState } from '../store';
import '../styles/changePassword.scss';

interface ChangePasswordResponse {
  changePassword: {
    user: {
      id: string;
      username: string;
      email: string;
    };
    message: string;
  };
}

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);

  // Password strength validation
  const validatePasswordStrength = (password: string) => {
    const minLength = password.length >= 8;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&_\-.+=]/.test(password);

    return {
      isValid: minLength && hasLowercase && hasUppercase && hasDigit && hasSpecialChar,
      minLength,
      hasLowercase,
      hasUppercase,
      hasDigit,
      hasSpecialChar
    };
  };

  const passwordStrength = validatePasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (!currentPassword || !newPassword || !newPasswordConfirmation) {
      console.log('Validation failed: missing fields');
      setError('All fields are required');
      return;
    }

    if (newPassword !== newPasswordConfirmation) {
      console.log('Validation failed: passwords do not match');
      setError('New password and confirmation do not match');
      return;
    }

    if (!passwordStrength.isValid) {
      console.log('Validation failed: weak password');
      setError('Password does not meet strength requirements');
      return;
    }

    setLoading(true);

    try {
      console.log('Token:', token ? 'exists' : 'missing');

      if (!token) {
        setError('You must be logged in to change password');
        navigate('/login');
        return;
      }

      console.log('Making API request to:', AppSettings.apiUrl);
      const response = await request<ChangePasswordResponse>(
        AppSettings.apiUrl,
        CHANGE_PASSWORD,
        {
          currentPassword,
          newPassword,
          newPasswordConfirmation
        },
        {
          Authorization: `Bearer ${token}`
        }
      );

      console.log('Password change successful:', response);
      setSuccess(response.changePassword.message);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.response?.errors?.[0]?.message || err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-card">
        <h2>Change Password</h2>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPasswordConfirmation">Confirm New Password</label>
            <input
              type="password"
              id="newPasswordConfirmation"
              value={newPasswordConfirmation}
              onChange={(e) => setNewPasswordConfirmation(e.target.value)}
              placeholder="Confirm new password"
              disabled={loading}
            />
          </div>

          {newPassword && (
            <div className="password-requirements">
              <h4>Password Requirements:</h4>
              <ul>
                <li className={passwordStrength.minLength ? 'valid' : 'invalid'}>
                  {passwordStrength.minLength ? '✓' : '✗'} At least 8 characters
                </li>
                <li className={passwordStrength.hasLowercase ? 'valid' : 'invalid'}>
                  {passwordStrength.hasLowercase ? '✓' : '✗'} One lowercase letter
                </li>
                <li className={passwordStrength.hasUppercase ? 'valid' : 'invalid'}>
                  {passwordStrength.hasUppercase ? '✓' : '✗'} One uppercase letter
                </li>
                <li className={passwordStrength.hasDigit ? 'valid' : 'invalid'}>
                  {passwordStrength.hasDigit ? '✓' : '✗'} One digit
                </li>
                <li className={passwordStrength.hasSpecialChar ? 'valid' : 'invalid'}>
                  {passwordStrength.hasSpecialChar ? '✓' : '✗'} One special character (@$!%*?&_-.+=)
                </li>
              </ul>
            </div>
          )}

          <div className="button-group">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || (newPassword.length > 0 && !passwordStrength.isValid)}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;

