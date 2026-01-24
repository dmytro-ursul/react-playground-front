import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FloatingActionButton from './FloatingActionButton';

describe('FloatingActionButton Component', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders FAB button', () => {
    render(<FloatingActionButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: /add new task/i });
    expect(button).toBeInTheDocument();
  });

  test('calls onClick when button is clicked', async () => {
    const user = userEvent.setup();
    render(<FloatingActionButton onClick={mockOnClick} />);
    
    const button = screen.getByRole('button', { name: /add new task/i });
    await user.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('applies fab-open class when isOpen is true', () => {
    render(<FloatingActionButton onClick={mockOnClick} isOpen={true} />);
    
    const button = screen.getByRole('button', { name: /add new task/i });
    expect(button).toHaveClass('fab-open');
  });

  test('does not apply fab-open class when isOpen is false', () => {
    render(<FloatingActionButton onClick={mockOnClick} isOpen={false} />);
    
    const button = screen.getByRole('button', { name: /add new task/i });
    expect(button).not.toHaveClass('fab-open');
  });

  test('renders SVG plus icon', () => {
    render(<FloatingActionButton onClick={mockOnClick} />);
    
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  test('has accessible label', () => {
    render(<FloatingActionButton onClick={mockOnClick} />);
    
    const button = screen.getByLabelText('Add new task');
    expect(button).toBeInTheDocument();
  });
});
