import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BottomNav from './BottomNav';

const renderNav = (props: Partial<React.ComponentProps<typeof BottomNav>> = {}) =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <BottomNav onAddClick={jest.fn()} onSearchClick={jest.fn()} {...props} />
    </MemoryRouter>
  );

describe('BottomNav Component', () => {
  const mockOnAddClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all navigation items', () => {
    renderNav({ onAddClick: mockOnAddClick });
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  test('calls onAddClick when Add button is clicked', async () => {
    const user = userEvent.setup();
    renderNav({ onAddClick: mockOnAddClick });
    
    const addButton = screen.getByText('Add').closest('button');
    await user.click(addButton!);
    
    expect(mockOnAddClick).toHaveBeenCalledTimes(1);
  });

  test('applies active class to Home tab by default', () => {
    renderNav({ onAddClick: mockOnAddClick });
    
    const homeButton = screen.getByText('Home').closest('button');
    expect(homeButton).toHaveClass('active');
  });

  test('applies active class to specified tab', () => {
    renderNav({ onAddClick: mockOnAddClick, activeTab: 'search' });
    
    const searchButton = screen.getByText('Search').closest('button');
    expect(searchButton).toHaveClass('active');
  });

  test('renders SVG icons for each nav item', () => {
    renderNav({ onAddClick: mockOnAddClick });
    
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements).toHaveLength(4);
  });
});
