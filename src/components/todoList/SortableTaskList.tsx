import React, { useEffect, useRef, useState } from 'react';
import Task from './Task';
import SwipeableTask from './SwipeableTask';
import { useUpdateTaskPositionMutation } from './services/apiSlice';
import { useIsMobile } from '../../hooks/useIsMobile';
import '../../styles/dragDrop.scss';

interface TaskProps {
  id: string;
  name: string;
  projectId: number;
  completed: boolean;
  position: number;
  dueDate?: string | null;
}

interface SortableTaskListProps {
  tasks: TaskProps[];
  projectId: number;
  projects: Array<{ id: number; name: string }>;
}

const SortableTaskList: React.FC<SortableTaskListProps> = ({ tasks, projectId, projects }) => {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [delayReorder, setDelayReorder] = useState(false);
  const isMobile = useIsMobile();
  const [updateTaskPosition] = useUpdateTaskPositionMutation();
  const completionByIdRef = useRef<Record<string, boolean>>({});
  const reorderDelayTimerRef = useRef<number | null>(null);
  const frozenOrderIdsRef = useRef<string[]>([]);
  const lastRenderedOrderIdsRef = useRef<string[]>([]);
  const completionChangedNow = tasks.some(
    (task) => completionByIdRef.current[task.id] !== undefined && completionByIdRef.current[task.id] !== task.completed
  );

  if (completionChangedNow) {
    frozenOrderIdsRef.current = lastRenderedOrderIdsRef.current;
  }

  useEffect(() => {
    const currentCompletionById = tasks.reduce<Record<string, boolean>>((acc, task) => {
      acc[task.id] = task.completed;
      return acc;
    }, {});

    if (completionChangedNow) {
      setDelayReorder(true);
      frozenOrderIdsRef.current = lastRenderedOrderIdsRef.current;

      if (reorderDelayTimerRef.current !== null) {
        window.clearTimeout(reorderDelayTimerRef.current);
      }

      reorderDelayTimerRef.current = window.setTimeout(() => {
        setDelayReorder(false);
        reorderDelayTimerRef.current = null;
      }, 2000);
    }

    completionByIdRef.current = currentCompletionById;
  }, [tasks, completionChangedNow]);

  useEffect(() => () => {
    if (reorderDelayTimerRef.current !== null) {
      window.clearTimeout(reorderDelayTimerRef.current);
    }
  }, []);

  const getDueDateSortKey = (value?: string | null) => {
    if (!value) return null;
    const dateOnly = value.includes('T') ? value.slice(0, 10) : value;
    const parsed = Date.parse(`${dateOnly}T00:00:00Z`);
    return Number.isNaN(parsed) ? dateOnly : parsed;
  };

  // Base sort: incomplete first, then due-date priority, then due-date asc, then position.
  const normallySortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    const aHasDueDate = Boolean(a.dueDate);
    const bHasDueDate = Boolean(b.dueDate);

    if (aHasDueDate !== bHasDueDate) {
      return aHasDueDate ? -1 : 1;
    }

    if (aHasDueDate && bHasDueDate) {
      const aDueDateKey = getDueDateSortKey(a.dueDate);
      const bDueDateKey = getDueDateSortKey(b.dueDate);

      if (aDueDateKey !== bDueDateKey) {
        if (typeof aDueDateKey === 'number' && typeof bDueDateKey === 'number') {
          return aDueDateKey - bDueDateKey;
        }
        return String(aDueDateKey).localeCompare(String(bDueDateKey));
      }
    }

    return a.position - b.position;
  });

  // Delay only the reorder after completion toggle. Task state itself still updates immediately.
  const shouldUseFrozenOrder = delayReorder || completionChangedNow;
  const sortedTasks = shouldUseFrozenOrder
    ? [
        ...frozenOrderIdsRef.current
          .map((id) => tasks.find((task) => task.id === id))
          .filter((task): task is TaskProps => Boolean(task)),
        ...normallySortedTasks.filter((task) => !frozenOrderIdsRef.current.includes(task.id)),
      ]
    : normallySortedTasks;

  lastRenderedOrderIdsRef.current = sortedTasks.map((task) => task.id);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggingId(Number(id));
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.setData('application/x-task', id);
    // Add a custom class to the dragged element for styling
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragging');
    setDraggingId(null);
    setDropTargetId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    // Only allow task drops
    if (!e.dataTransfer.types.includes('application/x-task')) {
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetId(Number(id));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {

    // Only allow task drops
    if (!e.dataTransfer.types.includes('application/x-task')) {
      return;
    }

    e.preventDefault();
    const sourceId = e.dataTransfer.getData('application/x-task'); // Keep as string

    if (sourceId === targetId) {
      return;
    }


    const sourceIndex = sortedTasks.findIndex(t => t.id === sourceId);
    const targetIndex = sortedTasks.findIndex(t => t.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    // Ensure both tasks belong to the same project
    const sourceTask = sortedTasks[sourceIndex];
    const targetTask = sortedTasks[targetIndex];

    if (sourceTask.projectId !== targetTask.projectId) {
      return;
    }

    // The new position should be the target's current position
    // The backend will handle shifting other items
    const newPosition = sortedTasks[targetIndex].position;

    // Update the position in the backend
    updateTaskPosition({ id: sourceId, position: newPosition })
      .unwrap()
      .then((result) => {
      })
      .catch((error) => {
        console.error('Task position update failed:', error);
      });
  };

  return (
    <div className="task-list">
      {sortedTasks.map((task) => (
        isMobile ? (
          <SwipeableTask
            key={task.id}
            id={task.id}
            name={task.name}
            completed={task.completed}
            projectId={projectId}
            dueDate={task.dueDate}
            projects={projects}
          />
        ) : (
          <div
            key={task.id}
            onDragOver={(e) => handleDragOver(e, task.id)}
            onDrop={(e) => handleDrop(e, task.id)}
            className={`task-container ${draggingId === Number(task.id) ? 'dragging' : ''} ${dropTargetId === Number(task.id) ? 'drop-target' : ''}`}
          >
            <div
              className="drag-handle"
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              onDragEnd={handleDragEnd}
            >
              &#9776;
            </div>
            <Task
              id={task.id}
              name={task.name}
              completed={task.completed}
              projectId={projectId}
              dueDate={task.dueDate}
              projects={projects}
            />
          </div>
        )
      ))}
    </div>
  );
};

export default SortableTaskList;
