import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  useUpdateTaskMutation,
  useRemoveTaskMutation,
} from './services/apiSlice';
import { useIsMobile } from '../../hooks/useIsMobile';

type Props = {
  id: string,
  name: string,
  projectId: number,
  completed: boolean,
  dueDate?: string | null,
  projects: Array<{ id: number; name: string }>,
  requestOpenBottomSheet?: number,
};

const Task = ({ id, name, projectId, completed, dueDate, projects, requestOpenBottomSheet }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDueDate, setEditedDueDate] = useState(dueDate || '');
  const [showMenu, setShowMenu] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<'down' | 'up'>('down');
  const [menuMaxHeight, setMenuMaxHeight] = useState<number | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [sheetName, setSheetName] = useState(name);
  const [sheetDueDate, setSheetDueDate] = useState(dueDate || '');
  const isMobile = useIsMobile();
  const [updateTask] = useUpdateTaskMutation();
  const [removeTask] = useRemoveTaskMutation();
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside (desktop only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const updateMenuPlacement = useCallback(() => {
    if (!menuRef.current || !dropdownRef.current) return;

    const viewportPadding = 12;
    const triggerRect = menuRef.current.getBoundingClientRect();
    const dropdownHeight = dropdownRef.current.scrollHeight || dropdownRef.current.getBoundingClientRect().height;
    const spaceBelow = Math.max(0, window.innerHeight - triggerRect.bottom - viewportPadding);
    const spaceAbove = Math.max(0, triggerRect.top - viewportPadding);

    const canFitBelow = spaceBelow >= dropdownHeight;
    const canFitAbove = spaceAbove >= dropdownHeight;
    const shouldOpenUp = !canFitBelow && (canFitAbove || spaceAbove > spaceBelow);
    const availableSpace = shouldOpenUp ? spaceAbove : spaceBelow;

    setMenuPlacement(shouldOpenUp ? 'up' : 'down');
    setMenuMaxHeight(Math.floor(availableSpace));
  }, []);

  // Keep the menu inside the viewport for tasks near the bottom.
  useEffect(() => {
    if (!showMenu) {
      setMenuPlacement('down');
      setMenuMaxHeight(null);
      return;
    }

    let frameId = window.requestAnimationFrame(updateMenuPlacement);
    const handleReposition = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateMenuPlacement);
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [showMenu, editedDueDate, projects.length, updateMenuPlacement]);

  // Prevent body scroll when bottom sheet is open
  useEffect(() => {
    if (showBottomSheet) {
      setSheetName(name);
      setSheetDueDate(dueDate || '');
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [showBottomSheet, name, dueDate, projectId]);

  // Handle external request to open bottom sheet (from SwipeableTask tap)
  useEffect(() => {
    if (requestOpenBottomSheet && requestOpenBottomSheet > 0 && isMobile && !isEditing) {
      setShowBottomSheet(true);
    }
  }, [requestOpenBottomSheet, isMobile, isEditing]);

  const toggleCompleted = useCallback((e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    updateTask({id: +id, name, projectId: +projectId, completed: !completed, dueDate: dueDate || null});
  }, [id, name, projectId, completed, dueDate, updateTask]);

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newDueDate = e.target.value;
    setEditedDueDate(newDueDate);
    updateTask({id: +id, name, projectId: +projectId, completed, dueDate: newDueDate || null});
  };

  const handleDueDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    // Ensure icon-only date inputs still open the native picker on click.
    const input = e.currentTarget;
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        // Ignore: some browsers may restrict programmatic picker opening.
      }
    }
  };

  const handleTaskClick = useCallback((e: React.MouseEvent) => {
    // Don't open bottom sheet if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('input') || target.closest('button') || target.closest('.task-actions')) {
      return;
    }
    
    if (isMobile && !isEditing) {
      e.preventDefault();
      e.stopPropagation();
      setShowBottomSheet(true);
    }
  }, [isMobile, isEditing]);

  const toggleMenu = useCallback((event?: React.SyntheticEvent) => {
    event?.stopPropagation();
    setShowMenu((prev) => !prev);
  }, []);

  // Helper to format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper to check if task is overdue
  const isOverdue = (dateString: string | null | undefined) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateString);
    return due < today && !completed;
  };

  // Helper to check if task is due soon (within 3 days)
  const isDueSoon = (dateString: string | null | undefined) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateString);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    return due >= today && due <= threeDaysFromNow && !completed;
  };

  const [editValue, setEditValue] = useState(name);

  const editTask = () => {
    setEditValue(name);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== name) {
      updateTask({id: +id, name: trimmed, projectId: +projectId, completed, dueDate: editedDueDate || null});
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleCancelEdit();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  // Get date helpers for bottom sheet
  const getToday = () => new Date().toISOString().split('T')[0];
  const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const getNextWeek = () => {
    const d = new Date();
    const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    let daysUntilMonday = (8 - dayOfWeek) % 7;
    if (daysUntilMonday === 0) {
      daysUntilMonday = 7;
    }
    d.setDate(d.getDate() + daysUntilMonday);
    return d.toISOString().split('T')[0];
  };

  const dueDateClass = isOverdue(dueDate || editedDueDate) ? 'overdue' : isDueSoon(dueDate || editedDueDate) ? 'due-soon' : '';

  return (
    <>
      <div 
        className={`task-box ${dueDateClass} ${showMenu ? 'menu-open' : ''}`}
        onClick={handleTaskClick}
        data-task-id={id}
      >
        <input
          type="checkbox"
          checked={completed}
          onChange={toggleCompleted}
          className="task-checkbox"
          aria-label={`Mark task "${name}" as ${completed ? 'incomplete' : 'complete'}`}
        />
        <div className="task-content">
          {isEditing ? (
            <div className="edit-task-inline" onClick={(e) => e.stopPropagation()}>
              <input
                className="editTask"
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => handleSaveEdit()}
              />
            </div>
          ) : (
            <p className={`task ${completed ? 'completed' : ''}`} onClick={(e) => { e.stopPropagation(); if (isMobile) { setShowBottomSheet(true); } else { editTask(); } }}>
              {name}
            </p>
          )}
          <div className="task-meta">
            <input
              type="date"
              value={editedDueDate}
              onChange={handleDueDateChange}
              onClick={handleDueDateClick}
              className="task-due-date"
              title="Set due date"
            />
            {(dueDate || editedDueDate) && (
              <div className="due-date-display">
                <span className={`due-date-label ${dueDateClass}`}>
                  {isOverdue(dueDate || editedDueDate) && '⚠️ '}
                  {isDueSoon(dueDate || editedDueDate) && '⏰ '}
                  {formatDate(dueDate || editedDueDate)}
                </span>
                <button
                  className="btn-remove-due-date"
                  type="button"
                  title="Remove due date"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditedDueDate('');
                    updateTask({id: +id, name, projectId: +projectId, completed, dueDate: null});
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Desktop menu button */}
        <div
          className="task-actions desktop-only"
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="btn-menu"
            type="button"
            title="More actions"
            onClick={toggleMenu}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu(e);
              }
            }}
          >
            ⋯
          </button>
          {showMenu && (
            <div
              ref={dropdownRef}
              className={`dropdown-menu ${menuPlacement === 'up' ? 'dropdown-menu-up' : ''}`}
              data-testid="dropdown-menu"
              style={menuMaxHeight !== null ? { maxHeight: `${menuMaxHeight}px`, overflowY: 'auto' } : undefined}
            >
              <button
                className="dropdown-item"
                onClick={() => {
                  removeTask(+id);
                  setShowMenu(false);
                }}
              >
                🗑️ Delete
              </button>
              {!editedDueDate && (
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setEditedDueDate(getToday());
                    updateTask({id: +id, name, projectId: +projectId, completed, dueDate: getToday()});
                    setShowMenu(false);
                  }}
                >
                  📅 Set due date (today)
                </button>
              )}
              {projects.filter(p => p.id !== projectId).length > 0 ? (
                <>
                  <div className="actions-divider">Move to:</div>
                  {projects.filter(p => p.id !== projectId).map(project => (
                    <button
                      key={project.id}
                      className="dropdown-item dropdown-project"
                      onClick={() => {
                        updateTask({id: +id, name, projectId: project.id, completed, dueDate: dueDate || null});
                        setShowMenu(false);
                      }}
                    >
                      📋 {project.name}
                    </button>
                  ))}
                </>
              ) : (
                <button className="dropdown-item" disabled>
                  📋 No other projects
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      {showBottomSheet && typeof document !== 'undefined' && createPortal(
        <div className="task-bottom-sheet-overlay" onClick={() => setShowBottomSheet(false)}>
          <div className="task-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-header">
              <h3>{name}</h3>
              <button className="close-btn" onClick={() => setShowBottomSheet(false)}>✕</button>
            </div>
            
            <div className="bottom-sheet-content">
              {/* Task name edit */}
              <div className="sheet-section">
                <label>Task Name</label>
                <input
                  type="text"
                  value={sheetName}
                  className="sheet-input"
                  onChange={(e) => setSheetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSheetName(name);
                      setShowBottomSheet(false);
                    }
                  }}
                />
              </div>

              {/* Due date */}
              <div className="sheet-section">
                <label>Due Date</label>
                <div className="date-chips">
                  <button 
                    className={`date-chip ${sheetDueDate === getToday() ? 'active' : ''}`}
                    onClick={() => setSheetDueDate(getToday())}
                  >
                    📅 Today
                  </button>
                  <button 
                    className={`date-chip ${sheetDueDate === getTomorrow() ? 'active' : ''}`}
                    onClick={() => setSheetDueDate(getTomorrow())}
                  >
                    ☀️ Tomorrow
                  </button>
                  <button 
                    className={`date-chip ${sheetDueDate === getNextWeek() ? 'active' : ''}`}
                    onClick={() => setSheetDueDate(getNextWeek())}
                  >
                    📆 Next Week
                  </button>
                  {sheetDueDate && (
                    <button 
                      className="date-chip remove"
                      onClick={() => setSheetDueDate('')}
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={sheetDueDate}
                  onChange={(e) => setSheetDueDate(e.target.value)}
                  className="sheet-date-input"
                />
              </div>

              {/* Save / Cancel — applies to name and due date */}
              <div className="sheet-section sheet-actions">
                <button
                  type="button"
                  className="btn-sheet-cancel"
                  onClick={() => setShowBottomSheet(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-sheet-save"
                  onClick={() => {
                    const hasChanges =
                      sheetName.trim() !== name ||
                      (sheetDueDate || '') !== (dueDate || '');
                    if (hasChanges && sheetName.trim()) {
                      updateTask({
                        id: +id,
                        name: sheetName.trim(),
                        projectId,
                        completed,
                        dueDate: sheetDueDate || null,
                      });
                    }
                    setShowBottomSheet(false);
                  }}
                  disabled={!sheetName.trim()}
                >
                  Save
                </button>
              </div>

              {/* Move to project — instant */}
              {projects.filter(p => p.id !== projectId).length > 0 && (
                <div className="sheet-section">
                  <label>Move to Project</label>
                  {projects.filter(p => p.id !== projectId).length === 1 ? (
                    <button
                      className="project-option"
                      onClick={() => {
                        const target = projects.find(p => p.id !== projectId)!;
                        updateTask({
                          id: +id,
                          name: sheetName.trim() || name,
                          projectId: target.id,
                          completed,
                          dueDate: sheetDueDate || null,
                        });
                        setShowBottomSheet(false);
                      }}
                    >
                      📋 {projects.find(p => p.id !== projectId)!.name}
                    </button>
                  ) : (
                    <div className="project-list">
                      {projects.filter(p => p.id !== projectId).map(project => (
                        <button
                          key={project.id}
                          className="project-option"
                          onClick={() => {
                            updateTask({
                              id: +id,
                              name: sheetName.trim() || name,
                              projectId: project.id,
                              completed,
                              dueDate: sheetDueDate || null,
                            });
                            setShowBottomSheet(false);
                          }}
                        >
                          📋 {project.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Delete — instant */}
              <div className="sheet-section">
                <button
                  className="delete-btn"
                  onClick={() => {
                    removeTask(+id);
                    setShowBottomSheet(false);
                  }}
                >
                  🗑️ Delete Task
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Task;
