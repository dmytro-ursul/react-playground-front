import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface RenameProjectModalProps {
  currentName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

const RenameProjectModal: React.FC<RenameProjectModalProps> = ({ currentName, onConfirm, onCancel }) => {
  const [newName, setNewName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const canSubmit = newName.trim().length > 0 && newName.trim() !== currentName;

  const handleConfirm = () => {
    if (canSubmit) onConfirm(newName.trim());
  };

  return ReactDOM.createPortal(
    <div className="delete-modal-overlay" onClick={onCancel}>
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Rename project</h3>
        <input
          ref={inputRef}
          className="delete-confirm-input"
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm();
            else if (e.key === 'Escape') onCancel();
          }}
          autoComplete="off"
        />
        <div className="delete-modal-actions">
          <button className="btn-cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-delete-confirm"
            type="button"
            disabled={!canSubmit}
            onClick={handleConfirm}
          >
            Rename
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RenameProjectModal;
