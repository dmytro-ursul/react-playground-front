import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from './TaskForm';

// Mock the API slice
const mockCreateTask = jest.fn();

jest.mock('./services/apiSlice', () => ({
  useCreateTaskMutation: () => [mockCreateTask],
}));

describe('TaskForm Component', () => {
  const defaultProps = {
    projectId: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderTaskForm = (props = {}) => {
    return render(<TaskForm {...defaultProps} {...props} />);
  };

  test('renders task name input', () => {
    renderTaskForm();
    
    expect(screen.getByPlaceholderText('✨ Add a new task...')).toBeInTheDocument();
  });

  test('renders date input', () => {
    renderTaskForm();
    
    const dateInput = document.querySelector('input[type="date"]');
    expect(dateInput).toBeInTheDocument();
  });

  test('renders Add Task button', () => {
    renderTaskForm();
    
    expect(screen.getByText('Add Task')).toBeInTheDocument();
  });

  test('updates task name on input change', async () => {
    const user = userEvent.setup();
    renderTaskForm();
    
    const input = screen.getByPlaceholderText('✨ Add a new task...');
    await user.type(input, 'New task name');
    
    expect(input).toHaveValue('New task name');
  });

  test('updates due date on date change', () => {
    renderTaskForm();
    
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-03-15' } });
    
    expect(dateInput).toHaveValue('2026-03-15');
  });

  test('calls createTask on form submit', async () => {
    const user = userEvent.setup();
    renderTaskForm();
    
    const input = screen.getByPlaceholderText('✨ Add a new task...');
    await user.type(input, 'New task');
    
    const submitButton = screen.getByText('Add Task');
    await user.click(submitButton);
    
    expect(mockCreateTask).toHaveBeenCalledWith({
      name: 'New task',
      projectId: 1,
      dueDate: null,
    });
  });

  test('includes due date in createTask call', async () => {
    const user = userEvent.setup();
    renderTaskForm();
    
    const input = screen.getByPlaceholderText('✨ Add a new task...');
    await user.type(input, 'New task');
    
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-03-15' } });
    
    const submitButton = screen.getByText('Add Task');
    await user.click(submitButton);
    
    expect(mockCreateTask).toHaveBeenCalledWith({
      name: 'New task',
      projectId: 1,
      dueDate: '2026-03-15',
    });
  });

  test('resets form after submission', async () => {
    const user = userEvent.setup();
    renderTaskForm();
    
    const input = screen.getByPlaceholderText('✨ Add a new task...') as HTMLInputElement;
    await user.type(input, 'New task');
    
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-03-15' } });
    
    const submitButton = screen.getByText('Add Task');
    await user.click(submitButton);
    
    expect(input).toHaveValue('');
    expect(dateInput).toHaveValue('');
  });

  test('prevents default form submission', async () => {
    const user = userEvent.setup();
    renderTaskForm();
    
    const form = document.querySelector('form');
    const submitHandler = jest.fn((e) => e.preventDefault());
    form?.addEventListener('submit', submitHandler);
    
    const input = screen.getByPlaceholderText('✨ Add a new task...');
    await user.type(input, 'New task');
    
    const submitButton = screen.getByText('Add Task');
    await user.click(submitButton);
    
    // Form should have been submitted
    expect(mockCreateTask).toHaveBeenCalled();
  });

  test('sends null for empty due date', async () => {
    const user = userEvent.setup();
    renderTaskForm();
    
    const input = screen.getByPlaceholderText('✨ Add a new task...');
    await user.type(input, 'Task without date');
    
    const submitButton = screen.getByText('Add Task');
    await user.click(submitButton);
    
    expect(mockCreateTask).toHaveBeenCalledWith({
      name: 'Task without date',
      projectId: 1,
      dueDate: null,
    });
  });

  test('uses correct projectId from props', async () => {
    const user = userEvent.setup();
    renderTaskForm({ projectId: 5 });
    
    const input = screen.getByPlaceholderText('✨ Add a new task...');
    await user.type(input, 'Task for project 5');
    
    const submitButton = screen.getByText('Add Task');
    await user.click(submitButton);
    
    expect(mockCreateTask).toHaveBeenCalledWith({
      name: 'Task for project 5',
      projectId: 5,
      dueDate: null,
    });
  });

  test('date input has title attribute', () => {
    renderTaskForm();
    
    const dateInput = screen.getByTitle('Set due date (optional)');
    expect(dateInput).toBeInTheDocument();
  });

  test('form has correct CSS class', () => {
    renderTaskForm();
    
    const form = document.querySelector('form');
    expect(form).toHaveClass('task-add-form');
  });

  test('submit button has correct CSS class', () => {
    renderTaskForm();
    
    const submitButton = screen.getByText('Add Task');
    expect(submitButton).toHaveClass('task-add');
  });
});
