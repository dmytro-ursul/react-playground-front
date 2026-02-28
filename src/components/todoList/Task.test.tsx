import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Task from './Task';
import SwipeableTask from './SwipeableTask';
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
  projects: [
    { id: 1, name: 'Project 1' },
    { id: 2, name: 'Project 2' },
    { id: 3, name: 'Project 3' },
  ],
};

const renderTask = (props = {}) => {
  return render(
    <Provider store={mockStore}>
      <Task {...defaultProps} {...props} />
    </Provider>
  );
};

const renderSwipeableTask = (props = {}) => {
  return render(
    <Provider store={mockStore}>
      <SwipeableTask {...defaultProps} {...props} />
    </Provider>
  );
};

// Helper to set viewport width
const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

describe('Task Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
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

    test('renders menu button', () => {
      renderTask();
      const menuButton = screen.getByTitle('More actions');
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('Task Completion', () => {
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
        dueDate: null,
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
        dueDate: null,
      });
    });

    test('preserves due date when toggling completion', async () => {
      const user = userEvent.setup();
      renderTask({ dueDate: '2026-02-15' });
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);

      expect(mockUpdateTask).toHaveBeenCalledWith({
        id: 1,
        name: 'Test Task',
        projectId: 1,
        completed: true,
        dueDate: '2026-02-15',
      });
    });
  });

  describe('Dropdown Menu', () => {
    test('opens menu when button is clicked', async () => {
      const user = userEvent.setup();
      renderTask();
      const menuButton = screen.getByTitle('More actions');

      await user.click(menuButton);

      expect(screen.getByText('🗑️ Delete')).toBeInTheDocument();
    });

    test('closes menu when clicking outside', async () => {
      const user = userEvent.setup();
      renderTask();
      const menuButton = screen.getByTitle('More actions');

      await user.click(menuButton);
      expect(screen.getByText('🗑️ Delete')).toBeInTheDocument();

      // Click outside
      await user.click(document.body);

      await waitFor(() => {
        expect(screen.queryByText('🗑️ Delete')).not.toBeInTheDocument();
      });
    });

    test('shows other projects to move to', async () => {
      const user = userEvent.setup();
      renderTask();
      const menuButton = screen.getByTitle('More actions');

      await user.click(menuButton);

      expect(screen.getByText('Move to:')).toBeInTheDocument();
      expect(screen.getByText('📋 Project 2')).toBeInTheDocument();
      expect(screen.getByText('📋 Project 3')).toBeInTheDocument();
    });

    test('does not show current project in move options', async () => {
      const user = userEvent.setup();
      renderTask();
      const menuButton = screen.getByTitle('More actions');

      await user.click(menuButton);

      expect(screen.queryByText('📋 Project 1')).not.toBeInTheDocument();
    });

    test('calls removeTask when delete is clicked', async () => {
      const user = userEvent.setup();
      renderTask();
      const menuButton = screen.getByTitle('More actions');

      await user.click(menuButton);
      await user.click(screen.getByText('🗑️ Delete'));

      expect(mockRemoveTask).toHaveBeenCalledWith(1);
    });

    test('moves task to another project', async () => {
      const user = userEvent.setup();
      renderTask();
      const menuButton = screen.getByTitle('More actions');

      await user.click(menuButton);
      await user.click(screen.getByText('📋 Project 2'));

      expect(mockUpdateTask).toHaveBeenCalledWith({
        id: 1,
        name: 'Test Task',
        projectId: 2,
        completed: false,
        dueDate: null,
      });
    });

    test('shows "No other projects" when only one project exists', async () => {
      const user = userEvent.setup();
      renderTask({ projects: [{ id: 1, name: 'Only Project' }] });
      const menuButton = screen.getByTitle('More actions');

      await user.click(menuButton);

      expect(screen.getByText('📋 No other projects')).toBeInTheDocument();
    });

    test('closes menu after action is performed', async () => {
      const user = userEvent.setup();
      renderTask();
      const menuButton = screen.getByTitle('More actions');

      await user.click(menuButton);
      await user.click(screen.getByText('🗑️ Delete'));

      expect(screen.queryByText('🗑️ Delete')).not.toBeInTheDocument();
    });
  });

  describe('Task Editing', () => {
    test('enters edit mode when task name is clicked', async () => {
      const user = userEvent.setup();
      renderTask();

      await user.click(screen.getByText('Test Task'));

      const input = screen.getByDisplayValue('Test Task');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('editTask');
    });

    test('updates task name on Enter key', async () => {
      const user = userEvent.setup();
      renderTask();

      await user.click(screen.getByText('Test Task'));

      const input = screen.getByDisplayValue('Test Task');
      await user.clear(input);
      await user.type(input, 'Updated Task Name{enter}');

      expect(mockUpdateTask).toHaveBeenCalledWith({
        id: 1,
        name: 'Updated Task Name',
        projectId: 1,
        completed: false,
        dueDate: null,
      });
    });

    test('exits edit mode without saving on Escape key', async () => {
      const user = userEvent.setup();
      renderTask();

      await user.click(screen.getByText('Test Task'));

      const input = screen.getByDisplayValue('Test Task');
      await user.type(input, ' Extra Text{escape}');

      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
  });

  describe('Due Date', () => {
    test('displays formatted due date', () => {
      renderTask({ dueDate: '2027-01-30' });

      expect(screen.getByText('Jan 30')).toBeInTheDocument();
    });

    test('shows overdue indicator for past due dates', () => {
      // Date in the past
      renderTask({ dueDate: '2020-01-01' });

      const dueDateLabel = document.querySelector('.due-date-label.overdue');
      expect(dueDateLabel).toBeInTheDocument();
    });

    test('shows due soon indicator for upcoming dates', () => {
      // Date within 3 days (we'll test this more carefully)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      renderTask({ dueDate: dateStr });

      const dueDateLabel = document.querySelector('.due-date-label.due-soon');
      expect(dueDateLabel).toBeInTheDocument();
    });

    test('renders date input for setting due date', () => {
      renderTask();

      const dateInput = document.querySelector('input[type="date"]');
      expect(dateInput).toBeInTheDocument();
    });

    test('updates due date when date input changes', async () => {
      renderTask();

      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2026-03-15' } });

      expect(mockUpdateTask).toHaveBeenCalledWith({
        id: 1,
        name: 'Test Task',
        projectId: 1,
        completed: false,
        dueDate: '2026-03-15',
      });
    });

    test('removes due date when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderTask({ dueDate: '2026-02-15' });

      const removeButton = screen.getByTitle('Remove due date');
      await user.click(removeButton);

      expect(mockUpdateTask).toHaveBeenCalledWith({
        id: 1,
        name: 'Test Task',
        projectId: 1,
        completed: false,
        dueDate: null,
      });
    });

    test('does not show clear button when no due date', () => {
      renderTask({ dueDate: null });

      expect(screen.queryByTitle('Remove due date')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('checkbox has accessible label', () => {
      renderTask();

      const checkbox = screen.getByRole('checkbox', {
        name: /mark task "test task" as complete/i,
      });
      expect(checkbox).toBeInTheDocument();
    });

    test('menu button has accessible label', () => {
      renderTask();

      const menuButton = screen.getByTitle('More actions');
      expect(menuButton).toBeInTheDocument();
    });

    test('date input has title', () => {
      renderTask();

      const dateInput = screen.getByTitle('Set due date');
      expect(dateInput).toBeInTheDocument();
    });
  });

  describe('Task Box Classes', () => {
    test('applies overdue class when task is overdue', () => {
      renderTask({ dueDate: '2020-01-01', completed: false });

      const taskBox = document.querySelector('.task-box');
      expect(taskBox).toHaveClass('overdue');
    });

    test('applies due-soon class when task is due soon', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      renderTask({ dueDate: dateStr, completed: false });

      const taskBox = document.querySelector('.task-box');
      expect(taskBox).toHaveClass('due-soon');
    });

    test('does not apply overdue class to completed tasks', () => {
      renderTask({ dueDate: '2020-01-01', completed: true });

      const taskBox = document.querySelector('.task-box');
      expect(taskBox).not.toHaveClass('overdue');
    });

    test('applies menu-open class when menu is open', async () => {
      const user = userEvent.setup();
      renderTask();

      const menuButton = screen.getByTitle('More actions');
      await user.click(menuButton);

      const taskBox = document.querySelector('.task-box');
      expect(taskBox).toHaveClass('menu-open');
    });
  });

  describe('Mobile Bottom Sheet', () => {
    const originalInnerWidth = window.innerWidth;

    beforeEach(() => {
      setViewportWidth(375);
    });

    afterEach(() => {
      setViewportWidth(originalInnerWidth);
    });

    test('opens bottom sheet via requestOpenBottomSheet prop', async () => {
      const onBottomSheetOpened = jest.fn();
      
      setViewportWidth(375);
      
      const { rerender } = render(
        <Provider store={mockStore}>
          <Task 
            {...defaultProps} 
            requestOpenBottomSheet={false}
            onBottomSheetOpened={onBottomSheetOpened}
          />
        </Provider>
      );
      
      // Bottom sheet should not be visible initially
      expect(document.querySelector('.task-bottom-sheet')).not.toBeInTheDocument();
      
      // Trigger bottom sheet opening
      rerender(
        <Provider store={mockStore}>
          <Task 
            {...defaultProps} 
            requestOpenBottomSheet={true}
            onBottomSheetOpened={onBottomSheetOpened}
          />
        </Provider>
      );
      
      await waitFor(() => {
        expect(document.querySelector('.task-bottom-sheet')).toBeInTheDocument();
      });
      
      expect(onBottomSheetOpened).toHaveBeenCalled();
    });

    test('opens bottom sheet on tap via SwipeableTask', async () => {
      setViewportWidth(375);
      renderSwipeableTask();
      
      const swipeableTask = screen.getByTestId('swipeable-task');
      
      // Single tap without movement
      fireEvent.touchStart(swipeableTask, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(swipeableTask);
      
      await waitFor(() => {
        expect(document.querySelector('.task-bottom-sheet')).toBeInTheDocument();
      });
    });

    test('bottom sheet shows task name input', async () => {
      setViewportWidth(375);
      renderSwipeableTask();
      
      const swipeableTask = screen.getByTestId('swipeable-task');
      
      // Single tap
      fireEvent.touchStart(swipeableTask, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(swipeableTask);

      await waitFor(() => {
        expect(document.querySelector('.task-bottom-sheet')).toBeInTheDocument();
      });

      expect(document.querySelector('.sheet-input')).toBeInTheDocument();
    });

    test('bottom sheet shows date chips', async () => {
      setViewportWidth(375);
      renderSwipeableTask();
      
      const swipeableTask = screen.getByTestId('swipeable-task');
      
      // Single tap
      fireEvent.touchStart(swipeableTask, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(swipeableTask);

      await waitFor(() => {
        expect(screen.getByText('📅 Today')).toBeInTheDocument();
      });
      
      expect(screen.getByText('☀️ Tomorrow')).toBeInTheDocument();
      expect(screen.getByText('📆 Next Week')).toBeInTheDocument();
    });

    test('bottom sheet shows delete button', async () => {
      setViewportWidth(375);
      renderSwipeableTask();
      
      const swipeableTask = screen.getByTestId('swipeable-task');
      
      // Single tap
      fireEvent.touchStart(swipeableTask, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(swipeableTask);

      await waitFor(() => {
        expect(screen.getByText('🗑️ Delete Task')).toBeInTheDocument();
      });
    });

    test('closes bottom sheet when clicking close button', async () => {
      const user = userEvent.setup();
      setViewportWidth(375);
      renderSwipeableTask();

      const swipeableTask = screen.getByTestId('swipeable-task');
      
      // Single tap
      fireEvent.touchStart(swipeableTask, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(swipeableTask);

      await waitFor(() => {
        expect(document.querySelector('.task-bottom-sheet')).toBeInTheDocument();
      });

      const closeButton = document.querySelector('.close-btn');
      await user.click(closeButton!);

      await waitFor(() => {
        expect(document.querySelector('.task-bottom-sheet')).not.toBeInTheDocument();
      });
    });

    test('closes bottom sheet when clicking overlay', async () => {
      setViewportWidth(375);
      renderSwipeableTask();

      const swipeableTask = screen.getByTestId('swipeable-task');
      
      // Single tap
      fireEvent.touchStart(swipeableTask, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(swipeableTask);

      await waitFor(() => {
        expect(document.querySelector('.task-bottom-sheet')).toBeInTheDocument();
      });

      const overlay = document.querySelector('.task-bottom-sheet-overlay') as HTMLElement;
      fireEvent.click(overlay);

      await waitFor(() => {
        expect(document.querySelector('.task-bottom-sheet')).not.toBeInTheDocument();
      });
    });

    test('sets due date to today from bottom sheet', async () => {
      const user = userEvent.setup();
      setViewportWidth(375);
      renderSwipeableTask();

      const swipeableTask = screen.getByTestId('swipeable-task');
      
      // Single tap
      fireEvent.touchStart(swipeableTask, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(swipeableTask);

      await waitFor(() => {
        expect(screen.getByText('📅 Today')).toBeInTheDocument();
      });

      await user.click(screen.getByText('📅 Today'));

      expect(mockUpdateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          dueDate: expect.any(String),
        })
      );
    });

    test('sets due date to closest Monday from bottom sheet', async () => {
      const user = userEvent.setup();
      setViewportWidth(375);
      renderSwipeableTask();

      const swipeableTask = screen.getByTestId('swipeable-task');
      fireEvent.touchStart(swipeableTask, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(swipeableTask);

      await waitFor(() => {
        expect(screen.getByText('📆 Next Week')).toBeInTheDocument();
      });

      await user.click(screen.getByText('📆 Next Week'));

      const expectedMonday = (() => {
        const d = new Date();
        const dayOfWeek = d.getDay();
        let daysUntilMonday = (8 - dayOfWeek) % 7;
        if (daysUntilMonday === 0) {
          daysUntilMonday = 7;
        }
        d.setDate(d.getDate() + daysUntilMonday);
        return d.toISOString().split('T')[0];
      })();

      expect(mockUpdateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          dueDate: expectedMonday,
        })
      );
    });

    test('deletes task from bottom sheet', async () => {
      const user = userEvent.setup();
      setViewportWidth(375);
      renderSwipeableTask();

      const swipeableTask = screen.getByTestId('swipeable-task');
      
      // Single tap
      fireEvent.touchStart(swipeableTask, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(swipeableTask);

      await waitFor(() => {
        expect(screen.getByText('🗑️ Delete Task')).toBeInTheDocument();
      });

      await user.click(screen.getByText('🗑️ Delete Task'));

      expect(mockRemoveTask).toHaveBeenCalledWith(1);
    });

    test('shows move to project options in bottom sheet', async () => {
      setViewportWidth(375);
      renderSwipeableTask();

      const swipeableTask = screen.getByTestId('swipeable-task');
      
      // Single tap
      fireEvent.touchStart(swipeableTask, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(swipeableTask);

      await waitFor(() => {
        expect(screen.getByText('Move to Project')).toBeInTheDocument();
      });
      
      expect(screen.getByText('📋 Project 2')).toBeInTheDocument();
      expect(screen.getByText('📋 Project 3')).toBeInTheDocument();
    });

    test('moves task to another project from bottom sheet', async () => {
      const user = userEvent.setup();
      setViewportWidth(375);
      renderSwipeableTask();

      const swipeableTask = screen.getByTestId('swipeable-task');
      
      // Double-tap
      fireEvent.touchStart(swipeableTask, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(swipeableTask);
      fireEvent.touchStart(swipeableTask, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(swipeableTask);

      await waitFor(() => {
        expect(screen.getByText('📋 Project 2')).toBeInTheDocument();
      });

      await user.click(screen.getByText('📋 Project 2'));

      expect(mockUpdateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          projectId: 2,
        })
      );
    });

    test('does not open bottom sheet when clicking checkbox on mobile', async () => {
      const user = userEvent.setup();
      setViewportWidth(375);
      renderTask();

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      // Should toggle completion, not open bottom sheet
      expect(mockUpdateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: true,
        })
      );
      expect(document.querySelector('.task-bottom-sheet')).not.toBeInTheDocument();
    });

    test('opens bottom sheet on single tap', async () => {
      setViewportWidth(375);
      renderSwipeableTask();

      const swipeableTask = screen.getByTestId('swipeable-task');
      
      // Single tap
      fireEvent.touchStart(swipeableTask, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchEnd(swipeableTask);

      await waitFor(() => {
        expect(document.querySelector('.task-bottom-sheet')).toBeInTheDocument();
      });
    });

    test('does not open bottom sheet on swipe gesture', async () => {
      setViewportWidth(375);
      renderSwipeableTask();

      const swipeableTask = screen.getByTestId('swipeable-task');
      
      // Swipe gesture (touch start, move, end)
      fireEvent.touchStart(swipeableTask, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchMove(swipeableTask, { touches: [{ clientX: 150, clientY: 100 }] });
      fireEvent.touchEnd(swipeableTask);

      expect(document.querySelector('.task-bottom-sheet')).not.toBeInTheDocument();
    });
  });

  describe('Desktop Behavior', () => {
    const originalInnerWidth = window.innerWidth;

    beforeEach(() => {
      setViewportWidth(1024);
    });

    afterEach(() => {
      setViewportWidth(originalInnerWidth);
    });

    test('does not open bottom sheet on single click on desktop', async () => {
      renderSwipeableTask();

      const swipeableTask = screen.getByTestId('swipeable-task');
      fireEvent.click(swipeableTask);

      // Should not show bottom sheet on single click
      expect(document.querySelector('.task-bottom-sheet')).not.toBeInTheDocument();
    });

    test('does not open bottom sheet on double-click on desktop (isMobile is false)', async () => {
      setViewportWidth(1024);
      renderSwipeableTask();

      const swipeableTask = screen.getByTestId('swipeable-task');
      fireEvent.doubleClick(swipeableTask);

      // Desktop users should use the menu, not bottom sheet
      expect(document.querySelector('.task-bottom-sheet')).not.toBeInTheDocument();
    });

    test('shows menu button on desktop', () => {
      setViewportWidth(1024);
      renderTask();

      expect(screen.getByTitle('More actions')).toBeInTheDocument();
    });

    test('opens dropdown menu on desktop', async () => {
      const user = userEvent.setup();
      setViewportWidth(1024);
      renderTask();

      const menuButton = screen.getByTitle('More actions');
      await user.click(menuButton);

      expect(screen.getByText('🗑️ Delete')).toBeInTheDocument();
    });
  });
});
