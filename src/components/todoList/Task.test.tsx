import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Task from './Task';
import { apiSlice } from './services/apiSlice';

// Mock the API slice
const mockStore = configureStore({
  reducer: {
    api: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// Mock the mutation hooks
const mockUpdateTask = jest.fn();
const mockRemoveTask = jest.fn();

jest.mock('./services/apiSlice', () => ({
  ...jest.requireActual('./services/apiSlice'),
  useUpdateTaskMutation: () => [mockUpdateTask],
  useRemoveTaskMutation: () => [mockRemoveTask],
}));

const defaultProps = {
  id: '1',
  name: 'Test Task',
  projectId: 1,
  completed: false,
};

const renderTask = (props = {}) => {
  return render(
    <Provider store={mockStore}>
      <Task {...defaultProps} {...props} />
    </Provider>
  );
};

describe('Task Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders task name', () => {
    renderTask();
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  test('renders checkbox for task completion', () => {
    renderTask();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  test('renders checked checkbox for completed task', () => {
    renderTask({ completed: true });
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  test('applies completed class to completed task', () => {
    renderTask({ completed: true });
    const taskText = screen.getByText('Test Task');
    expect(taskText).toHaveClass('completed');
  });

  test('does not apply completed class to incomplete task', () => {
    renderTask({ completed: false });
    const taskText = screen.getByText('Test Task');
    expect(taskText).not.toHaveClass('completed');
  });

  test('calls updateTask when checkbox is clicked', async () => {
    const user = userEvent.setup();
    renderTask();
    const checkbox = screen.getByRole('checkbox');

    await user.click(checkbox);

    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 1,
      name: 'Test Task',
      projectId: 1,
      completed: true,
    });
  });

  test('calls updateTask with false when completed task checkbox is clicked', async () => {
    const user = userEvent.setup();
    renderTask({ completed: true });
    const checkbox = screen.getByRole('checkbox');

    await user.click(checkbox);

    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 1,
      name: 'Test Task',
      projectId: 1,
      completed: false,
    });
  });

  test('renders delete button', () => {
    renderTask();
    const deleteButton = screen.getByRole('button', { name: /delete task/i });
    expect(deleteButton).toBeInTheDocument();
  });

  test('calls removeTask when delete button is clicked', async () => {
    const user = userEvent.setup();
    renderTask();
    const deleteButton = screen.getByRole('button', { name: /delete task/i });

    await user.click(deleteButton);

    expect(mockRemoveTask).toHaveBeenCalledWith(1);
  });
});
