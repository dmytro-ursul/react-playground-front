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
  requestOpenBottomSheet?: boolean,
  onBottomSheetOpened?: () => void
};

const Task = ({ id, name, projectId, completed, dueDate, projects, requestOpenBottomSheet, onBottomSheetOpened }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDueDate, setEditedDueDate] = useState(dueDate || '');
  const [showMenu, setShowMenu] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<'down' | 'up'>('down');
  const [showBottomSheet, setShowBottomSheet] = useState(false);
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

  // Keep the menu inside the viewport for tasks near the bottom.
  useEffect(() => {
    if (!showMenu) {
      setMenuPlacement('down');
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      if (!menuRef.current || !dropdownRef.current) return;

      const triggerRect = menuRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const shouldOpenUp = spaceBelow < dropdownRect.height + 12 && spaceAbove > spaceBelow;

      setMenuPlacement(shouldOpenUp ? 'up' : 'down');
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [showMenu, editedDueDate, projects.length]);

  // Prevent body scroll when bottom sheet is open
  useEffect(() => {
    if (showBottomSheet) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [showBottomSheet]);

  // Handle external request to open bottom sheet (from SwipeableTask double-tap)
  useEffect(() => {
    if (requestOpenBottomSheet && isMobile && !isEditing) {
      setShowBottomSheet(true);
      onBottomSheetOpened?.();
    }
  }, [requestOpenBottomSheet, isMobile, isEditing, onBottomSheetOpened]);

  const handleSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const newName = (event.target as HTMLInputElement).value;
    updateTask({id: +id, name: newName, projectId: +projectId, completed, dueDate: editedDueDate || null});
    setIsEditing(false);
  };

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

  const editTask = () => {
    if (!isMobile) {
      setIsEditing(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    } else if (e.key === 'Enter') {
      handleSubmit(e);
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
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const dueDateClass = isOverdue(dueDate || editedDueDate) ? 'overdue' : isDueSoon(dueDate || editedDueDate) ? 'due-soon' : '';

  return (
    <>
      <div 
        className={`task-box ${dueDateClass} ${showMenu ? 'menu-open' : ''}`}
        onClick={handleTaskClick}
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
            <form>
              <input
                className="editTask"
                autoFocus
                defaultValue={name}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
              />
            </form>
          ) : (
            <p className={`task ${completed ? 'completed' : ''}`} onClick={(e) => { e.stopPropagation(); editTask(); }}>
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
                  defaultValue={name}
                  className="sheet-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const newName = (e.target as HTMLInputElement).value;
                      updateTask({id: +id, name: newName, projectId: +projectId, completed, dueDate: editedDueDate || null});
                      setShowBottomSheet(false);
                    }
                  }}
                  onBlur={(e) => {
                    const newName = e.target.value;
                    if (newName !== name) {
                      updateTask({id: +id, name: newName, projectId: +projectId, completed, dueDate: editedDueDate || null});
                    }
                  }}
                />
              </div>

              {/* Due date */}
              <div className="sheet-section">
                <label>Due Date</label>
                <div className="date-chips">
                  <button 
                    className={`date-chip ${editedDueDate === getToday() ? 'active' : ''}`}
                    onClick={() => {
                      const d = getToday();
                      setEditedDueDate(d);
                      updateTask({id: +id, name, projectId: +projectId, completed, dueDate: d});
                    }}
                  >
                    📅 Today
                  </button>
                  <button 
                    className={`date-chip ${editedDueDate === getTomorrow() ? 'active' : ''}`}
                    onClick={() => {
                      const d = getTomorrow();
                      setEditedDueDate(d);
                      updateTask({id: +id, name, projectId: +projectId, completed, dueDate: d});
                    }}
                  >
                    ☀️ Tomorrow
                  </button>
                  <button 
                    className={`date-chip ${editedDueDate === getNextWeek() ? 'active' : ''}`}
                    onClick={() => {
                      const d = getNextWeek();
                      setEditedDueDate(d);
                      updateTask({id: +id, name, projectId: +projectId, completed, dueDate: d});
                    }}
                  >
                    📆 Next Week
                  </button>
                  {editedDueDate && (
                    <button 
                      className="date-chip remove"
                      onClick={() => {
                        setEditedDueDate('');
                        updateTask({id: +id, name, projectId: +projectId, completed, dueDate: null});
                      }}
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={editedDueDate}
                  onChange={(e) => {
                    setEditedDueDate(e.target.value);
                    updateTask({id: +id, name, projectId: +projectId, completed, dueDate: e.target.value || null});
                  }}
                  className="sheet-date-input"
                />
              </div>

              {/* Move to project */}
              {projects.filter(p => p.id !== projectId).length > 0 && (
                <div className="sheet-section">
                  <label>Move to Project</label>
                  <div className="project-list">
                    {projects.filter(p => p.id !== projectId).map(project => (
                      <button
                        key={project.id}
                        className="project-option"
                        onClick={() => {
                          updateTask({id: +id, name, projectId: project.id, completed, dueDate: dueDate || null});
                          setShowBottomSheet(false);
                        }}
                      >
                        📋 {project.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete */}
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
