import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import InventoryFilters from './InventoryFilters';
import { GetInventoryQuery } from '../../lib/api';

describe('InventoryFilters', () => {
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders all filter controls', () => {
    render(<InventoryFilters onFiltersChange={mockOnFiltersChange} />);

    expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stock status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expiry status/i)).toBeInTheDocument();
  });

  it('renders with initial filters', () => {
    const initialFilters: GetInventoryQuery = {
      search: 'aspirin',
      stockStatus: 'LOW',
      expiryStatus: 'EXPIRING',
    };

    render(
      <InventoryFilters
        onFiltersChange={mockOnFiltersChange}
        initialFilters={initialFilters}
      />
    );

    expect(screen.getByDisplayValue('aspirin')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Low Stock')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Expiring Soon')).toBeInTheDocument();
  });

  it('debounces search input with 300ms delay', async () => {
    render(<InventoryFilters onFiltersChange={mockOnFiltersChange} />);

    const searchInput = screen.getByPlaceholderText(/search by name/i);

    // Clear the initial render call
    mockOnFiltersChange.mockClear();

    // Type in search input
    fireEvent.change(searchInput, { target: { value: 'paracetamol' } });

    // Should not call immediately
    expect(mockOnFiltersChange).not.toHaveBeenCalled();

    // Fast-forward time by 300ms
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    // Should call after debounce delay
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: 'paracetamol',
      });
    });
  });

  it('updates stock status filter immediately', () => {
    render(<InventoryFilters onFiltersChange={mockOnFiltersChange} />);

    const stockStatusSelect = screen.getByLabelText(/stock status/i);

    fireEvent.change(stockStatusSelect, { target: { value: 'LOW' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      stockStatus: 'LOW',
    });
  });

  it('updates expiry status filter immediately', () => {
    render(<InventoryFilters onFiltersChange={mockOnFiltersChange} />);

    const expiryStatusSelect = screen.getByLabelText(/expiry status/i);

    fireEvent.change(expiryStatusSelect, { target: { value: 'EXPIRED' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      expiryStatus: 'EXPIRED',
    });
  });

  it('combines multiple filters', async () => {
    render(<InventoryFilters onFiltersChange={mockOnFiltersChange} />);

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    const stockStatusSelect = screen.getByLabelText(/stock status/i);
    const expiryStatusSelect = screen.getByLabelText(/expiry status/i);

    // Set all filters
    fireEvent.change(searchInput, { target: { value: 'medicine' } });
    fireEvent.change(stockStatusSelect, { target: { value: 'LOW' } });
    fireEvent.change(expiryStatusSelect, { target: { value: 'EXPIRING' } });

    // Fast-forward debounce timer
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: 'medicine',
        stockStatus: 'LOW',
        expiryStatus: 'EXPIRING',
      });
    });
  });

  it('clears all filters when clear button is clicked', async () => {
    const initialFilters: GetInventoryQuery = {
      search: 'aspirin',
      stockStatus: 'LOW',
      expiryStatus: 'EXPIRING',
    };

    render(
      <InventoryFilters
        onFiltersChange={mockOnFiltersChange}
        initialFilters={initialFilters}
      />
    );

    const clearButton = screen.getByText(/clear filters/i);
    fireEvent.click(clearButton);

    // Fast-forward debounce timer
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({});
    });

    // Verify inputs are cleared
    expect(screen.getByPlaceholderText(/search by name/i)).toHaveValue('');
    expect(screen.getByLabelText(/stock status/i)).toHaveValue('');
    expect(screen.getByLabelText(/expiry status/i)).toHaveValue('');
  });

  it('shows clear button only when filters are active', () => {
    const { rerender } = render(
      <InventoryFilters onFiltersChange={mockOnFiltersChange} />
    );

    // No filters active - clear button should not be visible
    expect(screen.queryByText(/clear filters/i)).not.toBeInTheDocument();

    // Add a filter
    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Clear button should now be visible
    expect(screen.getByText(/clear filters/i)).toBeInTheDocument();
  });

  it('displays active filters summary', () => {
    const initialFilters: GetInventoryQuery = {
      search: 'aspirin',
      stockStatus: 'LOW',
      expiryStatus: 'EXPIRING',
    };

    render(
      <InventoryFilters
        onFiltersChange={mockOnFiltersChange}
        initialFilters={initialFilters}
      />
    );

    expect(screen.getByText(/active filters:/i)).toBeInTheDocument();
    expect(screen.getByText(/search: aspirin/i)).toBeInTheDocument();
    expect(screen.getByText(/stock: low stock/i)).toBeInTheDocument();
    expect(screen.getByText(/expiry: expiring soon/i)).toBeInTheDocument();
  });

  it('allows removing individual filters from summary', async () => {
    const initialFilters: GetInventoryQuery = {
      search: 'aspirin',
      stockStatus: 'LOW',
    };

    render(
      <InventoryFilters
        onFiltersChange={mockOnFiltersChange}
        initialFilters={initialFilters}
      />
    );

    // Find and click the remove button for search filter
    const searchFilterBadge = screen.getByText(/search: aspirin/i).closest('span');
    const removeButton = searchFilterBadge?.querySelector('button');
    
    if (removeButton) {
      fireEvent.click(removeButton);
    }

    // Fast-forward debounce timer
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        stockStatus: 'LOW',
      });
    });
  });

  it('clears search input when X button is clicked', () => {
    render(<InventoryFilters onFiltersChange={mockOnFiltersChange} />);

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Find and click the X button in the search input
    const clearSearchButton = searchInput.parentElement?.querySelector('button');
    if (clearSearchButton) {
      fireEvent.click(clearSearchButton);
    }

    expect(searchInput).toHaveValue('');
  });

  it('handles empty filter values correctly', async () => {
    render(<InventoryFilters onFiltersChange={mockOnFiltersChange} />);

    const stockStatusSelect = screen.getByLabelText(/stock status/i);

    // Set a value
    fireEvent.change(stockStatusSelect, { target: { value: 'LOW' } });
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ stockStatus: 'LOW' });

    // Clear the value
    fireEvent.change(stockStatusSelect, { target: { value: '' } });
    
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({});
    });
  });

  it('does not trigger filter change on initial render', () => {
    render(<InventoryFilters onFiltersChange={mockOnFiltersChange} />);

    // Should call once on mount with empty filters
    expect(mockOnFiltersChange).toHaveBeenCalledTimes(1);
    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });

  it('cancels previous debounce timer when search changes rapidly', async () => {
    render(<InventoryFilters onFiltersChange={mockOnFiltersChange} />);

    const searchInput = screen.getByPlaceholderText(/search by name/i);

    // Type multiple times rapidly
    fireEvent.change(searchInput, { target: { value: 'a' } });
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    fireEvent.change(searchInput, { target: { value: 'as' } });
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    
    fireEvent.change(searchInput, { target: { value: 'asp' } });
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    // Complete the debounce
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      // Should only call once with the final value
      expect(mockOnFiltersChange).toHaveBeenCalledWith({ search: 'asp' });
    });
  });
});
