import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

describe('Sidebar Component', () => {
  describe('Doctor role', () => {
    it('renders doctor-specific navigation links', () => {
      render(<Sidebar role="DOCTOR" />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Patients')).toBeInTheDocument();
      expect(screen.getByText('Allergy Reports')).toBeInTheDocument();
      expect(screen.getByText('Prescriptions')).toBeInTheDocument();
      expect(screen.getByText('Pharmacy Connections')).toBeInTheDocument();
      expect(screen.getByText('Appointments')).toBeInTheDocument();
      expect(screen.getByText('Schedule')).toBeInTheDocument();
    });

    it('displays DOCTOR role badge', () => {
      render(<Sidebar role="DOCTOR" />);
      expect(screen.getByText('DOCTOR')).toBeInTheDocument();
    });
  });

  describe('Patient role', () => {
    it('renders patient-specific navigation links', () => {
      render(<Sidebar role="PATIENT" />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Doctors')).toBeInTheDocument();
      expect(screen.getByText('Appointments')).toBeInTheDocument();
      expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    });

    it('displays PATIENT role badge', () => {
      render(<Sidebar role="PATIENT" />);
      expect(screen.getByText('PATIENT')).toBeInTheDocument();
    });
  });

  describe('Pharmacy role', () => {
    it('renders pharmacy-specific navigation links', () => {
      render(<Sidebar role="PHARMACY" />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Prescriptions')).toBeInTheDocument();
      expect(screen.getByText('Medicines')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Purchases')).toBeInTheDocument();
      expect(screen.getByText('Sales')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    it('displays PHARMACY role badge', () => {
      render(<Sidebar role="PHARMACY" />);
      expect(screen.getByText('PHARMACY')).toBeInTheDocument();
    });
  });

  describe('Admin role', () => {
    it('renders admin-specific navigation links', () => {
      render(<Sidebar role="ADMIN" />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Tenants')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('displays ADMIN role badge', () => {
      render(<Sidebar role="ADMIN" />);
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
    });
  });

  describe('Mobile responsiveness', () => {
    it('renders hamburger button', () => {
      render(<Sidebar role="DOCTOR" />);
      const hamburgerButton = screen.getByRole('button', {
        name: /toggle sidebar/i,
      });
      expect(hamburgerButton).toBeInTheDocument();
    });

    it('toggles sidebar visibility on hamburger click', () => {
      const { container } = render(<Sidebar role="DOCTOR" />);
      const hamburgerButton = screen.getByRole('button', {
        name: /toggle sidebar/i,
      });

      // Initially sidebar should be hidden on mobile (translate-x-full)
      let aside = container.querySelector('aside');
      expect(aside).toHaveClass('-translate-x-full');

      // Click hamburger to open
      fireEvent.click(hamburgerButton);
      aside = container.querySelector('aside');
      expect(aside).toHaveClass('translate-x-0');

      // Click hamburger to close
      fireEvent.click(hamburgerButton);
      aside = container.querySelector('aside');
      expect(aside).toHaveClass('-translate-x-full');
    });

    it('closes sidebar when overlay is clicked', () => {
      const { container } = render(<Sidebar role="DOCTOR" />);
      const hamburgerButton = screen.getByRole('button', {
        name: /toggle sidebar/i,
      });

      // Open sidebar
      fireEvent.click(hamburgerButton);

      // Find and click overlay
      const overlay = container.querySelector('.bg-black.bg-opacity-50');
      if (overlay) {
        fireEvent.click(overlay);
      }

      // Sidebar should be closed
      const aside = container.querySelector('aside');
      expect(aside).toHaveClass('-translate-x-full');
    });
  });

  describe('Navigation links', () => {
    it('renders all navigation links with correct href attributes', () => {
      render(<Sidebar role="DOCTOR" />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');

      const patientsLink = screen.getByText('Patients').closest('a');
      expect(patientsLink).toHaveAttribute('href', '/dashboard/doctor/patients');
    });
  });

  describe('Styling', () => {
    it('has proper sidebar styling', () => {
      const { container } = render(<Sidebar role="DOCTOR" />);
      const aside = container.querySelector('aside');
      expect(aside).toHaveClass('bg-gradient-to-b', 'from-gray-900', 'text-white', 'shadow-2xl');
    });

    it('renders HealthCare+ branding', () => {
      render(<Sidebar role="DOCTOR" />);
      expect(screen.getByText('HealthCare+')).toBeInTheDocument();
    });

    it('displays role badge with proper styling', () => {
      render(<Sidebar role="DOCTOR" />);
      const roleBadge = screen.getByText('DOCTOR');
      expect(roleBadge).toHaveClass('text-white');
    });
  });
});
