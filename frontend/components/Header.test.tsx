import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the api module
jest.mock('@/lib/api');

describe('Header Component', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders user name', () => {
    render(<Header userName="John Doe" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    render(<Header userName="Jane Smith" />);
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();
  });

  it('displays "Logged in" status', () => {
    render(<Header userName="Test User" />);
    expect(screen.getByText('Logged in')).toBeInTheDocument();
  });

  it('redirects to /login when logout button is clicked', () => {
    render(<Header userName="Test User" />);
    const logoutButton = screen.getByRole('button', { name: /logout/i });

    fireEvent.click(logoutButton);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('has proper styling classes', () => {
    const { container } = render(<Header userName="Test User" />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('bg-white', 'shadow-md');
  });

  it('renders logout button with proper styling', () => {
    render(<Header userName="Test User" />);
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toHaveClass('bg-red-600', 'text-white');
  });

  it('renders user info section', () => {
    render(<Header userName="Alice Johnson" />);
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Logged in')).toBeInTheDocument();
  });
});
