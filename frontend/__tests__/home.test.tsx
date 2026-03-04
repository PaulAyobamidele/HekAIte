import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import HomePage from '../app/page';

describe('HomePage', () => {
  it('renders hero section when logged out', () => {
    render(<HomePage />);
    expect(screen.getByText('AI Guardian')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders evaluation form', () => {
    render(<HomePage />);
    expect(screen.getByText('Evaluate LLM Output')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('sk_...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What was the original prompt?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste the LLM response here')).toBeInTheDocument();
  });

  it('shows empty result state', () => {
    render(<HomePage />);
    expect(screen.getByText('Run an evaluation to see results')).toBeInTheDocument();
  });
});
