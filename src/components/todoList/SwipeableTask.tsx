import React, { useState, useRef, useCallback } from 'react';
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
  const [requestOpenBottomSheet, setRequestOpenBottomSheet] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const hasMoved = useRef(false);
  const startTargetRef = useRef<EventTarget | null>(null);
  
  const [updateTask] = useUpdateTaskMutation();
  const [removeTask] = useRemoveTaskMutation();

  const SWIPE_THRESHOLD = 80;
  const MOVE_THRESHOLD = 10; // Pixels moved to consider it a swipe, not a tap
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    hasMoved.current = false;
    startTargetRef.current = e.target;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startXRef.current;
    const diffY = currentY - startYRef.current;
    
    // Check if user has moved significantly (it's a swipe, not a tap)
    if (Math.abs(diffX) > MOVE_THRESHOLD || Math.abs(diffY) > MOVE_THRESHOLD) {
      hasMoved.current = true;
    }
    
    // Only apply horizontal swipe offset
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
        setRequestOpenBottomSheet(true);
      }
    }
    
    setSwipeOffset(0);
  };

  // Callback when Task has opened the bottom sheet
  const handleBottomSheetOpened = useCallback(() => {
    setRequestOpenBottomSheet(false);
  }, []);

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
          onBottomSheetOpened={handleBottomSheetOpened}
        />
      </div>
    </div>
  );
};

export default SwipeableTask;
