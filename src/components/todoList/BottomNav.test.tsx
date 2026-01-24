import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BottomNav from './BottomNav';

describe('BottomNav Component', () => {
  const mockOnAddClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all navigation items', () => {
    render(<BottomNav onAddClick={mockOnAddClick} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  test('calls onAddClick when Add button is clicked', async () => {
    const user = userEvent.setup();
    render(<BottomNav onAddClick={mockOnAddClick} />);
    
    const addButton = screen.getByText('Add').closest('button');
    await user.click(addButton!);
    
    expect(mockOnAddClick).toHaveBeenCalledTimes(1);
  });

  test('applies active class to Home tab by default', () => {
    render(<BottomNav onAddClick={mockOnAddClick} />);
    
    const homeButton = screen.getByText('Home').closest('button');
    expect(homeButton).toHaveClass('active');
  });

  test('applies active class to specified tab', () => {
    render(<BottomNav onAddClick={mockOnAddClick} activeTab="search" />);
    
    const searchButton = screen.getByText('Search').closest('button');
    expect(searchButton).toHaveClass('active');
  });

  test('renders SVG icons for each nav item', () => {
    render(<BottomNav onAddClick={mockOnAddClick} />);
    
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements).toHaveLength(4);
  });
});
