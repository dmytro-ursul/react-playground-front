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
}

export default function Project({ id, name, position, tasks = [] }: ProjectProps): JSX.Element {
  return (
    <div className="project">
      <ProjectHeader name={name} id={id} />
      <TaskForm projectId={id} />
      <SortableTaskList tasks={tasks} projectId={id} />
    </div>
  );
}
