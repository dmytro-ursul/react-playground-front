import React, { useState } from 'react';
import {
  useUpdateTaskMutation,
  useRemoveTaskMutation,
} from './services/apiSlice';

type Props = {
  id: string,
  name: string,
  projectId: number,
  completed: boolean
};

const Task = ({ id, name, projectId, completed }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updateTask] = useUpdateTaskMutation();
  const [removeTask] = useRemoveTaskMutation();

  const handleSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const newName = (event.target as HTMLInputElement).value;
    updateTask({id: +id, name: newName, projectId: +projectId, completed});
    setIsEditing(false);
  };

  const toggleCompleted = () => {
    updateTask({id: +id, name, projectId: +projectId, completed: !completed});
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

  return (
    <div className="task-box">
      <input
        type="checkbox"
        checked={completed}
        onChange={toggleCompleted}
        className="task-checkbox"
        aria-label={`Mark task "${name}" as ${completed ? 'incomplete' : 'complete'}`}
      />
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
