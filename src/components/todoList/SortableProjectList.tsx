import React from 'react';
import Project from './Project';
import '../../styles/dragDrop.scss';

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
  hideCompleted?: boolean;
  onAddTask?: (projectId: number) => void;
}

const SortableProjectList: React.FC<SortableProjectListProps> = ({
  projects,
  hideCompleted = false,
  onAddTask,
}) => {
  // Sort projects by position
  const sortedProjects = [...projects].sort((a, b) => a.position - b.position);

  return (
    <div id="project-list">
      {sortedProjects.map((project) => (
        <div
          key={project.id}
          className="project-container"
        >
          <Project 
            id={project.id} 
            name={project.name} 
            tasks={project.tasks} 
            position={project.position}
            projects={projects}
            hideCompleted={hideCompleted}
            onAddTask={onAddTask ? () => onAddTask(project.id) : undefined}
          />
        </div>
      ))}
    </div>
  );
};

export default SortableProjectList;
