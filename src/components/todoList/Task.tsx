import React, { useState } from 'react';
import {
  useUpdateTaskMutation,
  useRemoveTaskMutation,
} from './services/apiSlice';

type Props = {
  id: string,
  name: string,
  projectId: number,
  completed: boolean,
  dueDate?: string | null,
  projects: Array<{ id: number; name: string }>
};

const Task = ({ id, name, projectId, completed, dueDate, projects }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDueDate, setEditedDueDate] = useState(dueDate || '');
  const [showMenu, setShowMenu] = useState(false);
  const [updateTask] = useUpdateTaskMutation();
  const [removeTask] = useRemoveTaskMutation();
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Removed debug logging
  }, [id, name, dueDate, editedDueDate]);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log('Click outside check:', {
        target: (event.target as HTMLElement).className,
        inMenu: menuRef.current?.contains(event.target as Node),
        showMenu,
      });
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        console.log('Closing menu - click was outside');
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const newName = (event.target as HTMLInputElement).value;
    updateTask({id: +id, name: newName, projectId: +projectId, completed, dueDate: editedDueDate || null});
    setIsEditing(false);
  };

  const toggleCompleted = () => {
    updateTask({id: +id, name, projectId: +projectId, completed: !completed, dueDate: dueDate || null});
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDueDate = e.target.value;
    setEditedDueDate(newDueDate);
    updateTask({id: +id, name, projectId: +projectId, completed, dueDate: newDueDate || null});
  };

  // Helper to format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper to check if task is overdue
  const isOverdue = (dateString: string | null | undefined) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateString);
    return due < today && !completed;
  };

  // Helper to check if task is due soon (within 3 days)
  const isDueSoon = (dateString: string | null | undefined) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateString);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    return due >= today && due <= threeDaysFromNow && !completed;
  };

  const editTask = () => {
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    } else if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const dueDateClass = isOverdue(dueDate || editedDueDate) ? 'overdue' : isDueSoon(dueDate || editedDueDate) ? 'due-soon' : '';

  return (
    <div className={`task-box ${dueDateClass}`}>
      <input
        type="checkbox"
        checked={completed}
        onChange={toggleCompleted}
        className="task-checkbox"
        aria-label={`Mark task "${name}" as ${completed ? 'incomplete' : 'complete'}`}
      />
      <div className="task-content">
        {isEditing ? (
          <form>
            <input
              className="editTask"
              autoFocus
              defaultValue={name}
              onKeyDown={handleKeyDown}
            />
          </form>
        ) : (
          <p className={`task ${completed ? 'completed' : ''}`} onClick={editTask}>
            {name}
          </p>
        )}
        <div className="task-meta">
          <input
            type="date"
            value={editedDueDate}
            onChange={handleDueDateChange}
            className="task-due-date"
            title="Set due date"
          />
          {(dueDate || editedDueDate) && (
            <div className="due-date-display">
              <span className={`due-date-label ${dueDateClass}`}>
                {isOverdue(dueDate || editedDueDate) && '⚠️ '}
                {isDueSoon(dueDate || editedDueDate) && '⏰ '}
                {formatDate(dueDate || editedDueDate)}
              </span>
              <button
                className="btn-remove-due-date"
                type="button"
                title="Remove due date"
                onClick={() => {
                  setEditedDueDate('');
                  updateTask({id: +id, name, projectId: +projectId, completed, dueDate: null});
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
      <div 
        className="task-actions" 
        ref={menuRef} 
        style={{ position: 'relative' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          className="btn-menu"
          type="button"
          title="More actions"
          onClick={() => {
            console.log('Menu clicked, showMenu:', showMenu);
            setShowMenu(!showMenu);
          }}
        >
          ⋯
        </button>
        {showMenu && (
          <div className="dropdown-menu" data-testid="dropdown-menu">
            <button
              className="dropdown-item"
              onClick={() => {
                removeTask(+id);
                setShowMenu(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              🗑️ Delete
            </button>
            {projects.filter(p => p.id !== projectId).length > 0 ? (
              <div>
                <div className="dropdown-divider">Move to:</div>
                {projects.filter(p => p.id !== projectId).map(project => (
                  <button
                    key={project.id}
                    className="dropdown-item dropdown-project"
                    onClick={() => {
                      updateTask({id: +id, name, projectId: project.id, completed, dueDate: dueDate || null});
                      setShowMenu(false);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    📋 {project.name}
                  </button>
                ))}
              </div>
            ) : (
              <button
                className="dropdown-item"
                disabled
                onMouseDown={(e) => e.stopPropagation()}
              >
                📋 No other projects
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Task;
