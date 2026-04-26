import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InventoryTable from './InventoryTable';
import * as api from '../../lib/api';

// Mock the API module
jest.mock('../../lib/api');

const mockMedicines: api.MedicineResponse[] = [
  {
    id: '1',
    name: 'Aspirin',
    batchNumber: 'BATCH001',
    expiryDate: '2025-12-31',
    quantity: 100,
    supplier: 'PharmaCorp',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    stockStatus: 'NORMAL',
    expiryStatus: 'NORMAL',
    daysUntilExpiry: 365,
    isActive: true,
  },
  {
    id: '2',
    name: 'Ibuprofen',
    batchNumber: 'BATCH002',
    expiryDate: '2024-06-30',
    quantity: 5,
    supplier: 'MediSupply',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    stockStatus: 'LOW',
    expiryStatus: 'EXPIRING',
    daysUntilExpiry: 30,
    isActive: true,
  },
  {
    id: '3',
    name: 'Paracetamol',
    batchNumber: 'BATCH003',
    expiryDate: '2023-12-31',
    quantity: 50,
    supplier: 'HealthPlus',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    stockStatus: 'NORMAL',
    expiryStatus: 'EXPIRED',
    daysUntilExpiry: -30,
    isActive: false,
  },
];

const mockPaginatedResponse: api.PaginatedMedicinesResponse = {
  data: mockMedicines,
  total: 3,
  page: 1,
  limit: 10,
  stats: {
    lowStock: 1,
    expiring: 1,
    expired: 1,
    total: 3,
  },
};

describe('InventoryTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (api.getMedicines as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<InventoryTable />);
    expect(screen.getByText(/loading inventory/i)).toBeInTheDocument();
  });

  it('renders medicine table with data', async () => {
    (api.getMedicines as jest.Mock).mockResolvedValue(mockPaginatedResponse);

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText('Aspirin')).toBeInTheDocument();
      expect(screen.getByText('Ibuprofen')).toBeInTheDocument();
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
    });

    expect(screen.getByText('BATCH001')).toBeInTheDocument();
    expect(screen.getByText('BATCH002')).toBeInTheDocument();
    expect(screen.getByText('BATCH003')).toBeInTheDocument();
  });

  it('displays color-coded status indicators', async () => {
    (api.getMedicines as jest.Mock).mockResolvedValue(mockPaginatedResponse);

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText('Low Stock')).toBeInTheDocument();
      expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });
  });

  it('sorts by medicine name when column header is clicked', async () => {
    (api.getMedicines as jest.Mock).mockResolvedValue(mockPaginatedResponse);

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText('Aspirin')).toBeInTheDocument();
    });

    // Initial state is sorted by name ascending
    let rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Aspirin'); // First alphabetically

    const nameHeader = screen.getByText('Medicine Name');
    
    // Click to reverse sort (descending)
    fireEvent.click(nameHeader);
    rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Paracetamol'); // Last alphabetically
  });

  it('sorts by quantity when column header is clicked', async () => {
    (api.getMedicines as jest.Mock).mockResolvedValue(mockPaginatedResponse);

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText('Aspirin')).toBeInTheDocument();
    });

    const quantityHeader = screen.getByText('Quantity');
    fireEvent.click(quantityHeader);

    // Should sort by quantity ascending (5, 50, 100)
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('5 units');
  });

  it('sorts by expiry date when column header is clicked', async () => {
    (api.getMedicines as jest.Mock).mockResolvedValue(mockPaginatedResponse);

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText('Aspirin')).toBeInTheDocument();
    });

    const expiryHeader = screen.getByText('Expiry Date');
    fireEvent.click(expiryHeader);

    // Should sort by expiry date ascending (earliest first)
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Paracetamol'); // Expired (2023)
  });

  it('sorts by status when column header is clicked', async () => {
    (api.getMedicines as jest.Mock).mockResolvedValue(mockPaginatedResponse);

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText('Aspirin')).toBeInTheDocument();
    });

    const statusHeader = screen.getByText('Status');
    fireEvent.click(statusHeader);

    // Should sort by status priority (EXPIRED > EXPIRING > LOW > NORMAL)
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Paracetamol'); // EXPIRED
  });

  it('calls onEdit when edit button is clicked', async () => {
    (api.getMedicines as jest.Mock).mockResolvedValue(mockPaginatedResponse);
    const onEdit = jest.fn();

    render(<InventoryTable onEdit={onEdit} />);

    await waitFor(() => {
      expect(screen.getByText('Aspirin')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Edit medicine');
    fireEvent.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledWith(mockMedicines[0]);
  });

  it('shows delete confirmation modal when delete button is clicked', async () => {
    (api.getMedicines as jest.Mock).mockResolvedValue(mockPaginatedResponse);

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText('Aspirin')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete medicine');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Delete Medicine')).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to delete this medicine/i)
    ).toBeInTheDocument();
  });

  it('deletes medicine when confirmed', async () => {
    (api.getMedicines as jest.Mock).mockResolvedValue(mockPaginatedResponse);
    (api.deleteMedicine as jest.Mock).mockResolvedValue(undefined);

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText('Aspirin')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete medicine');
    fireEvent.click(deleteButtons[0]);

    // Get all delete buttons and find the one in the modal (last one)
    const allDeleteButtons = screen.getAllByRole('button', { name: /delete/i });
    const confirmButton = allDeleteButtons[allDeleteButtons.length - 1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.deleteMedicine).toHaveBeenCalledWith('1');
    });
  });

  it('cancels delete when cancel button is clicked', async () => {
    (api.getMedicines as jest.Mock).mockResolvedValue(mockPaginatedResponse);

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText('Aspirin')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete medicine');
    fireEvent.click(deleteButtons[0]);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Delete Medicine')).not.toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    (api.getMedicines as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('displays empty state when no medicines are found', async () => {
    (api.getMedicines as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      stats: {
        lowStock: 0,
        expiring: 0,
        expired: 0,
        total: 0,
      },
    });

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText('No medicines found')).toBeInTheDocument();
      expect(
        screen.getByText('Get started by adding your first medicine.')
      ).toBeInTheDocument();
    });
  });

  it('calls onAdd when add button is clicked', async () => {
    (api.getMedicines as jest.Mock).mockResolvedValue(mockPaginatedResponse);
    const onAdd = jest.fn();

    render(<InventoryTable onAdd={onAdd} />);

    await waitFor(() => {
      expect(screen.getByText('Aspirin')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add medicine/i });
    fireEvent.click(addButton);

    expect(onAdd).toHaveBeenCalled();
  });

  it('handles pagination correctly', async () => {
    const page1Response = {
      ...mockPaginatedResponse,
      total: 25,
      page: 1,
    };

    (api.getMedicines as jest.Mock).mockResolvedValue(page1Response);

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText('Aspirin')).toBeInTheDocument();
    });

    // Check pagination info - text is split across multiple elements
    const showingTexts = screen.getAllByText(/showing/i);
    expect(showingTexts.length).toBeGreaterThan(0);

    // Click next page - get all next buttons and click the last one (desktop version)
    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    fireEvent.click(nextButtons[nextButtons.length - 1]);

    await waitFor(() => {
      expect(api.getMedicines).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it('displays low stock indicator for medicines below threshold', async () => {
    (api.getMedicines as jest.Mock).mockResolvedValue(mockPaginatedResponse);

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText('Below threshold')).toBeInTheDocument();
    });
  });

  it('formats expiry dates correctly', async () => {
    (api.getMedicines as jest.Mock).mockResolvedValue(mockPaginatedResponse);

    render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText('365 days left')).toBeInTheDocument();
      expect(screen.getByText('30 days left')).toBeInTheDocument();
      expect(screen.getByText('Expired 30 days ago')).toBeInTheDocument();
    });
  });

  it('applies color-coded row styling based on status', async () => {
    (api.getMedicines as jest.Mock).mockResolvedValue(mockPaginatedResponse);

    const { container } = render(<InventoryTable />);

    await waitFor(() => {
      expect(screen.getByText('Aspirin')).toBeInTheDocument();
    });

    const rows = container.querySelectorAll('tbody tr');
    
    // Check that rows with low stock or expiring status have colored backgrounds
    const lowStockRow = Array.from(rows).find(row => 
      row.textContent?.includes('Ibuprofen')
    );
    // Ibuprofen has both LOW stock and EXPIRING status, should have yellow background
    expect(lowStockRow).toHaveClass('bg-yellow-50');

    const expiredRow = Array.from(rows).find(row => 
      row.textContent?.includes('Paracetamol')
    );
    // Paracetamol is EXPIRED, should have red background
    expect(expiredRow).toHaveClass('bg-red-50');
  });
});
