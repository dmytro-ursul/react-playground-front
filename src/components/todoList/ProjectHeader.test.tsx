import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectHeader from './ProjectHeader';

// Mock the API slice
const mockRemoveProject = jest.fn();
const mockUpdateProject = jest.fn();

jest.mock('./services/apiSlice', () => ({
  useRemoveProjectMutation: () => [mockRemoveProject],
  useUpdateProjectMutation: () => [mockUpdateProject],
}));

describe('ProjectHeader Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    id: 1,
    name: 'Test Project',
  };

  const renderProjectHeader = (props = {}) => {
    return render(<ProjectHeader {...defaultProps} {...props} />);
  };

  test('renders project name', () => {
    renderProjectHeader();
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  test('renders delete button', () => {
    renderProjectHeader();
    
    const deleteButton = screen.getByRole('button', { name: /delete project/i });
    expect(deleteButton).toBeInTheDocument();
  });

  test('calls removeProject when delete button is clicked', async () => {
    const user = userEvent.setup();
    renderProjectHeader();
    
    const deleteButton = screen.getByRole('button', { name: /delete project/i });
    await user.click(deleteButton);
    
    expect(mockRemoveProject).toHaveBeenCalledWith(1);
  });

  test('enters edit mode when project name is clicked', async () => {
    const user = userEvent.setup();
    renderProjectHeader();
    
    await user.click(screen.getByText('Test Project'));
    
    const input = screen.getByDisplayValue('Test Project');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('editProject');
  });

  test('updates project name on Enter key', async () => {
    const user = userEvent.setup();
    renderProjectHeader();
    
    // Enter edit mode
    await user.click(screen.getByText('Test Project'));
    
    const input = screen.getByDisplayValue('Test Project');
    await user.clear(input);
    await user.type(input, 'Updated Project{enter}');
    
    expect(mockUpdateProject).toHaveBeenCalledWith({
      id: 1,
      name: 'Updated Project',
    });
  });

  test('exits edit mode without saving on Escape key', async () => {
    const user = userEvent.setup();
    renderProjectHeader();
    
    // Enter edit mode
    await user.click(screen.getByText('Test Project'));
    
    const input = screen.getByDisplayValue('Test Project');
    await user.type(input, ' Extra Text{escape}');
    
    expect(mockUpdateProject).not.toHaveBeenCalled();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  test('displays task count when provided', () => {
    renderProjectHeader({ taskCount: 5 });
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('does not display task count when zero', () => {
    renderProjectHeader({ taskCount: 0 });
    
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  test('renders collapse button when onToggleCollapse is provided', () => {
    const mockToggle = jest.fn();
    renderProjectHeader({ onToggleCollapse: mockToggle });
    
    const collapseButton = screen.getByRole('button', { name: /expand|collapse/i });
    expect(collapseButton).toBeInTheDocument();
  });

  test('does not render collapse button when onToggleCollapse is not provided', () => {
    renderProjectHeader();
    
    // Should only have the delete button
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute('aria-label', 'Delete project');
  });

  test('calls onToggleCollapse when collapse button is clicked', async () => {
    const user = userEvent.setup();
    const mockToggle = jest.fn();
    renderProjectHeader({ onToggleCollapse: mockToggle });
    
    const collapseButton = screen.getByRole('button', { name: /expand|collapse/i });
    await user.click(collapseButton);
    
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  test('applies collapsed class to button when isCollapsed is true', () => {
    const mockToggle = jest.fn();
    renderProjectHeader({ onToggleCollapse: mockToggle, isCollapsed: true });
    
    const collapseButton = screen.getByRole('button', { name: /expand project/i });
    expect(collapseButton).toHaveClass('collapsed');
  });

  test('calls onToggleCollapse when header is clicked (not on buttons)', async () => {
    const user = userEvent.setup();
    const mockToggle = jest.fn();
    renderProjectHeader({ onToggleCollapse: mockToggle });
    
    const header = document.querySelector('.project-header');
    await user.click(header!);
    
    expect(mockToggle).toHaveBeenCalled();
  });

  test('does not call onToggleCollapse when delete button is clicked', async () => {
    const user = userEvent.setup();
    const mockToggle = jest.fn();
    renderProjectHeader({ onToggleCollapse: mockToggle });
    
    const deleteButton = screen.getByRole('button', { name: /delete project/i });
    await user.click(deleteButton);
    
    // Toggle should NOT have been called (only removeProject)
    expect(mockToggle).not.toHaveBeenCalled();
    expect(mockRemoveProject).toHaveBeenCalled();
  });
});
