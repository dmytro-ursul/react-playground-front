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
  const startXRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [updateTask] = useUpdateTaskMutation();
  const [removeTask] = useRemoveTaskMutation();

  const SWIPE_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    
    // Limit swipe distance
    const clampedDiff = Math.max(-150, Math.min(150, diff));
    setSwipeOffset(clampedDiff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    if (swipeOffset > SWIPE_THRESHOLD) {
      // Swipe right - mark complete/incomplete
      updateTask({
        id: +id,
        name,
        projectId: +projectId,
        completed: !completed,
        dueDate: dueDate || null
      });
    } else if (swipeOffset < -SWIPE_THRESHOLD) {
      // Swipe left - delete
      removeTask(+id);
    }
    
    // Reset position
    setSwipeOffset(0);
  };

  return (
    <div 
      className="swipeable-task"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
        <Task {...props} />
      </div>
    </div>
  );
};

export default SwipeableTask;
