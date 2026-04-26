import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MedicineForm from './MedicineForm';
import * as api from '../../lib/api';

// Mock the API module
jest.mock('../../lib/api');

const mockCreateMedicine = api.createMedicine as jest.MockedFunction<typeof api.createMedicine>;
const mockUpdateMedicine = api.updateMedicine as jest.MockedFunction<typeof api.updateMedicine>;
const mockGetMedicines = api.getMedicines as jest.MockedFunction<typeof api.getMedicines>;

describe('MedicineForm', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
    onError: mockOnError,
  };

  const mockMedicine: api.MedicineResponse = {
    id: '1',
    name: 'Aspirin',
    batchNumber: 'BATCH-2024-001',
    expiryDate: '2027-12-31T00:00:00.000Z',
    quantity: 100,
    supplier: 'PharmaCorp',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    stockStatus: 'NORMAL',
    expiryStatus: 'NORMAL',
    daysUntilExpiry: 365,
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMedicines.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 100,
      stats: { lowStock: 0, expiring: 0, expired: 0, total: 0 },
    });
  });

  describe('Rendering', () => {
    it('should render create mode when no medicine is provided', () => {
      render(<MedicineForm {...defaultProps} />);
      
      expect(screen.getByText('💊 Add New Medicine')).toBeInTheDocument();
      expect(screen.getByText('Enter medicine details to add to inventory')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Medicine/i })).toBeInTheDocument();
    });

    it('should render edit mode when medicine is provided', () => {
      render(<MedicineForm {...defaultProps} medicine={mockMedicine} />);
      
      expect(screen.getByText('✏️ Edit Medicine')).toBeInTheDocument();
      expect(screen.getByText('Update medicine information')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Update Medicine/i })).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      const { container } = render(<MedicineForm {...defaultProps} isOpen={false} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should render all form fields', () => {
      render(<MedicineForm {...defaultProps} />);
      
      expect(screen.getByLabelText(/Medicine Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Batch Number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Supplier/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Expiry Date/i)).toBeInTheDocument();
    });
  });

  describe('Form Population', () => {
    it('should populate form fields in edit mode', () => {
      render(<MedicineForm {...defaultProps} medicine={mockMedicine} />);
      
      expect(screen.getByDisplayValue('Aspirin')).toBeInTheDocument();
      expect(screen.getByDisplayValue('BATCH-2024-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('PharmaCorp')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2027-12-31')).toBeInTheDocument();
    });

    it('should reset form when switching from edit to create mode', () => {
      const { rerender } = render(<MedicineForm {...defaultProps} medicine={mockMedicine} />);
      
      expect(screen.getByDisplayValue('Aspirin')).toBeInTheDocument();
      
      rerender(<MedicineForm {...defaultProps} medicine={null} />);
      
      expect(screen.queryByDisplayValue('Aspirin')).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should show error when name is empty', async () => {
      render(<MedicineForm {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /Add Medicine/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    it('should show error when batch number is empty', async () => {
      render(<MedicineForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/Medicine Name/i);
      fireEvent.change(nameInput, { target: { value: 'Test Medicine' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Medicine/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Batch number is required')).toBeInTheDocument();
      });
    });

    it('should show error when batch number has invalid characters', async () => {
      render(<MedicineForm {...defaultProps} />);
      
      const batchInput = screen.getByLabelText(/Batch Number/i);
      fireEvent.change(batchInput, { target: { value: 'BATCH@2024!' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Medicine/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/must be alphanumeric with hyphens and underscores only/i)).toBeInTheDocument();
      });
    });

    it('should show error when batch number already exists', async () => {
      mockGetMedicines.mockResolvedValue({
        data: [mockMedicine],
        total: 1,
        page: 1,
        limit: 100,
        stats: { lowStock: 0, expiring: 0, expired: 0, total: 1 },
      });

      render(<MedicineForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/Medicine Name/i);
      const batchInput = screen.getByLabelText(/Batch Number/i);
      const supplierInput = screen.getByLabelText(/Supplier/i);
      const quantityInput = screen.getByLabelText(/Quantity/i);
      const expiryInput = screen.getByLabelText(/Expiry Date/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test Medicine' } });
      fireEvent.change(batchInput, { target: { value: 'BATCH-2024-001' } });
      fireEvent.change(supplierInput, { target: { value: 'Test Supplier' } });
      fireEvent.change(quantityInput, { target: { value: '50' } });
      fireEvent.change(expiryInput, { target: { value: '2027-12-31' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Medicine/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Batch number already exists')).toBeInTheDocument();
      });
    });

    it('should show error when expiry date is in the past', async () => {
      render(<MedicineForm {...defaultProps} />);
      
      const expiryInput = screen.getByLabelText(/Expiry Date/i);
      fireEvent.change(expiryInput, { target: { value: '2020-01-01' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Medicine/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Expiry date must be in the future')).toBeInTheDocument();
      });
    });

    it('should show error when quantity is negative', async () => {
      render(<MedicineForm {...defaultProps} />);
      
      // Fill in all required fields except quantity with valid data
      const nameInput = screen.getByLabelText(/Medicine Name/i);
      const batchInput = screen.getByLabelText(/Batch Number/i);
      const supplierInput = screen.getByLabelText(/Supplier/i);
      const quantityInput = screen.getByLabelText(/Quantity/i);
      const expiryInput = screen.getByLabelText(/Expiry Date/i);
      
      fireEvent.change(nameInput, { target: { value: 'Test Medicine' } });
      fireEvent.change(batchInput, { target: { value: 'BATCH-TEST-001' } });
      fireEvent.change(supplierInput, { target: { value: 'Test Supplier' } });
      fireEvent.change(expiryInput, { target: { value: '2027-12-31' } });
      fireEvent.change(quantityInput, { target: { value: '-5' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Medicine/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Quantity must be a non-negative number')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show error when supplier is empty', async () => {
      render(<MedicineForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/Medicine Name/i);
      fireEvent.change(nameInput, { target: { value: 'Test Medicine' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Medicine/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Supplier is required')).toBeInTheDocument();
      });
    });

    it('should show low stock warning when quantity is below 10', () => {
      render(<MedicineForm {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText(/Quantity/i);
      fireEvent.change(quantityInput, { target: { value: '5' } });
      
      expect(screen.getByText(/Low stock warning/i)).toBeInTheDocument();
    });

    it('should show expiring soon warning when date is within 30 days', () => {
      render(<MedicineForm {...defaultProps} />);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const dateString = futureDate.toISOString().split('T')[0];
      
      const expiryInput = screen.getByLabelText(/Expiry Date/i);
      fireEvent.change(expiryInput, { target: { value: dateString } });
      
      expect(screen.getByText(/Expiring soon/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should create medicine with valid data', async () => {
      mockCreateMedicine.mockResolvedValue(mockMedicine);

      render(<MedicineForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/Medicine Name/i);
      const batchInput = screen.getByLabelText(/Batch Number/i);
      const supplierInput = screen.getByLabelText(/Supplier/i);
      const quantityInput = screen.getByLabelText(/Quantity/i);
      const expiryInput = screen.getByLabelText(/Expiry Date/i);
      
      fireEvent.change(nameInput, { target: { value: 'Aspirin' } });
      fireEvent.change(batchInput, { target: { value: 'BATCH-2024-001' } });
      fireEvent.change(supplierInput, { target: { value: 'PharmaCorp' } });
      fireEvent.change(quantityInput, { target: { value: '100' } });
      fireEvent.change(expiryInput, { target: { value: '2027-12-31' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Medicine/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockCreateMedicine).toHaveBeenCalledWith({
          name: 'Aspirin',
          batchNumber: 'BATCH-2024-001',
          supplier: 'PharmaCorp',
          quantity: 100,
          expiryDate: '2027-12-31',
        });
        expect(mockOnSuccess).toHaveBeenCalledWith(mockMedicine);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should update medicine in edit mode', async () => {
      mockUpdateMedicine.mockResolvedValue(mockMedicine);

      render(<MedicineForm {...defaultProps} medicine={mockMedicine} />);
      
      const nameInput = screen.getByLabelText(/Medicine Name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Aspirin' } });
      
      const submitButton = screen.getByRole('button', { name: /Update Medicine/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockUpdateMedicine).toHaveBeenCalledWith('1', {
          name: 'Updated Aspirin',
          batchNumber: 'BATCH-2024-001',
          supplier: 'PharmaCorp',
          quantity: 100,
          expiryDate: '2027-12-31',
        });
        expect(mockOnSuccess).toHaveBeenCalledWith(mockMedicine);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle API errors during creation', async () => {
      mockCreateMedicine.mockRejectedValue(new Error('Failed to create medicine'));

      render(<MedicineForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/Medicine Name/i);
      const batchInput = screen.getByLabelText(/Batch Number/i);
      const supplierInput = screen.getByLabelText(/Supplier/i);
      const quantityInput = screen.getByLabelText(/Quantity/i);
      const expiryInput = screen.getByLabelText(/Expiry Date/i);
      
      fireEvent.change(nameInput, { target: { value: 'Aspirin' } });
      fireEvent.change(batchInput, { target: { value: 'BATCH-2024-001' } });
      fireEvent.change(supplierInput, { target: { value: 'PharmaCorp' } });
      fireEvent.change(quantityInput, { target: { value: '100' } });
      fireEvent.change(expiryInput, { target: { value: '2027-12-31' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Medicine/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Failed to create medicine');
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it('should not skip batch number uniqueness check in edit mode when batch number changes', async () => {
      mockGetMedicines.mockResolvedValue({
        data: [{ ...mockMedicine, batchNumber: 'BATCH-2024-002' }],
        total: 1,
        page: 1,
        limit: 100,
        stats: { lowStock: 0, expiring: 0, expired: 0, total: 1 },
      });

      render(<MedicineForm {...defaultProps} medicine={mockMedicine} />);
      
      const batchInput = screen.getByLabelText(/Batch Number/i);
      fireEvent.change(batchInput, { target: { value: 'BATCH-2024-002' } });
      
      const submitButton = screen.getByRole('button', { name: /Update Medicine/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockGetMedicines).toHaveBeenCalled();
        expect(screen.getByText('Batch number already exists')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should close form when cancel button is clicked', () => {
      render(<MedicineForm {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close form when close icon is clicked', () => {
      render(<MedicineForm {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: '' });
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should clear error when user starts typing', async () => {
      render(<MedicineForm {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /Add Medicine/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
      
      const nameInput = screen.getByLabelText(/Medicine Name/i);
      fireEvent.change(nameInput, { target: { value: 'Test' } });
      
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });

    it('should disable form during submission', async () => {
      mockCreateMedicine.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<MedicineForm {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/Medicine Name/i);
      const batchInput = screen.getByLabelText(/Batch Number/i);
      const supplierInput = screen.getByLabelText(/Supplier/i);
      const quantityInput = screen.getByLabelText(/Quantity/i);
      const expiryInput = screen.getByLabelText(/Expiry Date/i);
      
      fireEvent.change(nameInput, { target: { value: 'Aspirin' } });
      fireEvent.change(batchInput, { target: { value: 'BATCH-2024-001' } });
      fireEvent.change(supplierInput, { target: { value: 'PharmaCorp' } });
      fireEvent.change(quantityInput, { target: { value: '100' } });
      fireEvent.change(expiryInput, { target: { value: '2027-12-31' } });
      
      const submitButton = screen.getByRole('button', { name: /Add Medicine/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });
});
