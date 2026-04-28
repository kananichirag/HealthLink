import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RescheduleForm from './RescheduleForm';

// Mock the useAvailableSlots hook
jest.mock('@/hooks/usePatientQueries', () => ({
  useAvailableSlots: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockUseAvailableSlots = require('@/hooks/usePatientQueries').useAvailableSlots;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const defaultProps = {
  appointmentId: 'test-appointment-id',
  doctorId: 'test-doctor-id',
  doctorName: 'Dr. Smith',
  currentDate: new Date('2025-05-15T10:00:00Z'),
  currentSlot: '14:30',
  onSuccess: jest.fn(),
  onCancel: jest.fn(),
};

describe('RescheduleForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAvailableSlots.mockReturnValue({
      data: { slots: ['09:00', '10:00', '14:00', '15:30'] },
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the form with current appointment details', () => {
    render(<RescheduleForm {...defaultProps} />, { wrapper: createWrapper() });
    
    expect(screen.getByRole('heading', { name: 'Reschedule Appointment' })).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('2:30 PM')).toBeInTheDocument(); // Formatted current slot
    expect(screen.getByLabelText('New Date')).toBeInTheDocument();
    expect(screen.getByLabelText('New Time Slot')).toBeInTheDocument();
  });

  it('disables past dates in date picker', () => {
    render(<RescheduleForm {...defaultProps} />, { wrapper: createWrapper() });
    
    const dateInput = screen.getByLabelText('New Date') as HTMLInputElement;
    const today = new Date().toISOString().split('T')[0];
    
    expect(dateInput.min).toBe(today);
  });

  it('formats time slots in AM/PM format', async () => {
    render(<RescheduleForm {...defaultProps} />, { wrapper: createWrapper() });
    
    // Select a date first
    const dateInput = screen.getByLabelText('New Date');
    fireEvent.change(dateInput, { target: { value: '2025-05-20' } });
    
    await waitFor(() => {
      const timeSelect = screen.getByLabelText('New Time Slot');
      expect(timeSelect).toBeInTheDocument();
    });
    
    // Check that time slots are formatted in AM/PM
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('2:00 PM')).toBeInTheDocument();
    expect(screen.getByText('3:30 PM')).toBeInTheDocument();
  });

  it('shows loading state when fetching slots', () => {
    mockUseAvailableSlots.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<RescheduleForm {...defaultProps} />, { wrapper: createWrapper() });
    
    const dateInput = screen.getByLabelText('New Date');
    fireEvent.change(dateInput, { target: { value: '2025-05-20' } });
    
    expect(screen.getByText('Loading available slots...')).toBeInTheDocument();
  });

  it('shows message when no slots are available', () => {
    mockUseAvailableSlots.mockReturnValue({
      data: { slots: [] },
      isLoading: false,
    });

    render(<RescheduleForm {...defaultProps} />, { wrapper: createWrapper() });
    
    const dateInput = screen.getByLabelText('New Date');
    fireEvent.change(dateInput, { target: { value: '2025-05-20' } });
    
    expect(screen.getByText('No available slots for this date')).toBeInTheDocument();
  });

  it('validates form submission', async () => {
    render(<RescheduleForm {...defaultProps} />, { wrapper: createWrapper() });
    
    const submitButton = screen.getByRole('button', { name: 'Reschedule Appointment' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please select both date and time slot')).toBeInTheDocument();
    });
  });

  it('handles successful form submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<RescheduleForm {...defaultProps} />, { wrapper: createWrapper() });
    
    // Fill out the form
    const dateInput = screen.getByLabelText('New Date');
    fireEvent.change(dateInput, { target: { value: '2025-05-20' } });
    
    await waitFor(() => {
      const timeSelect = screen.getByLabelText('New Time Slot');
      fireEvent.change(timeSelect, { target: { value: '09:00' } });
    });
    
    const submitButton = screen.getByRole('button', { name: 'Reschedule Appointment' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Appointment rescheduled successfully!')).toBeInTheDocument();
    });
    
    // Check that the API was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/patient/appointments/test-appointment-id/reschedule',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newDate: '2025-05-20',
          newTimeSlot: '09:00',
        }),
      }
    );
  });

  it('handles API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Cannot reschedule appointment within 30 minutes of scheduled time' }),
    });

    render(<RescheduleForm {...defaultProps} />, { wrapper: createWrapper() });
    
    // Fill out the form
    const dateInput = screen.getByLabelText('New Date');
    fireEvent.change(dateInput, { target: { value: '2025-05-20' } });
    
    await waitFor(() => {
      const timeSelect = screen.getByLabelText('New Time Slot');
      fireEvent.change(timeSelect, { target: { value: '09:00' } });
    });
    
    const submitButton = screen.getByRole('button', { name: 'Reschedule Appointment' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Cannot reschedule appointment within 30 minutes of scheduled time')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<RescheduleForm {...defaultProps} />, { wrapper: createWrapper() });
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('calls onCancel when backdrop is clicked', () => {
    render(<RescheduleForm {...defaultProps} />, { wrapper: createWrapper() });
    
    const backdrop = document.querySelector('.bg-black.bg-opacity-50');
    fireEvent.click(backdrop!);
    
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('resets time slot when date changes', async () => {
    render(<RescheduleForm {...defaultProps} />, { wrapper: createWrapper() });
    
    const dateInput = screen.getByLabelText('New Date');
    fireEvent.change(dateInput, { target: { value: '2025-05-20' } });
    
    await waitFor(() => {
      const timeSelect = screen.getByLabelText('New Time Slot') as HTMLSelectElement;
      fireEvent.change(timeSelect, { target: { value: '09:00' } });
      expect(timeSelect.value).toBe('09:00');
    });
    
    // Change date again
    fireEvent.change(dateInput, { target: { value: '2025-05-21' } });
    
    await waitFor(() => {
      const timeSelect = screen.getByLabelText('New Time Slot') as HTMLSelectElement;
      expect(timeSelect.value).toBe('');
    });
  });
});

// Test time formatting utility function
describe('formatTimeToAMPM', () => {
  // Since the function is internal, we'll test it through the component behavior
  it('correctly formats 24-hour time to AM/PM', () => {
    render(<RescheduleForm {...defaultProps} />, { wrapper: createWrapper() });
    
    // The current slot "14:30" should be displayed as "2:30 PM"
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
  });
});