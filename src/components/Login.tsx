import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setToken, setUser } from './todoList/features/authSlice';
import { Navigate } from "react-router-dom";
import { useLoginMutation } from "./todoList/services/apiSlice";
import { RootState } from '../store';
import '../styles/app.scss';

// Helper function to extract user-friendly error messages
const getErrorMessage = (error: any): string => {
  // First check if error.message contains the actual error (RTK Query wraps it this way)
  if (error?.message) {
    const message = error.message;

    // Extract the actual error message (before the colon and request details)
    const actualMessage = message.split(':')[0].trim();

    // Account lockout messages - return as-is
    if (actualMessage.includes('Account is locked')) {
      return actualMessage;
    }

    // Attempt warning messages - return as-is
    if (actualMessage.includes('attempt') && actualMessage.includes('remaining')) {
      return actualMessage;
    }

    // Invalid credentials - return as-is to preserve any warnings
    if (actualMessage.includes('Invalid username or password')) {
      return actualMessage;
    }
  }

  // Handle GraphQL errors in data.errors format
  if (error?.data?.errors && Array.isArray(error.data.errors)) {
    const graphqlError = error.data.errors[0];
    if (graphqlError?.message) {
      const message = graphqlError.message;

      // Account lockout messages - return as-is
      if (message.includes('Account is locked')) {
        return message;
      }

      // Attempt warning messages - return as-is
      if (message.includes('attempt') && message.includes('remaining')) {
        return message;
      }

      if (message.includes('Invalid username or password')) {
        return message;
      }
      if (message.includes('Cannot return null for non-nullable field')) {
        return 'Invalid username or password. Please try again.';
      }
      if (message.includes('User not found')) {
        return 'User not found. Please check your username.';
      }
      if (message.includes('Authentication failed')) {
        return 'Authentication failed. Please check your credentials.';
      }

      // Return the original message if it's already user-friendly
      return message;
    }
  }

  // Handle single error object
  if (error?.data?.error) {
    return error.data.error;
  }

  // Handle network and other errors
  if (error?.message) {
    const message = error.message.toLowerCase();

    if (message.includes('fetch') || message.includes('networkerror') || message.includes('failed to fetch')) {
      return 'Unable to connect to server. Please check your internet connection.';
    }

    if (message.includes('invalid username or password') ||
        message.includes('cannot return null') ||
        message.includes('authentication failed')) {
      return 'Invalid username or password. Please try again.';
    }

    if (message.includes('user not found')) {
      return 'User not found. Please check your username.';
    }

    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    if (message.includes('cors')) {
      return 'Connection error. Please try again later.';
    }

    if (message.includes('500') || message.includes('internal server error')) {
      return 'Server error. Please try again later.';
    }

    if (message.includes('404') || message.includes('not found')) {
      return 'Service not found. Please contact support.';
    }

    // For other specific error messages, return them if they're user-friendly
    if (error.message.length < 100 &&
        !message.includes('graphql') &&
        !message.includes('json') &&
        !message.includes('object') &&
        !message.includes('undefined') &&
        !message.includes('null')) {
      return error.message;
    }
  }

  // Handle string errors
  if (typeof error === 'string' && error.length < 100) {
    return error;
  }

  // Fallback for any unhandled error types
  return 'Login failed. Please check your credentials and try again.';
};

const Login: React.FC = () => {
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'auth' | 'network' | 'server' | 'validation'>('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });
  const [login] = useLoginMutation();
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const submitButtonRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (submitButtonRef.current) {
      submitButtonRef.current.focus();
    }
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!username.trim()) {
      setError('Please enter your username');
      setErrorType('validation');
      setTouched({ ...touched, username: true });
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      setErrorType('validation');
      setTouched({ ...touched, password: true });
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { signIn: { token, user} } = await login({ username, password }).unwrap();
      setIsSuccess(true);
      dispatch(setToken(token));
      dispatch(setUser(user));
    } catch (err: any) {
      console.error('Login failed:', err);

      // Use helper function to get user-friendly error message
      const userMessage = getErrorMessage(err);
      setError(userMessage);

      // Set error type for styling
      if (userMessage.includes('connection') || userMessage.includes('network') || userMessage.includes('internet')) {
        setErrorType('network');
      } else if (userMessage.includes('server') || userMessage.includes('500') || userMessage.includes('timeout')) {
        setErrorType('server');
      } else {
        setErrorType('auth');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      { token ? <Navigate to="/" /> : null }
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Welcome Back</h2>

        {error && (
          <div className={`error-message error-${errorType}`}>
            {errorType === 'network' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.36 2.64"/>
                <path d="M21 3l-6 6"/>
                <path d="M21 9h-6"/>
                <path d="M15 3v6"/>
              </svg>
            ) : errorType === 'server' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
                <path d="M6 11h12"/>
                <path d="M6 7h8"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            )}
            <span>{error}</span>
          </div>
        )}

        {isSuccess && (
          <div className="success-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            <span>Login successful! Redirecting...</span>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            name="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => {
              setUserName(e.target.value);
              setError(''); // Clear error when user starts typing
              setErrorType('auth');
            }}
            onBlur={() => setTouched({ ...touched, username: true })}
            className={touched.username && !username.trim() ? 'error' : ''}
            required
            disabled={isLoading}
          />
          {touched.username && !username.trim() && (
            <span className="field-error">Username is required</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(''); // Clear error when user starts typing
              setErrorType('auth');
            }}
            onBlur={() => setTouched({ ...touched, password: true })}
            className={touched.password && !password.trim() ? 'error' : ''}
            required
            disabled={isLoading}
          />
          {touched.password && !password.trim() && (
            <span className="field-error">Password is required</span>
          )}
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="loading-spinner-small"></div>
              <span>Signing In...</span>
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  );
}

export default Login;
