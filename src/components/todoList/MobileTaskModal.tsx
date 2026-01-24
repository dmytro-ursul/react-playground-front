import React, { useState, useEffect } from 'react';
import { useCreateTaskMutation } from './services/apiSlice';

interface MobileTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Array<{ id: number; name: string }>;
  defaultProjectId?: number;
}

const MobileTaskModal: React.FC<MobileTaskModalProps> = ({
  isOpen,
  onClose,
  projects,
  defaultProjectId
}) => {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [createTask] = useCreateTaskMutation();

  useEffect(() => {
    if (isOpen && defaultProjectId) {
      setSelectedProjectId(defaultProjectId);
    }
  }, [isOpen, defaultProjectId]);

  const getDateFromChip = (chip: string): string => {
    const today = new Date();
    switch (chip) {
      case 'today':
        return today.toISOString().split('T')[0];
      case 'tomorrow':
        today.setDate(today.getDate() + 1);
        return today.toISOString().split('T')[0];
      case 'nextWeek':
        today.setDate(today.getDate() + 7);
        return today.toISOString().split('T')[0];
      default:
        return '';
    }
  };

  const handleChipClick = (chip: string) => {
    if (activeChip === chip) {
      setActiveChip(null);
      setDueDate('');
    } else {
      setActiveChip(chip);
      setDueDate(getDateFromChip(chip));
    }
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value);
    setActiveChip(null);
  };

  const handleSubmit = () => {
    if (!name.trim() || !selectedProjectId) return;

    createTask({
      name: name.trim(),
      projectId: selectedProjectId,
      dueDate: dueDate || null
    });

    // Reset form
    setName('');
    setDueDate('');
    setActiveChip(null);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={handleOverlayClick} />
      <div className="bottom-sheet">
        <div className="bottom-sheet-handle" />
        <h3 className="bottom-sheet-title">✨ Add New Task</h3>
        
        <div className="bottom-sheet-form">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
          />

          <div className="quick-date-chips">
            <button
              type="button"
              className={`date-chip ${activeChip === 'today' ? 'active' : ''}`}
              onClick={() => handleChipClick('today')}
            >
              📅 Today
            </button>
            <button
              type="button"
              className={`date-chip ${activeChip === 'tomorrow' ? 'active' : ''}`}
              onClick={() => handleChipClick('tomorrow')}
            >
              ☀️ Tomorrow
            </button>
            <button
              type="button"
              className={`date-chip ${activeChip === 'nextWeek' ? 'active' : ''}`}
              onClick={() => handleChipClick('nextWeek')}
            >
              📆 Next Week
            </button>
          </div>

          <div className="custom-date-row">
            <label>Or pick a date:</label>
            <input
              type="date"
              value={activeChip ? '' : dueDate}
              onChange={handleCustomDateChange}
            />
          </div>

          {projects.length > 0 && (
            <select
              className="project-select"
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  📋 {project.name}
                </option>
              ))}
            </select>
          )}

          <div className="bottom-sheet-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-add-task"
              onClick={handleSubmit}
              disabled={!name.trim() || !selectedProjectId}
            >
              Add Task
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileTaskModal;
