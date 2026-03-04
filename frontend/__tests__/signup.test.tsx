import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockSignup = jest.fn();
jest.mock('../lib/auth', () => ({
  useAuth: () => ({
    signup: mockSignup,
    user: null,
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import SignupPage from '../app/signup/page';

describe('SignupPage', () => {
  beforeEach(() => {
    mockSignup.mockReset();
  });

  it('renders signup form', () => {
    render(<SignupPage />);
    expect(screen.getByText('Create account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Choose a username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('At least 8 characters')).toBeInTheDocument();
  });

  it('submits signup form', async () => {
    mockSignup.mockResolvedValueOnce(undefined);
    render(<SignupPage />);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'new@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Choose a username'), {
      target: { value: 'newuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('new@test.com', 'newuser', 'password123');
    });
  });

  it('shows error on duplicate email', async () => {
    mockSignup.mockRejectedValueOnce({
      response: { data: { detail: 'Email already registered' } },
    });
    render(<SignupPage />);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'dup@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Choose a username'), {
      target: { value: 'dupuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('At least 8 characters'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });

  it('has link to login', () => {
    render(<SignupPage />);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });
});
