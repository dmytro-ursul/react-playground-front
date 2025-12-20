import React, { useState } from 'react';
import Task from './Task';
import { useUpdateTaskPositionMutation } from './services/apiSlice';
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
  const [updateTaskPosition] = useUpdateTaskPositionMutation();

  // Sort tasks by position
  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position);

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
      ))}
    </div>
  );
};

export default SortableTaskList;