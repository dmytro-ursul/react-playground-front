import React from 'react';

interface FABProps {
  onClick: () => void;
  isOpen?: boolean;
}

const FloatingActionButton: React.FC<FABProps> = ({ onClick, isOpen = false }) => {
  return (
    <div className="fab-container">
      <button 
        className={`fab-button ${isOpen ? 'fab-open' : ''}`}
        onClick={onClick}
        aria-label="Add new task"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
};

export default FloatingActionButton;
