import React, { useState } from 'react';
import { useRemoveProjectMutation, useUpdateProjectMutation } from "./services/apiSlice";

type Props = {
  id: number,
  name: string
};

const ProjectHeader = ({ id, name }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [removeProject] = useRemoveProjectMutation();
  const [updateProject] = useUpdateProjectMutation();

  const onSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const newName = (event.target as HTMLInputElement).value;
    updateProject({id: +id, name: newName});
    setIsEditing(false);
  }

  const editProject = () => {
    setIsEditing(true);
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsEditing(false);
    } else if (event.key === 'Enter') {
      onSubmit(event);
    }
  }

  return (
    <div className="project-header">
      { isEditing
        ? (
          <form>
            <input
              className="editProject"
              autoFocus
              defaultValue={name}
              onKeyDown={handleKeyDown}
            />
          </form>
        )
        : (
          <p className="project-name" onClick={editProject}>
            {name}
          </p>
        )}
      <button
        className="btn-close"
        type="button"
        aria-label="Delete project"
        onClick={() => removeProject(+id)}
      />
    </div>
  );
};

export default ProjectHeader
