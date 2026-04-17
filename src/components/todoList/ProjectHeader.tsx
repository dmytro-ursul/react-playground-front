import React, { useState } from 'react';
import { useRemoveProjectMutation, useUpdateProjectMutation } from "./services/apiSlice";
import DeleteProjectModal from './DeleteProjectModal';
import RenameProjectModal from './RenameProjectModal';

type Props = {
  id: number,
  name: string,
  taskCount?: number,
  isCollapsed?: boolean,
  onToggleCollapse?: () => void,
  onAddTask?: () => void
};

const ProjectHeader = ({ id, name, taskCount = 0, isCollapsed = false, onToggleCollapse, onAddTask }: Props) => {
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [removeProject] = useRemoveProjectMutation();
  const [updateProject] = useUpdateProjectMutation();

  const handleHeaderClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.btn-close') ||
        (e.target as HTMLElement).closest('.btn-add-task-project')) {
      return;
    }
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  }

  return (
    <div className="project-header" onClick={handleHeaderClick}>
      <div className="project-header-left">
        {onToggleCollapse && (
          <button
            className={`project-collapse-btn ${isCollapsed ? 'collapsed' : ''}`}
            type="button"
            aria-label={isCollapsed ? 'Expand project' : 'Collapse project'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </button>
        )}
        <p className="project-name" onClick={(e) => { e.stopPropagation(); setShowRenameModal(true); }}>
          {name}
          {taskCount > 0 && (
            <span className="project-task-count">{taskCount}</span>
          )}
        </p>
      </div>
      <div className="project-header-actions">
        {onAddTask && (
          <button
            className="btn-add-task-project"
            type="button"
            aria-label="Add task to project"
            onClick={(e) => {
              e.stopPropagation();
              onAddTask();
            }}
          >
            +
          </button>
        )}
        <button
          className="btn-close"
          type="button"
          aria-label="Delete project"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteModal(true);
          }}
        />
      </div>

      {showRenameModal && (
        <RenameProjectModal
          currentName={name}
          onConfirm={(newName) => {
            updateProject({ id: +id, name: newName });
            setShowRenameModal(false);
          }}
          onCancel={() => setShowRenameModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteProjectModal
          name={name}
          onConfirm={() => { removeProject(+id); setShowDeleteModal(false); }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default ProjectHeader
