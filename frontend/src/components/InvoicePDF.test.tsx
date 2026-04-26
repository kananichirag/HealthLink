import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { normalizeInvoiceData } from './InvoicePDF';

// Mock @react-pdf/renderer since it doesn't work in jsdom
jest.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: any) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ children }: any) => <div data-testid="pdf-page">{children}</div>,
  Text: ({ children, style }: any) => <span>{children}</span>,
  View: ({ children }: any) => <div>{children}</div>,
  StyleSheet: { create: (s: any) => s },
  pdf: () => ({ toBlob: () => Promise.resolve(new Blob()) }),
}));

// Mock the hooks
const mockUseSaleInvoice = jest.fn();
const mockUseSendBill = jest.fn();

jest.mock('@/hooks/usePharmacyQueries', () => ({
  useSaleInvoice: (...args: any[]) => mockUseSaleInvoice(...args),
  useSendBill: () => mockUseSendBill(),
}));

// Import after mocks
import { InvoicePDFViewer } from './InvoicePDF';

describe('normalizeInvoiceData', () => {
  it('normalizes a standard API response', () => {
    const raw = {
      id: 'INV-001',
      pharmacyName: 'Test Pharmacy',
      pharmacyAddress: '123 Main St',
      patientName: 'John Doe',
      createdAt: '2025-01-15T10:00:00Z',
      items: [
        { name: 'Paracetamol', batchNumber: 'B001', quantity: 2, unitPrice: 10, total: 20 },
      ],
      subtotal: 20,
      discountAmount: 2,
      taxAmount: 1.8,
      finalAmount: 19.8,
      paymentMethod: 'CASH',
    };

    const result = normalizeInvoiceData(raw);

    expect(result.pharmacyName).toBe('Test Pharmacy');
    expect(result.pharmacyAddress).toBe('123 Main St');
    expect(result.invoiceNumber).toBe('INV-001');
    expect(result.patientName).toBe('John Doe');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Paracetamol');
    expect(result.items[0].quantity).toBe(2);
    expect(result.items[0].unitPrice).toBe(10);
    expect(result.items[0].total).toBe(20);
    expect(result.subtotal).toBe(20);
    expect(result.discount).toBe(2);
    expect(result.gst).toBe(1.8);
    expect(result.finalAmount).toBe(19.8);
    expect(result.paymentMethod).toBe('CASH');
  });

  it('handles nested pharmacy and patient objects', () => {
    const raw = {
      id: 'INV-002',
      pharmacy: { name: 'Nested Pharmacy', address: '456 Oak Ave' },
      patient: { name: 'Jane Smith' },
      items: [],
      subtotal: 0,
      finalAmount: 0,
    };

    const result = normalizeInvoiceData(raw);
    expect(result.pharmacyName).toBe('Nested Pharmacy');
    expect(result.pharmacyAddress).toBe('456 Oak Ave');
    expect(result.patientName).toBe('Jane Smith');
  });

  it('provides defaults for missing fields', () => {
    const raw = { items: [] };
    const result = normalizeInvoiceData(raw);

    expect(result.pharmacyName).toBe('Pharmacy');
    expect(result.pharmacyAddress).toBe('');
    expect(result.patientName).toBe('Walk-in Customer');
    expect(result.paymentMethod).toBe('CASH');
    expect(result.subtotal).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.gst).toBe(0);
    expect(result.finalAmount).toBe(0);
  });

  it('computes item total from quantity * unitPrice when total is missing', () => {
    const raw = {
      items: [{ name: 'Med', quantity: 3, unitPrice: 15 }],
      subtotal: 45,
      finalAmount: 45,
    };

    const result = normalizeInvoiceData(raw);
    expect(result.items[0].total).toBe(45);
  });

  it('handles alternative field names (medicineName, pricePerUnit, lineTotal)', () => {
    const raw = {
      items: [
        { medicineName: 'Aspirin', batchNumber: 'B100', quantity: 5, pricePerUnit: 8, lineTotal: 40 },
      ],
      subtotal: 40,
      discount: 5,
      gst: 3.5,
      totalAmount: 38.5,
    };

    const result = normalizeInvoiceData(raw);
    expect(result.items[0].name).toBe('Aspirin');
    expect(result.items[0].unitPrice).toBe(8);
    expect(result.items[0].total).toBe(40);
    expect(result.discount).toBe(5);
    expect(result.gst).toBe(3.5);
    expect(result.finalAmount).toBe(38.5);
  });
});

describe('InvoicePDFViewer', () => {
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSendBill.mockReturnValue({ mutate: mockMutate });
  });

  it('shows loading state', () => {
    mockUseSaleInvoice.mockReturnValue({ data: null, isLoading: true, error: null });
    render(<InvoicePDFViewer saleId="sale-1" />);
    expect(screen.getByText('Loading invoice...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseSaleInvoice.mockReturnValue({ data: null, isLoading: false, error: new Error('fail') });
    render(<InvoicePDFViewer saleId="sale-1" />);
    expect(screen.getByText('Failed to load invoice.')).toBeInTheDocument();
  });

  it('renders invoice details when data is loaded', () => {
    mockUseSaleInvoice.mockReturnValue({
      data: {
        id: 'INV-100',
        pharmacyName: 'My Pharmacy',
        patientName: 'Test Patient',
        items: [{ name: 'Med A', quantity: 1, unitPrice: 50, total: 50 }],
        subtotal: 50,
        finalAmount: 50,
      },
      isLoading: false,
      error: null,
    });

    render(<InvoicePDFViewer saleId="sale-1" />);
    expect(screen.getByText('Invoice')).toBeInTheDocument();
    expect(screen.getByText(/INV-100/)).toBeInTheDocument();
    expect(screen.getByText(/Test Patient/)).toBeInTheDocument();
    expect(screen.getByText('Print Invoice')).toBeInTheDocument();
    expect(screen.getByText('Send Bill to Patient')).toBeInTheDocument();
  });

  it('has format selector with detailed and compact options', () => {
    mockUseSaleInvoice.mockReturnValue({
      data: {
        id: 'INV-100',
        items: [],
        subtotal: 0,
        finalAmount: 0,
      },
      isLoading: false,
      error: null,
    });

    render(<InvoicePDFViewer saleId="sale-1" />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Detailed');
    expect(options[1]).toHaveTextContent('Compact');
  });

  it('calls sendBill mutation when send button is clicked', () => {
    mockUseSaleInvoice.mockReturnValue({
      data: {
        id: 'INV-100',
        items: [],
        subtotal: 0,
        finalAmount: 0,
      },
      isLoading: false,
      error: null,
    });

    render(<InvoicePDFViewer saleId="sale-1" />);
    fireEvent.click(screen.getByText('Send Bill to Patient'));
    expect(mockMutate).toHaveBeenCalledWith('sale-1', expect.any(Object));
  });
});
