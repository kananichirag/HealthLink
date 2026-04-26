'use client';

import { useState, useEffect } from 'react';
import {
  getSale,
  type SaleResponse,
  type SalePaymentMethod,
} from '../../lib/api';

interface SaleDetailProps {
  saleId: string;
}

// Skeleton loader for sale detail
function SaleDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
      
      {/* Sale info skeleton */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Items table skeleton */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {Array.from({ length: 5 }).map((_, i) => (
                  <th key={i} className="px-6 py-3">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Payment method badge component
function PaymentMethodBadge({ method }: { method: SalePaymentMethod }) {
  const getBadgeColor = (method: SalePaymentMethod) => {
    switch (method) {
      case 'CASH':
        return 'bg-green-100 text-green-800';
      case 'CARD':
        return 'bg-blue-100 text-blue-800';
      case 'ONLINE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBadgeColor(method)}`}>
      {method}
    </span>
  );
}

export default function SaleDetail({ saleId }: SaleDetailProps) {
  const [sale, setSale] = useState<SaleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSale = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading sale:', saleId);
        const saleData = await getSale(saleId);
        console.log('Sale data loaded:', saleData);
        setSale(saleData);
      } catch (err) {
        console.error('Error loading sale:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sale');
      } finally {
        setLoading(false);
      }
    };

    if (saleId) {
      loadSale();
    }
  }, [saleId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="max-w-6xl mx-auto">
          <SaleDetailSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Sale</h3>
            <p className="text-red-700 mb-2">{error}</p>
            <p className="text-sm text-red-600">
              {error.includes('Unauthorized') && 'Please make sure you are logged in with the correct permissions.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Sale Not Found</h3>
            <p className="text-yellow-700">The requested sale could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sale Details</h1>
        <p className="text-gray-600">Sale ID: {sale.id}</p>
      </div>

      {/* Sale Information */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sale Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer Name</label>
            <p className="mt-1 text-sm text-gray-900">{sale.customerName}</p>
          </div>

          {sale.prescriptionId && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Prescription ID</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">{sale.prescriptionId}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <div className="mt-1">
              <PaymentMethodBadge method={sale.paymentMethod} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Subtotal</label>
            <p className="mt-1 text-sm text-gray-900">${sale.subtotal.toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Discount ({sale.discountType === 'PERCENTAGE' ? '%' : '$'})
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {sale.discountType === 'PERCENTAGE' 
                ? `${((sale.discount / sale.subtotal) * 100).toFixed(1)}%` 
                : `$${sale.discount.toFixed(2)}`
              } (-${sale.discount.toFixed(2)})
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tax</label>
            <p className="mt-1 text-sm text-gray-900">${sale.tax.toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Final Amount</label>
            <p className="mt-1 text-lg font-semibold text-gray-900">${sale.finalAmount.toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Created Date</label>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(sale.createdAt).toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Created By</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{sale.createdBy}</p>
          </div>
        </div>
      </div>

      {/* Sale Items */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Sale Items</h2>
        </div>
        
        {!sale.items || sale.items.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No items found for this sale.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medicine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Line Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sale.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.medicineName || 'Unknown Medicine'}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {item.medicineId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {item.batchNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.pricePerUnit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${item.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    Total:
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    ${sale.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Subtotal:</span>
            <span className="text-sm font-medium text-gray-900">${sale.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Discount:</span>
            <span className="text-sm font-medium text-gray-900">-${sale.discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Tax:</span>
            <span className="text-sm font-medium text-gray-900">${sale.tax.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="text-base font-semibold text-gray-900">Final Amount:</span>
            <span className="text-base font-bold text-gray-900">${sale.finalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}