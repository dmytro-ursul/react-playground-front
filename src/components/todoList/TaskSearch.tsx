import React, { useState, useRef, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';

interface TaskItem {
  id: string;
  name: string;
  completed: boolean;
  dueDate?: string | null;
  projectId: number;
  projectName: string;
}

interface TaskSearchProps {
  projects: Array<{
    id: number;
    name: string;
    tasks: Array<{
      id: string;
      name: string;
      completed: boolean;
      dueDate?: string | null;
      projectId: number;
    }>;
  }>;
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (taskId: string) => void;
}

const TaskSearch: React.FC<TaskSearchProps> = ({ projects, isOpen, onClose, onSelectTask }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const allTasks: TaskItem[] = useMemo(
    () =>
      projects.flatMap((project) =>
        project.tasks.map((task) => ({
          ...task,
          projectName: project.name,
        }))
      ),
    [projects]
  );

  const fuse = useMemo(
    () =>
      new Fuse(allTasks, {
        keys: [
          { name: 'name', weight: 0.7 },
          { name: 'projectName', weight: 0.3 },
        ],
        threshold: 0.4,
        includeScore: true,
      }),
    [allTasks]
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query, { limit: 20 });
  }, [fuse, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSelect = (taskId: string) => {
    onClose();
    onSelectTask(taskId);
  };

  return (
    <div className="task-search-overlay" onClick={onClose}>
      <div className="task-search-container" onClick={(e) => e.stopPropagation()}>
        <div className="task-search-header">
          <svg className="task-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="task-search-input"
            placeholder="Search tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="task-search-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="task-search-results">
          {query.trim() && results.length === 0 && (
            <div className="task-search-empty">No tasks found</div>
          )}
          {results.map(({ item }) => (
            <button
              key={item.id}
              className={`task-search-result ${item.completed ? 'completed' : ''}`}
              onClick={() => handleSelect(item.id)}
            >
              <span className={`task-search-checkbox ${item.completed ? 'checked' : ''}`}>
                {item.completed ? '✓' : ''}
              </span>
              <div className="task-search-result-content">
                <span className="task-search-result-name">{item.name}</span>
                <span className="task-search-result-meta">
                  {item.projectName}
                  {item.dueDate && ` · ${formatDate(item.dueDate)}`}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskSearch;
