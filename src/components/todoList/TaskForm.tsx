import React, { useState } from 'react';
import { useCreateTaskMutation} from "./services/apiSlice";

const TaskForm = ({ projectId }: { projectId: number }) => {
  const [name, setName] = useState('');
  const [createTask] = useCreateTaskMutation();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createTask({ name, projectId: +projectId });
    setName('');
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  return (
    <form className="task-add-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="text-enter"
        value={name}
        onChange={handleChange}
        placeholder="✨ Add a new task..."
      />
      <button className="task-add" type="submit">
        Add Task
      </button>
    </form>
  );
};

export default TaskForm;
