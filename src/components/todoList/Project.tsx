import React from 'react';
import ProjectHeader from './ProjectHeader';
import TaskForm from './TaskForm';
import SortableTaskList from './SortableTaskList';

interface ProjectProps {
  id: number;
  name: string;
  position?: number;
  tasks?: {
    id: string;
    name: string;
    projectId: number;
    completed: boolean;
    position: number;
  }[];
  projects?: Array<{ id: number; name: string }>;
}

export default function Project({ id, name, position, tasks = [], projects = [] }: ProjectProps): JSX.Element {
  return (
    <div className="project">
      <ProjectHeader name={name} id={id} />
      <TaskForm projectId={id} />
      <SortableTaskList tasks={tasks} projectId={id} projects={projects} />
    </div>
  );
}
