import React, { useState } from 'react';
import Project from './Project';
import { useUpdateProjectPositionMutation } from './services/apiSlice';
import './DragDrop.css';

interface ProjectProps {
  id: number;
  name: string;
  position: number;
  tasks?: {
    id: string;
    name: string;
    projectId: number;
    completed: boolean;
    position: number;
  }[];
}

interface SortableProjectListProps {
  projects: ProjectProps[];
}

const SortableProjectList: React.FC<SortableProjectListProps> = ({ projects }) => {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [updateProjectPosition] = useUpdateProjectPositionMutation();
  
  // Sort projects by position
  const sortedProjects = [...projects].sort((a, b) => a.position - b.position);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', id.toString());
    e.dataTransfer.setData('application/x-project', id.toString());
    // Add a custom class to the dragged element for styling
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragging');
    setDraggingId(null);
    setDropTargetId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    // Only allow project drops
    if (!e.dataTransfer.types.includes('application/x-project')) {
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetId(id);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: number) => {
    // Only allow project drops
    if (!e.dataTransfer.types.includes('application/x-project')) {
      return;
    }

    e.preventDefault();
    const sourceId = parseInt(e.dataTransfer.getData('application/x-project'), 10);

    if (sourceId === targetId) return;

    const sourceIndex = sortedProjects.findIndex(p => p.id === sourceId);
    const targetIndex = sortedProjects.findIndex(p => p.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    // The new position should be the target's current position
    // The backend will handle shifting other items
    const newPosition = sortedProjects[targetIndex].position;

    // Update the position in the backend
    updateProjectPosition({ id: sourceId.toString(), position: newPosition });
  };

  return (
    <div id="project-list">
      {sortedProjects.map((project) => (
        <div
          key={project.id}
          onDragOver={(e) => handleDragOver(e, project.id)}
          onDrop={(e) => handleDrop(e, project.id)}
          className={`project-container ${draggingId === project.id ? 'dragging' : ''} ${dropTargetId === project.id ? 'drop-target' : ''}`}
        >
          <div
            className="drag-handle"
            draggable
            onDragStart={(e) => handleDragStart(e, project.id)}
            onDragEnd={handleDragEnd}
          >
            &#9776;
          </div>
          <Project 
            id={project.id} 
            name={project.name} 
            tasks={project.tasks} 
            position={project.position}
          />
        </div>
      ))}
    </div>
  );
};

export default SortableProjectList;