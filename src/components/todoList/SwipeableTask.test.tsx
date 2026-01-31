import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SwipeableTask from './SwipeableTask';

// Mock the API slice
const mockUpdateTask = jest.fn();
const mockRemoveTask = jest.fn();

jest.mock('./services/apiSlice', () => ({
  useUpdateTaskMutation: () => [mockUpdateTask],
  useRemoveTaskMutation: () => [mockRemoveTask],
}));

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

describe('SwipeableTask Component', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    jest.clearAllMocks();
    setViewportWidth(375); // Default to mobile
  });

  afterEach(() => {
    setViewportWidth(originalInnerWidth);
  });

  const defaultProps = {
    id: '1',
    name: 'Test Task',
    projectId: 1,
    completed: false,
    projects: [
      { id: 1, name: 'Project 1' },
      { id: 2, name: 'Project 2' },
    ],
  };

  const renderSwipeableTask = (props = {}) => {
    return render(<SwipeableTask {...defaultProps} {...props} />);
  };

  test('renders task within swipeable container', () => {
    renderSwipeableTask();
    
    const container = screen.getByTestId('swipeable-task');
    expect(container).toBeInTheDocument();
  });

  test('renders task name', () => {
    renderSwipeableTask();
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  test('renders swipe content container', () => {
    renderSwipeableTask();
    
    const swipeContent = document.querySelector('.swipe-content');
    expect(swipeContent).toBeInTheDocument();
  });

  describe('Touch Events', () => {
    test('handles touch start event', () => {
      renderSwipeableTask();
      
      const container = screen.getByTestId('swipeable-task');
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      expect(container).toBeInTheDocument();
    });

    test('handles touch move event', () => {
      renderSwipeableTask();
      
      const container = screen.getByTestId('swipeable-task');
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchMove(container, {
        touches: [{ clientX: 200, clientY: 100 }],
      });
      
      const swipeContent = document.querySelector('.swipe-content');
      expect(swipeContent).toBeInTheDocument();
    });

    test('shows complete action when swiping right', () => {
      renderSwipeableTask();
      
      const container = screen.getByTestId('swipeable-task');
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 0, clientY: 100 }],
      });
      
      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      const leftAction = document.querySelector('.swipe-actions-left');
      expect(leftAction).toBeInTheDocument();
    });

    test('shows delete action when swiping left', () => {
      renderSwipeableTask();
      
      const container = screen.getByTestId('swipeable-task');
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 200, clientY: 100 }],
      });
      
      fireEvent.touchMove(container, {
        touches: [{ clientX: 50, clientY: 100 }],
      });
      
      const rightAction = document.querySelector('.swipe-actions-right');
      expect(rightAction).toBeInTheDocument();
    });
  });

  describe('Swipe Actions', () => {
    test('calls updateTask to complete when swiped right beyond threshold', () => {
      renderSwipeableTask();
      
      const container = screen.getByTestId('swipeable-task');
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 0, clientY: 100 }],
      });
      
      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchEnd(container);
      
      expect(mockUpdateTask).toHaveBeenCalledWith({
        id: 1,
        name: 'Test Task',
        projectId: 1,
        completed: true,
        dueDate: null,
      });
    });

    test('calls updateTask to uncomplete when completed task is swiped right', () => {
      renderSwipeableTask({ completed: true });
      
      const container = screen.getByTestId('swipeable-task');
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 0, clientY: 100 }],
      });
      
      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchEnd(container);
      
      expect(mockUpdateTask).toHaveBeenCalledWith({
        id: 1,
        name: 'Test Task',
        projectId: 1,
        completed: false,
        dueDate: null,
      });
    });

    test('calls removeTask when swiped left beyond threshold', () => {
      renderSwipeableTask();
      
      const container = screen.getByTestId('swipeable-task');
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 200, clientY: 100 }],
      });
      
      fireEvent.touchMove(container, {
        touches: [{ clientX: 50, clientY: 100 }],
      });
      
      fireEvent.touchEnd(container);
      
      expect(mockRemoveTask).toHaveBeenCalledWith(1);
    });

    test('resets position when swipe does not exceed threshold', () => {
      renderSwipeableTask();
      
      const container = screen.getByTestId('swipeable-task');
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      // Small swipe (less than threshold)
      fireEvent.touchMove(container, {
        touches: [{ clientX: 130, clientY: 100 }],
      });
      
      fireEvent.touchEnd(container);
      
      // Neither update nor remove should be called
      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(mockRemoveTask).not.toHaveBeenCalled();
    });

    test('preserves due date when toggling completion', () => {
      renderSwipeableTask({ dueDate: '2026-02-15' });
      
      const container = screen.getByTestId('swipeable-task');
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 0, clientY: 100 }],
      });
      
      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchEnd(container);
      
      expect(mockUpdateTask).toHaveBeenCalledWith({
        id: 1,
        name: 'Test Task',
        projectId: 1,
        completed: true,
        dueDate: '2026-02-15',
      });
    });
  });

  describe('Swipe Icons', () => {
    test('shows checkmark icon for incomplete task swipe right', () => {
      renderSwipeableTask({ completed: false });
      
      const container = screen.getByTestId('swipeable-task');
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 0, clientY: 100 }],
      });
      
      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      const leftAction = document.querySelector('.swipe-actions-left');
      expect(leftAction?.textContent).toContain('✓');
    });

    test('shows undo icon for completed task swipe right', () => {
      renderSwipeableTask({ completed: true });
      
      const container = screen.getByTestId('swipeable-task');
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 0, clientY: 100 }],
      });
      
      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      const leftAction = document.querySelector('.swipe-actions-left');
      expect(leftAction?.textContent).toContain('↩️');
    });

    test('shows trash icon for swipe left', () => {
      renderSwipeableTask();
      
      const container = screen.getByTestId('swipeable-task');
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 200, clientY: 100 }],
      });
      
      fireEvent.touchMove(container, {
        touches: [{ clientX: 50, clientY: 100 }],
      });
      
      const rightAction = document.querySelector('.swipe-actions-right');
      expect(rightAction?.textContent).toContain('🗑️');
    });
  });

  describe('Swipe Limits', () => {
    test('limits swipe distance to maximum', () => {
      renderSwipeableTask();
      
      const container = screen.getByTestId('swipeable-task');
      
      fireEvent.touchStart(container, {
        touches: [{ clientX: 0, clientY: 100 }],
      });
      
      // Extreme swipe
      fireEvent.touchMove(container, {
        touches: [{ clientX: 500, clientY: 100 }],
      });
      
      const swipeContent = document.querySelector('.swipe-content') as HTMLElement;
      const transform = swipeContent.style.transform;
      
      // Should be limited (max 150px)
      expect(transform).toMatch(/translateX\(150px\)/);
    });
  });

  describe('Double-Tap Detection', () => {
    test('detects double-tap and opens bottom sheet on mobile', async () => {
      setViewportWidth(375);
      renderSwipeableTask();
      
      const container = screen.getByTestId('swipeable-task');
      
      // First tap (no movement)
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchEnd(container);
      
      // Second tap within 300ms (no movement)
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchEnd(container);
      
      // Bottom sheet should open
      await waitFor(() => {
        expect(document.querySelector('.task-bottom-sheet')).toBeInTheDocument();
      });
    });

    test('does not detect double-tap if user moved (swipe gesture)', async () => {
      setViewportWidth(375);
      renderSwipeableTask();
      
      const container = screen.getByTestId('swipeable-task');
      
      // First tap with movement
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchMove(container, {
        touches: [{ clientX: 150, clientY: 100 }],
      });
      fireEvent.touchEnd(container);
      
      // Second tap
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchEnd(container);
      
      // Bottom sheet should NOT open because first touch was a swipe
      expect(document.querySelector('.task-bottom-sheet')).not.toBeInTheDocument();
    });

    test('single tap does not open bottom sheet', async () => {
      setViewportWidth(375);
      renderSwipeableTask();
      
      const container = screen.getByTestId('swipeable-task');
      
      // Single tap
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchEnd(container);
      
      // Wait longer than double-tap window
      await new Promise(resolve => setTimeout(resolve, 350));
      
      expect(document.querySelector('.task-bottom-sheet')).not.toBeInTheDocument();
    });
  });

  describe('Desktop Double-Click', () => {
    test('double-click triggers bottom sheet request', async () => {
      setViewportWidth(375); // Need mobile to see bottom sheet
      renderSwipeableTask();
      
      const container = screen.getByTestId('swipeable-task');
      
      fireEvent.doubleClick(container);
      
      await waitFor(() => {
        expect(document.querySelector('.task-bottom-sheet')).toBeInTheDocument();
      });
    });
  });
});
