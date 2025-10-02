import React, { useState } from 'react';
import { useCreateTaskMutation} from "./services/apiSlice";

const TaskForm = ({ projectId }: { projectId: number }) => {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [createTask] = useCreateTaskMutation();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createTask({
      name,
      projectId: +projectId,
      dueDate: dueDate || null
    });
    setName('');
    setDueDate('');
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleDueDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDueDate(event.target.value);
  };

  return (
    <form className="task-add-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="text-enter"
        value={name}
        onChange={handleNameChange}
        placeholder="✨ Add a new task..."
      />
      <input
        type="date"
        className="date-enter"
        value={dueDate}
        onChange={handleDueDateChange}
        title="Set due date (optional)"
      />
      <button className="task-add" type="submit">
        Add Task
      </button>
    </form>
  );
};

export default TaskForm;
