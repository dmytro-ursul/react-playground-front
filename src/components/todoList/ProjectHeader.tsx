import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useRemoveProjectMutation, useUpdateProjectMutation } from "./services/apiSlice";

type Props = {
  id: number,
  name: string,
  taskCount?: number,
  isCollapsed?: boolean,
  onToggleCollapse?: () => void
};

const ProjectHeader = ({ id, name, taskCount = 0, isCollapsed = false, onToggleCollapse }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const deleteInputRef = useRef<HTMLInputElement>(null);
  const [removeProject] = useRemoveProjectMutation();
  const [updateProject] = useUpdateProjectMutation();

  useEffect(() => {
    if (showDeleteModal) {
      setDeleteInput('');
      deleteInputRef.current?.focus();
    }
  }, [showDeleteModal]);

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

  const handleHeaderClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on edit input or close button
    if ((e.target as HTMLElement).closest('.editProject') || 
        (e.target as HTMLElement).closest('.btn-close')) {
      return;
    }
    if (onToggleCollapse && !isEditing) {
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
        { isEditing
          ? (
            <form onClick={(e) => e.stopPropagation()}>
              <input
                className="editProject"
                autoFocus
                defaultValue={name}
                onKeyDown={handleKeyDown}
              />
            </form>
          )
          : (
            <p className="project-name" onClick={(e) => { e.stopPropagation(); editProject(); }}>
              {name}
              {taskCount > 0 && (
                <span className="project-task-count">{taskCount}</span>
              )}
            </p>
          )}
      </div>
      <button
        className="btn-close"
        type="button"
        aria-label="Delete project"
        onClick={(e) => {
          e.stopPropagation();
          setShowDeleteModal(true);
        }}
      />

      {showDeleteModal && ReactDOM.createPortal(
        <div className="delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete project</h3>
            <p>
              Type <strong>delete</strong> to confirm removing <strong>"{name}"</strong> and all its tasks.
            </p>
            <input
              ref={deleteInputRef}
              className="delete-confirm-input"
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && deleteInput === 'delete') {
                  removeProject(+id);
                  setShowDeleteModal(false);
                } else if (e.key === 'Escape') {
                  setShowDeleteModal(false);
                }
              }}
              placeholder="delete"
              autoComplete="off"
            />
            <div className="delete-modal-actions">
              <button
                className="btn-cancel"
                type="button"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-delete-confirm"
                type="button"
                disabled={deleteInput !== 'delete'}
                onClick={() => {
                  removeProject(+id);
                  setShowDeleteModal(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProjectHeader
