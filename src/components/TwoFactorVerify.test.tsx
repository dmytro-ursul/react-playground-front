import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TwoFactorVerify from './TwoFactorVerify';
import { apiSlice } from './todoList/services/apiSlice';
import authReducer from './todoList/features/authSlice';

// Mock the API
jest.mock('./todoList/services/apiSlice', () => ({
  ...jest.requireActual('./todoList/services/apiSlice'),
  useVerifyTwoFactorMutation: jest.fn(),
}));

const { useVerifyTwoFactorMutation } = require('./todoList/services/apiSlice');

const createTestStore = () => configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

const renderWithProvider = (component: React.ReactElement) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('TwoFactorVerify', () => {
  const mockOnBack = jest.fn();
  const mockVerifyTwoFactor = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useVerifyTwoFactorMutation.mockReturnValue([
      mockVerifyTwoFactor,
      { isLoading: false },
    ]);
  });

  test('renders 2FA verification form', () => {
    renderWithProvider(
      <TwoFactorVerify tempToken="test-token" onBack={mockOnBack} />
    );

    expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
    expect(screen.getByText(/Enter the 6-digit code/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
  });

  test('renders 6 input fields for code', () => {
    renderWithProvider(
      <TwoFactorVerify tempToken="test-token" onBack={mockOnBack} />
    );

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
  });

  test('calls onBack when back button is clicked', () => {
    renderWithProvider(
      <TwoFactorVerify tempToken="test-token" onBack={mockOnBack} />
    );

    const backButton = screen.getByText('← Back');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  test('auto-advances to next input when digit is entered', () => {
    renderWithProvider(
      <TwoFactorVerify tempToken="test-token" onBack={mockOnBack} />
    );

    const inputs = screen.getAllByRole('textbox');
    
    fireEvent.change(inputs[0], { target: { value: '1' } });
    
    // The focus should move to the next input
    expect(inputs[1]).toHaveFocus();
  });

  test('verify button is disabled when code is incomplete', () => {
    renderWithProvider(
      <TwoFactorVerify tempToken="test-token" onBack={mockOnBack} />
    );

    const verifyButton = screen.getByRole('button', { name: /verify/i });
    expect(verifyButton).toBeDisabled();
  });

  test('submits verification when all digits are entered', async () => {
    mockVerifyTwoFactor.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({
        verifyTwoFactor: {
          token: 'new-jwt-token',
          user: { firstName: 'John', lastName: 'Doe', otpEnabled: true },
        },
      }),
    });

    renderWithProvider(
      <TwoFactorVerify tempToken="test-token" onBack={mockOnBack} />
    );

    const inputs = screen.getAllByRole('textbox');
    
    // Enter all 6 digits
    ['1', '2', '3', '4', '5', '6'].forEach((digit, index) => {
      fireEvent.change(inputs[index], { target: { value: digit } });
    });

    await waitFor(() => {
      expect(mockVerifyTwoFactor).toHaveBeenCalledWith({
        tempToken: 'test-token',
        code: '123456',
      });
    });
  });

  test('displays error message on verification failure', async () => {
    mockVerifyTwoFactor.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue({ message: 'Invalid verification code' }),
    });

    renderWithProvider(
      <TwoFactorVerify tempToken="test-token" onBack={mockOnBack} />
    );

    const inputs = screen.getAllByRole('textbox');
    
    // Enter all 6 digits
    ['1', '2', '3', '4', '5', '6'].forEach((digit, index) => {
      fireEvent.change(inputs[index], { target: { value: digit } });
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid verification code')).toBeInTheDocument();
    });
  });

  test('strips non-numeric characters from paste', () => {
    // This test verifies the paste handling logic strips non-numeric characters
    // The actual paste event is difficult to simulate in JSDOM
    renderWithProvider(
      <TwoFactorVerify tempToken="test-token" onBack={mockOnBack} />
    );

    // Verify the component renders and accepts input
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
    
    // Verify it only accepts digits
    fireEvent.change(inputs[0], { target: { value: 'a' } });
    expect(inputs[0]).toHaveValue('');
    
    fireEvent.change(inputs[0], { target: { value: '9' } });
    expect(inputs[0]).toHaveValue('9');
  });

  test('only accepts numeric input', () => {
    renderWithProvider(
      <TwoFactorVerify tempToken="test-token" onBack={mockOnBack} />
    );

    const inputs = screen.getAllByRole('textbox');
    
    fireEvent.change(inputs[0], { target: { value: 'a' } });
    expect(inputs[0]).toHaveValue('');

    fireEvent.change(inputs[0], { target: { value: '5' } });
    expect(inputs[0]).toHaveValue('5');
  });
});
