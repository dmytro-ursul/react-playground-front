import React from 'react';

interface EmptyStateProps {
  type: 'projects' | 'tasks';
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction }) => {
  const config = {
    projects: {
      icon: '📋',
      title: 'No projects yet',
      description: 'Create your first project to start organizing your tasks',
      actionText: 'Create Project',
    },
    tasks: {
      icon: '✨',
      title: 'All done!',
      description: 'No tasks in this project. Add one to get started!',
      actionText: 'Add Task',
    },
  };

  const { icon, title, description, actionText } = config[type];

  return (
    <div className="empty-state">
      <div className="empty-state-illustration">
        <span style={{ fontSize: '80px' }}>{icon}</span>
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {onAction && (
        <button className="empty-state-btn" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
