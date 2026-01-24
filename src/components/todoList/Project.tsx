import React, { useState } from 'react';
import ProjectHeader from './ProjectHeader';
import TaskForm from './TaskForm';
import SortableTaskList from './SortableTaskList';
import EmptyState from './EmptyState';

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
  onAddTask?: () => void;
}

export default function Project({ id, name, position, tasks = [], projects = [], onAddTask }: ProjectProps): JSX.Element {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="project">
      <ProjectHeader 
        name={name} 
        id={id} 
        taskCount={tasks.length}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      <div className={`project-content ${isCollapsed ? 'collapsed' : ''}`}>
        <TaskForm projectId={id} />
        {tasks.length === 0 ? (
          <EmptyState type="tasks" onAction={onAddTask} />
        ) : (
          <SortableTaskList tasks={tasks} projectId={id} projects={projects} />
        )}
      </div>
    </div>
  );
}
