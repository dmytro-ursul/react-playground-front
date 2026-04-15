import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface DeleteProjectModalProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({ name, onConfirm, onCancel }) => {
  const [deleteInput, setDeleteInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const confirmed = deleteInput === 'delete';

  const handleConfirm = () => {
    if (confirmed) onConfirm();
  };

  return ReactDOM.createPortal(
    <div className="delete-modal-overlay" onClick={onCancel}>
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Delete project</h3>
        <p>
          Type <strong>delete</strong> to confirm removing <strong>"{name}"</strong> and all its tasks.
        </p>
        <input
          ref={inputRef}
          className="delete-confirm-input"
          type="text"
          value={deleteInput}
          onChange={(e) => setDeleteInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm();
            else if (e.key === 'Escape') onCancel();
          }}
          placeholder="delete"
          autoComplete="off"
        />
        <div className="delete-modal-actions">
          <button className="btn-cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-delete-confirm"
            type="button"
            disabled={!confirmed}
            onClick={handleConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteProjectModal;
