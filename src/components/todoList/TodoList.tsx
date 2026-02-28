import React, { useMemo } from 'react';
import { useGetProjectsQuery } from './services/apiSlice';
import NewProjectForm from './NewProjectForm';
import NotificationPrompt from '../NotificationPrompt';
import { Link, useNavigate } from 'react-router-dom';
import {useDispatch, useSelector} from "react-redux";
import {setToken} from "./features/authSlice";
import {RootState} from "../../store";
import SortableProjectList from './SortableProjectList';
import FloatingActionButton from './FloatingActionButton';
import BottomNav from './BottomNav';
import MobileTaskModal from './MobileTaskModal';
import EmptyState from './EmptyState';
import { useNotifications } from '../../hooks/useNotifications';


const TodoList = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sendNotification } = useNotifications();
  const {
    data,
    error,
    isLoading,
  } = useGetProjectsQuery(undefined, { skip: !token });
  
  const projects = useMemo(() => data?.projects || [], [data?.projects]);

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mobileTaskModalOpen, setMobileTaskModalOpen] = React.useState(false);
  const [notifiedTaskIds, setNotifiedTaskIds] = React.useState<Set<string>>(new Set());
  const [isNewProjectSectionOpen, setIsNewProjectSectionOpen] = React.useState(false);
  const [hideCompletedTasks, setHideCompletedTasks] = React.useState(() => {
    try {
      return localStorage.getItem('todo:hideCompletedTasks') === 'true';
    } catch {
      return false;
    }
  });

  const removeToken = () => {
    dispatch(setToken(null));
  }

  // Check for tasks due today and send notifications
  React.useEffect(() => {
    if (!projects || projects.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    projects.forEach((project: any) => {
      if (!project.tasks) return;

      project.tasks.forEach((task: any) => {
        if (!task.dueDate || task.completed) return;

        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);

        // Check if task is due today and hasn't been notified yet
        if (taskDate.getTime() === today.getTime() && !notifiedTaskIds.has(task.id)) {
          sendNotification(`Task Due Today: ${task.name}`, {
            body: `Project: ${project.name}`,
            tag: `task-${task.id}`,
            requireInteraction: false,
          });

          // Mark this task as notified
          setNotifiedTaskIds(prev => new Set([...prev, task.id]));
        }
      });
    });
  }, [projects, sendNotification, notifiedTaskIds]);

  // Handle JWT expiration, authorization errors, and logout redirect
  React.useEffect(() => {
    // If no token, redirect to login (logout or token cleared)
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // Handle authorization errors
    if (error) {
      const errorMessage = (error as any)?.message || '';
      
      if (errorMessage.includes('Unauthorized') ||
          errorMessage.includes('Signature has expired') ||
          errorMessage.includes('jwt expired') ||
          errorMessage.includes('token expired') ||
          errorMessage.includes('Token has expired') ||
          errorMessage.includes('Invalid token')) {
        console.log('Clearing token and navigating to login');
        dispatch(setToken(null));
        // Will redirect in next render due to !token check above
      }
    }
  }, [token, error, dispatch, navigate]);

  React.useEffect(() => {
    try {
      localStorage.setItem('todo:hideCompletedTasks', String(hideCompletedTasks));
    } catch {
      // Ignore storage errors (private mode / disabled storage).
    }
  }, [hideCompletedTasks]);

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
      <button 
        className="mobile-menu-btn" 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <header className={`app-header ${mobileMenuOpen ? 'mobile-open' : ''}`}>
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
        <button
          type="button"
          className={`new-project-toggle-btn ${isNewProjectSectionOpen ? 'expanded' : ''}`}
          aria-label={isNewProjectSectionOpen ? 'Collapse new project form' : 'Expand new project form'}
          onClick={() => setIsNewProjectSectionOpen((prev) => !prev)}
        >
          <span>New project</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>
        <div className={`new-project-collapsible ${isNewProjectSectionOpen ? 'expanded' : 'collapsed'}`}>
          <NewProjectForm onProjectCreated={() => setIsNewProjectSectionOpen(false)} />
        </div>
        <div className="task-visibility-controls">
          <label className="hide-completed-toggle">
            <input
              type="checkbox"
              checked={hideCompletedTasks}
              onChange={(e) => setHideCompletedTasks(e.target.checked)}
            />
            <span>Hide completed tasks</span>
          </label>
        </div>
        {projects.length === 0 ? (
          <EmptyState type="projects" />
        ) : (
          <SortableProjectList projects={projects} hideCompleted={hideCompletedTasks} />
        )}
      </main>

      {/* Mobile-only components */}
      <FloatingActionButton 
        onClick={() => setMobileTaskModalOpen(true)} 
        isOpen={mobileTaskModalOpen}
      />
      <BottomNav onAddClick={() => setMobileTaskModalOpen(true)} />
      <MobileTaskModal
        isOpen={mobileTaskModalOpen}
        onClose={() => setMobileTaskModalOpen(false)}
        projects={projects.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name }))}
        defaultProjectId={projects[0]?.id}
      />
      <NotificationPrompt />
    </div>
  );
}

export default TodoList
