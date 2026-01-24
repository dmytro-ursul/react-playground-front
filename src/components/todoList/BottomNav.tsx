import React from 'react';

interface BottomNavProps {
  onAddClick: () => void;
  activeTab?: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ onAddClick, activeTab = 'home' }) => {
  return (
    <nav className="bottom-nav">
      <button className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9,22 9,12 15,12 15,22" />
        </svg>
        <span>Home</span>
      </button>

      <button className="bottom-nav-item" onClick={onAddClick}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <span>Add</span>
      </button>

      <button className={`bottom-nav-item ${activeTab === 'search' ? 'active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span>Search</span>
      </button>

      <button className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Profile</span>
      </button>
    </nav>
  );
};

export default BottomNav;
