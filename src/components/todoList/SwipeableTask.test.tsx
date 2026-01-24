import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SwipeableTask from './SwipeableTask';

// Mock the API slice
const mockUpdateTask = jest.fn();
const mockRemoveTask = jest.fn();

jest.mock('./services/apiSlice', () => ({
  useUpdateTaskMutation: () => [mockUpdateTask],
  useRemoveTaskMutation: () => [mockRemoveTask],
}));

describe('SwipeableTask Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    
    const container = document.querySelector('.swipeable-task');
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

  test('handles touch start event', () => {
    renderSwipeableTask();
    
    const container = document.querySelector('.swipeable-task');
    
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 100 }],
    });
    
    // Component should track touch position
    expect(container).toBeInTheDocument();
  });

  test('handles touch move event', () => {
    renderSwipeableTask();
    
    const container = document.querySelector('.swipeable-task');
    
    // Start touch
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 100 }],
    });
    
    // Move touch
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 200 }],
    });
    
    const swipeContent = document.querySelector('.swipe-content');
    expect(swipeContent).toBeInTheDocument();
  });

  test('shows complete action when swiping right', () => {
    renderSwipeableTask();
    
    const container = document.querySelector('.swipeable-task');
    
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 0 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 100 }],
    });
    
    const leftAction = document.querySelector('.swipe-actions-left');
    expect(leftAction).toBeInTheDocument();
  });

  test('shows delete action when swiping left', () => {
    renderSwipeableTask();
    
    const container = document.querySelector('.swipeable-task');
    
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 200 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 50 }],
    });
    
    const rightAction = document.querySelector('.swipe-actions-right');
    expect(rightAction).toBeInTheDocument();
  });

  test('calls updateTask to complete when swiped right beyond threshold', () => {
    renderSwipeableTask();
    
    const container = document.querySelector('.swipeable-task');
    
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 0 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 100 }],
    });
    
    fireEvent.touchEnd(container!);
    
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
    
    const container = document.querySelector('.swipeable-task');
    
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 0 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 100 }],
    });
    
    fireEvent.touchEnd(container!);
    
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
    
    const container = document.querySelector('.swipeable-task');
    
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 200 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 50 }],
    });
    
    fireEvent.touchEnd(container!);
    
    expect(mockRemoveTask).toHaveBeenCalledWith(1);
  });

  test('resets position when swipe does not exceed threshold', () => {
    renderSwipeableTask();
    
    const container = document.querySelector('.swipeable-task');
    
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 100 }],
    });
    
    // Small swipe (less than threshold)
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 130 }],
    });
    
    fireEvent.touchEnd(container!);
    
    // Neither update nor remove should be called
    expect(mockUpdateTask).not.toHaveBeenCalled();
    expect(mockRemoveTask).not.toHaveBeenCalled();
  });

  test('shows checkmark icon for incomplete task swipe right', () => {
    renderSwipeableTask({ completed: false });
    
    const container = document.querySelector('.swipeable-task');
    
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 0 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 100 }],
    });
    
    const leftAction = document.querySelector('.swipe-actions-left');
    expect(leftAction?.textContent).toContain('✓');
  });

  test('shows undo icon for completed task swipe right', () => {
    renderSwipeableTask({ completed: true });
    
    const container = document.querySelector('.swipeable-task');
    
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 0 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 100 }],
    });
    
    const leftAction = document.querySelector('.swipe-actions-left');
    expect(leftAction?.textContent).toContain('↩️');
  });

  test('shows trash icon for swipe left', () => {
    renderSwipeableTask();
    
    const container = document.querySelector('.swipeable-task');
    
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 200 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 50 }],
    });
    
    const rightAction = document.querySelector('.swipe-actions-right');
    expect(rightAction?.textContent).toContain('🗑️');
  });

  test('limits swipe distance', () => {
    renderSwipeableTask();
    
    const container = document.querySelector('.swipeable-task');
    
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 0 }],
    });
    
    // Extreme swipe
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 500 }],
    });
    
    const swipeContent = document.querySelector('.swipe-content') as HTMLElement;
    const transform = swipeContent.style.transform;
    
    // Should be limited (max 150px)
    expect(transform).toMatch(/translateX\(150px\)/);
  });

  test('preserves due date when toggling completion', () => {
    renderSwipeableTask({ dueDate: '2026-02-15' });
    
    const container = document.querySelector('.swipeable-task');
    
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 0 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 100 }],
    });
    
    fireEvent.touchEnd(container!);
    
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 1,
      name: 'Test Task',
      projectId: 1,
      completed: true,
      dueDate: '2026-02-15',
    });
  });
});
