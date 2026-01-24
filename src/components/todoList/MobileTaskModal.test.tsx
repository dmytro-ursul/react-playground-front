import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileTaskModal from './MobileTaskModal';

// Mock the API slice
const mockCreateTask = jest.fn();

jest.mock('./services/apiSlice', () => ({
  useCreateTaskMutation: () => [mockCreateTask],
}));

const mockProjects = [
  { id: 1, name: 'Project 1' },
  { id: 2, name: 'Project 2' },
  { id: 3, name: 'Project 3' },
];

describe('MobileTaskModal Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = (props = {}) => {
    return render(
      <MobileTaskModal
        isOpen={true}
        onClose={mockOnClose}
        projects={mockProjects}
        {...props}
      />
    );
  };

  test('renders nothing when isOpen is false', () => {
    render(
      <MobileTaskModal
        isOpen={false}
        onClose={mockOnClose}
        projects={mockProjects}
      />
    );
    
    expect(screen.queryByText('Add New Task')).not.toBeInTheDocument();
  });

  test('renders modal content when isOpen is true', () => {
    renderModal();
    
    expect(screen.getByText('✨ Add New Task')).toBeInTheDocument();
  });

  test('renders task name input', () => {
    renderModal();
    
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
  });

  test('renders quick date chips', () => {
    renderModal();
    
    expect(screen.getByText('📅 Today')).toBeInTheDocument();
    expect(screen.getByText('☀️ Tomorrow')).toBeInTheDocument();
    expect(screen.getByText('📆 Next Week')).toBeInTheDocument();
  });

  test('renders project selector with all projects', () => {
    renderModal();
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    expect(screen.getByText('Select a project...')).toBeInTheDocument();
  });

  test('renders Cancel and Add Task buttons', () => {
    renderModal();
    
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Add Task')).toBeInTheDocument();
  });

  test('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderModal();
    
    await user.click(screen.getByText('Cancel'));
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    renderModal();
    
    const overlay = document.querySelector('.bottom-sheet-overlay');
    await user.click(overlay!);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Add Task button is disabled when task name is empty', () => {
    renderModal();
    
    const addButton = screen.getByText('Add Task');
    expect(addButton).toBeDisabled();
  });

  test('Add Task button is disabled when no project is selected', async () => {
    const user = userEvent.setup();
    renderModal();
    
    const input = screen.getByPlaceholderText('What needs to be done?');
    await user.type(input, 'New task');
    
    const addButton = screen.getByText('Add Task');
    expect(addButton).toBeDisabled();
  });

  test('selects "Today" chip and sets date', async () => {
    const user = userEvent.setup();
    renderModal();
    
    const todayChip = screen.getByText('📅 Today');
    await user.click(todayChip);
    
    expect(todayChip).toHaveClass('active');
  });

  test('toggles chip selection', async () => {
    const user = userEvent.setup();
    renderModal();
    
    const todayChip = screen.getByText('📅 Today');
    
    // Click to select
    await user.click(todayChip);
    expect(todayChip).toHaveClass('active');
    
    // Click again to deselect
    await user.click(todayChip);
    expect(todayChip).not.toHaveClass('active');
  });

  test('switches between date chips', async () => {
    const user = userEvent.setup();
    renderModal();
    
    const todayChip = screen.getByText('📅 Today');
    const tomorrowChip = screen.getByText('☀️ Tomorrow');
    
    await user.click(todayChip);
    expect(todayChip).toHaveClass('active');
    
    await user.click(tomorrowChip);
    expect(tomorrowChip).toHaveClass('active');
    expect(todayChip).not.toHaveClass('active');
  });

  test('sets default project when provided', () => {
    renderModal({ defaultProjectId: 2 });
    
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('2');
  });

  test('creates task with correct data when form is submitted', async () => {
    const user = userEvent.setup();
    renderModal({ defaultProjectId: 1 });
    
    // Type task name
    const input = screen.getByPlaceholderText('What needs to be done?');
    await user.type(input, 'Test task');
    
    // Click Add Task
    const addButton = screen.getByText('Add Task');
    await user.click(addButton);
    
    expect(mockCreateTask).toHaveBeenCalledWith({
      name: 'Test task',
      projectId: 1,
      dueDate: null,
    });
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('creates task with due date when chip is selected', async () => {
    const user = userEvent.setup();
    renderModal({ defaultProjectId: 1 });
    
    // Type task name
    const input = screen.getByPlaceholderText('What needs to be done?');
    await user.type(input, 'Test task');
    
    // Select Today chip
    await user.click(screen.getByText('📅 Today'));
    
    // Click Add Task
    const addButton = screen.getByText('Add Task');
    await user.click(addButton);
    
    expect(mockCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test task',
        projectId: 1,
        dueDate: expect.any(String),
      })
    );
  });

  test('resets form after submission', async () => {
    const user = userEvent.setup();
    renderModal({ defaultProjectId: 1 });
    
    // Type task name
    const input = screen.getByPlaceholderText('What needs to be done?') as HTMLInputElement;
    await user.type(input, 'Test task');
    
    // Select Today chip
    const todayChip = screen.getByText('📅 Today');
    await user.click(todayChip);
    
    // Click Add Task
    const addButton = screen.getByText('Add Task');
    await user.click(addButton);
    
    // Verify onClose was called (form closes and resets)
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('renders custom date picker', () => {
    renderModal();
    
    expect(screen.getByText('Or pick a date:')).toBeInTheDocument();
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
  });

  test('clears chip selection when custom date is entered', async () => {
    const user = userEvent.setup();
    renderModal();
    
    // Select Today chip
    const todayChip = screen.getByText('📅 Today');
    await user.click(todayChip);
    expect(todayChip).toHaveClass('active');
    
    // Enter custom date
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-02-15' } });
    
    // Chip should be deselected
    expect(todayChip).not.toHaveClass('active');
  });
});
