'use client';

import { useState, useEffect } from 'react';
import {
  getSaleInvoice,
  type InvoiceResponse,
} from '../../lib/api';

interface InvoicePreviewProps {
  saleId: string;
}

// Skeleton loader for invoice
function InvoiceSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="text-center mb-8">
        <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-28 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between py-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function InvoicePreview({ saleId }: InvoicePreviewProps) {
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading invoice:', saleId);
        const invoiceData = await getSaleInvoice(saleId);
        console.log('Invoice data loaded:', invoiceData);
        setInvoice(invoiceData);
      } catch (err) {
        console.error('Error loading invoice:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    if (saleId) {
      loadInvoice();
    }
  }, [saleId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Invoice Preview</h2>
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <InvoiceSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Preview</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Preview</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Invoice not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header with Print Button */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200 print:hidden">
        <h2 className="text-lg font-semibold text-gray-900">Invoice Preview</h2>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Invoice
        </button>
      </div>

      {/* Invoice Content */}
      <div className="p-8 print:p-4" id="invoice-content">
        {/* Pharmacy Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{invoice.pharmacyName}</h1>
          <p className="text-gray-600">{invoice.pharmacyAddress}</p>
        </div>

        {/* Invoice Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Bill To:
            </h3>
            <p className="text-gray-900 font-medium">{invoice.customerName}</p>
          </div>
          <div className="md:text-right">
            <div className="mb-2">
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Invoice #:
              </span>
              <span className="ml-2 text-gray-900 font-mono">{invoice.invoiceNumber}</span>
            </div>
            <div className="mb-2">
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Date:
              </span>
              <span className="ml-2 text-gray-900">
                {new Date(invoice.invoiceDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Payment Method:
              </span>
              <span className="ml-2 text-gray-900">{invoice.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Items
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medicine
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.medicineName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {item.batchNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ${item.pricePerUnit.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      ${item.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm">
            <div className="space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm text-gray-900">${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-600">Discount:</span>
                  <span className="text-sm text-gray-900">-${invoice.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-sm text-gray-600">Tax:</span>
                  <span className="text-sm text-gray-900">${invoice.taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Total:</span>
                  <span className="text-base font-bold text-gray-900">
                    ${invoice.finalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Thank you for your business!
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            margin: 0.5in;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:p-4 {
            padding: 1rem !important;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          /* Hide everything except the invoice content when printing */
          body * {
            visibility: hidden;
          }
          
          #invoice-content,
          #invoice-content * {
            visibility: visible;
          }
          
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}