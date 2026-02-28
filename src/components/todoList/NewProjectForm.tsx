import React, { useState } from 'react';
import { useCreateProjectMutation } from './services/apiSlice';

type Props = {
  onProjectCreated?: () => void;
};

const NewProjectForm = ({ onProjectCreated }: Props) => {
  const [name, setName] = useState('');
  const [createProject] = useCreateProjectMutation();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = createProject(name);
    if (result && typeof result === 'object' && 'unwrap' in result && typeof result.unwrap === 'function') {
      await result.unwrap();
    }
    onProjectCreated?.();
    setName('');
  };

  return (
    <div className="new-project-section">
      <h2 className="section-title">🚀 Create New Project</h2>
      <form onSubmit={handleSubmit} className="new-project-form">
        <div className="form-container">
          <input
            type="text"
            value={name}
            onChange={handleChange}
            placeholder="Enter your project name..."
            className="project-input"
            required
          />
          <button type="submit" className="create-project-btn">
            <span>Create Project</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewProjectForm;
