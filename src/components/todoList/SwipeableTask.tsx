import React, { useState, useRef } from 'react';
import Task from './Task';
import { useUpdateTaskMutation, useRemoveTaskMutation } from './services/apiSlice';

interface SwipeableTaskProps {
  id: string;
  name: string;
  projectId: number;
  completed: boolean;
  dueDate?: string | null;
  projects: Array<{ id: number; name: string }>;
}

const SwipeableTask: React.FC<SwipeableTaskProps> = (props) => {
  const { id, name, projectId, completed, dueDate } = props;
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [requestOpenBottomSheet, setRequestOpenBottomSheet] = useState(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const hasMoved = useRef(false);
  const directionRef = useRef<'horizontal' | 'vertical' | null>(null);
  const startTargetRef = useRef<EventTarget | null>(null);
  
  const [updateTask] = useUpdateTaskMutation();
  const [removeTask] = useRemoveTaskMutation();

  const SWIPE_THRESHOLD = 80;
  const MOVE_THRESHOLD = 10;
  const LOCK_THRESHOLD = 8; // Pixels before locking direction

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    hasMoved.current = false;
    directionRef.current = null;
    startTargetRef.current = e.target;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startXRef.current;
    const diffY = currentY - startYRef.current;

    // Lock direction after moving past threshold
    if (directionRef.current === null) {
      if (Math.abs(diffX) < LOCK_THRESHOLD && Math.abs(diffY) < LOCK_THRESHOLD) return;
      directionRef.current = Math.abs(diffX) > Math.abs(diffY) ? 'horizontal' : 'vertical';
      hasMoved.current = true;
    }

    // If scrolling vertically, don't apply horizontal offset
    if (directionRef.current === 'vertical') return;
    
    if (Math.abs(diffX) > MOVE_THRESHOLD) {
      hasMoved.current = true;
    }
    
    const clampedDiff = Math.max(-150, Math.min(150, diffX));
    setSwipeOffset(clampedDiff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    // Handle swipe actions
    if (swipeOffset > SWIPE_THRESHOLD) {
      updateTask({
        id: +id,
        name,
        projectId: +projectId,
        completed: !completed,
        dueDate: dueDate || null
      });
    } else if (swipeOffset < -SWIPE_THRESHOLD) {
      removeTask(+id);
    } else if (!hasMoved.current) {
      // It was a tap, not a swipe - open bottom sheet unless interacting with controls
      const target = startTargetRef.current as HTMLElement | null;
      const isInteractive = target?.closest('input, button, .task-actions');
      if (!isInteractive) {
        setRequestOpenBottomSheet(prev => prev + 1);
      }
    }
    
    setSwipeOffset(0);
  };

  return (
    <div 
      className="swipeable-task"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid="swipeable-task"
    >
      {/* Left action - Complete */}
      <div 
        className="swipe-actions swipe-actions-left"
        style={{ 
          width: Math.max(0, swipeOffset),
          opacity: swipeOffset > 0 ? Math.min(1, swipeOffset / SWIPE_THRESHOLD) : 0
        }}
      >
        <span className="swipe-action-btn">
          {completed ? '↩️' : '✓'}
        </span>
      </div>

      {/* Right action - Delete */}
      <div 
        className="swipe-actions swipe-actions-right"
        style={{ 
          width: Math.max(0, -swipeOffset),
          opacity: swipeOffset < 0 ? Math.min(1, -swipeOffset / SWIPE_THRESHOLD) : 0
        }}
      >
        <span className="swipe-action-btn">🗑️</span>
      </div>

      {/* Task content */}
      <div 
        className="swipe-content"
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease'
        }}
      >
        <Task 
          {...props} 
          requestOpenBottomSheet={requestOpenBottomSheet}
        />
      </div>
    </div>
  );
};

export default SwipeableTask;
