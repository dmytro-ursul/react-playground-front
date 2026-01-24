import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewProjectForm from './NewProjectForm';

// Mock the API slice
const mockCreateProject = jest.fn();

jest.mock('./services/apiSlice', () => ({
  useCreateProjectMutation: () => [mockCreateProject],
}));

describe('NewProjectForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders section title', () => {
    render(<NewProjectForm />);
    
    expect(screen.getByText('🚀 Create New Project')).toBeInTheDocument();
  });

  test('renders project name input', () => {
    render(<NewProjectForm />);
    
    expect(screen.getByPlaceholderText('Enter your project name...')).toBeInTheDocument();
  });

  test('renders Create Project button', () => {
    render(<NewProjectForm />);
    
    expect(screen.getByText('Create Project')).toBeInTheDocument();
  });

  test('updates input value on change', async () => {
    const user = userEvent.setup();
    render(<NewProjectForm />);
    
    const input = screen.getByPlaceholderText('Enter your project name...');
    await user.type(input, 'New Project');
    
    expect(input).toHaveValue('New Project');
  });

  test('calls createProject on form submit', async () => {
    const user = userEvent.setup();
    render(<NewProjectForm />);
    
    const input = screen.getByPlaceholderText('Enter your project name...');
    await user.type(input, 'My New Project');
    
    const submitButton = screen.getByText('Create Project');
    await user.click(submitButton);
    
    expect(mockCreateProject).toHaveBeenCalledWith('My New Project');
  });

  test('resets input after form submission', async () => {
    const user = userEvent.setup();
    render(<NewProjectForm />);
    
    const input = screen.getByPlaceholderText('Enter your project name...') as HTMLInputElement;
    await user.type(input, 'My New Project');
    
    const submitButton = screen.getByText('Create Project');
    await user.click(submitButton);
    
    expect(input).toHaveValue('');
  });

  test('input is required', () => {
    render(<NewProjectForm />);
    
    const input = screen.getByPlaceholderText('Enter your project name...');
    expect(input).toBeRequired();
  });

  test('form has correct CSS class', () => {
    render(<NewProjectForm />);
    
    const form = document.querySelector('form');
    expect(form).toHaveClass('new-project-form');
  });

  test('input has correct CSS class', () => {
    render(<NewProjectForm />);
    
    const input = screen.getByPlaceholderText('Enter your project name...');
    expect(input).toHaveClass('project-input');
  });

  test('button has correct CSS class', () => {
    render(<NewProjectForm />);
    
    const button = screen.getByText('Create Project').closest('button');
    expect(button).toHaveClass('create-project-btn');
  });

  test('renders SVG plus icon in button', () => {
    render(<NewProjectForm />);
    
    const button = screen.getByText('Create Project').closest('button');
    const svg = button?.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
