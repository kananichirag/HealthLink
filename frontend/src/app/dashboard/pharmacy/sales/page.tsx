'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSales } from '@/hooks/usePharmacyQueries';
import { InvoicePDFViewer } from '@/components/InvoicePDF';

export default function PharmacySalesPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const { data, isLoading, error } = useSales({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 10,
  });
  const sales = Array.isArray(data) ? data : (data as any)?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
        <Link
          href="/dashboard/pharmacy/sales/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          New Bill
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {isLoading && <p className="p-6 text-gray-500">Loading sales...</p>}
        {error && <p className="p-6 text-red-600">Error: {(error as Error).message}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Patient</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Items</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Payment</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      No sales found
                    </td>
                  </tr>
                ) : (
                  sales.map((s: any) => (
                    <React.Fragment key={s.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {s.patient?.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {s.items?.length ?? 0}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          ₹{Number(s.finalAmount ?? s.totalAmount ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {s.paymentMethod || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              setExpandedSaleId(expandedSaleId === s.id ? null : s.id)
                            }
                            className="text-sm text-indigo-600 hover:text-indigo-800"
                          >
                            {expandedSaleId === s.id ? 'Hide Invoice' : 'Invoice'}
                          </button>
                        </td>
                      </tr>
                      {expandedSaleId === s.id && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 bg-gray-50">
                            <InvoicePDFViewer saleId={s.id} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between p-4 border-t">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={sales.length < 10}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
