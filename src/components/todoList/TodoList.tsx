import React from 'react';
import { useGetProjectsQuery } from './services/apiSlice';
import NewProjectForm from './NewProjectForm';
import { Navigate, Link } from 'react-router-dom';
import {useDispatch, useSelector} from "react-redux";
import {setToken} from "./features/authSlice";
import {RootState} from "../../store";
import SortableProjectList from './SortableProjectList';



const TodoList = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const {
    data: { projects } = { projects: [] },
    error,
    isLoading,
  } = useGetProjectsQuery(undefined, { skip: !token });

  const removeToken = () => {
    dispatch(setToken(null));
  }

  // Handle JWT expiration errors
  React.useEffect(() => {
    if (error) {
      const errorMessage = (error as any)?.message || '';
      if (errorMessage.includes('Signature has expired') ||
          errorMessage.includes('jwt expired') ||
          errorMessage.includes('token expired')) {
        // Token has expired, clear it and redirect to login
        dispatch(setToken(null));
      }
    }
  }, [error, dispatch]);

  // Redirect to login if no token
  if (!token) {
    return <Navigate to="/login" />;
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>Oops! Something went wrong</h2>
          <p>We couldn't load your projects. Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="todo-app">
      <header className="app-header">
        <div className="header-content">
          <div className="app-title">
            <h1>✨ My Todo App</h1>
            <p>Stay organized and productive</p>
          </div>
          <div className="user-section">
            <div className="user-info">
              <div className="user-avatar">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="user-details">
                <span className="user-name">{user.firstName} {user.lastName}</span>
                <span className="user-role">Productivity Master</span>
              </div>
            </div>
            <div className="user-actions">
              <Link to="/change-password" className="change-password-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Change Password</span>
              </Link>
              <button className="logout-btn" onClick={() => removeToken()}>
                <span>Logout</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <NewProjectForm />
        <SortableProjectList projects={projects} />
      </main>
    </div>
  );
}

export default TodoList
