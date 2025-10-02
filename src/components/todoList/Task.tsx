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
  dueDate?: string | null
};

const Task = ({ id, name, projectId, completed, dueDate }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDueDate, setEditedDueDate] = useState(dueDate || '');
  const [updateTask] = useUpdateTaskMutation();
  const [removeTask] = useRemoveTaskMutation();

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

  const dueDateClass = isOverdue(dueDate) ? 'overdue' : isDueSoon(dueDate) ? 'due-soon' : '';

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
          {dueDate && (
            <span className={`due-date-label ${dueDateClass}`}>
              {isOverdue(dueDate) && '⚠️ '}
              {isDueSoon(dueDate) && '⏰ '}
              {formatDate(dueDate)}
            </span>
          )}
        </div>
      </div>
      <button
        className="btn-close"
        type="button"
        aria-label="Delete task"
        onClick={() => removeTask(+id)}
      />
    </div>
  );
};

export default Task;
