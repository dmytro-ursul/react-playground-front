import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from './EmptyState';

describe('EmptyState Component', () => {
  const mockOnAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Projects Empty State', () => {
    test('renders projects empty state content', () => {
      render(<EmptyState type="projects" />);
      
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first project to start organizing your tasks')).toBeInTheDocument();
    });

    test('renders project icon', () => {
      render(<EmptyState type="projects" />);
      
      expect(screen.getByText('📋')).toBeInTheDocument();
    });

    test('renders action button when onAction is provided', () => {
      render(<EmptyState type="projects" onAction={mockOnAction} />);
      
      expect(screen.getByText('Create Project')).toBeInTheDocument();
    });

    test('calls onAction when button is clicked', async () => {
      const user = userEvent.setup();
      render(<EmptyState type="projects" onAction={mockOnAction} />);
      
      const button = screen.getByText('Create Project');
      await user.click(button);
      
      expect(mockOnAction).toHaveBeenCalledTimes(1);
    });

    test('does not render button when onAction is not provided', () => {
      render(<EmptyState type="projects" />);
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Tasks Empty State', () => {
    test('renders tasks empty state content', () => {
      render(<EmptyState type="tasks" />);
      
      expect(screen.getByText('All done!')).toBeInTheDocument();
      expect(screen.getByText('No tasks in this project. Add one to get started!')).toBeInTheDocument();
    });

    test('renders task icon', () => {
      render(<EmptyState type="tasks" />);
      
      expect(screen.getByText('✨')).toBeInTheDocument();
    });

    test('renders Add Task button when onAction is provided', () => {
      render(<EmptyState type="tasks" onAction={mockOnAction} />);
      
      expect(screen.getByText('Add Task')).toBeInTheDocument();
    });

    test('calls onAction when Add Task button is clicked', async () => {
      const user = userEvent.setup();
      render(<EmptyState type="tasks" onAction={mockOnAction} />);
      
      const button = screen.getByText('Add Task');
      await user.click(button);
      
      expect(mockOnAction).toHaveBeenCalledTimes(1);
    });
  });
});
