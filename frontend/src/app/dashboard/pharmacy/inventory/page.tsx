'use client';

import React, { useState } from 'react';
import {
  useInventory,
  useInventoryAlerts,
} from '@/hooks/usePharmacyQueries';

const stockBadge = (status: string) => {
  if (status === 'LOW') return 'bg-red-100 text-red-800';
  return 'bg-green-100 text-green-800';
};

function isNearExpiry(expiryDate: string): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 30 && diffDays > 0;
}

function isExpired(expiryDate: string): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

export default function PharmacyInventoryPage() {
  const [search, setSearch] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useInventory({
    search: search || undefined,
    stockStatus: stockStatus || undefined,
    page,
    limit: 10,
  });
  const inventory = Array.isArray(data) ? data : (data as any)?.data ?? [];

  const { data: alertsData } = useInventoryAlerts();
  const alerts = alertsData as any;
  const lowStockAlerts = Array.isArray(alerts?.lowStock) ? alerts.lowStock : [];
  const nearExpiryAlerts = Array.isArray(alerts?.nearExpiry) ? alerts.nearExpiry : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>

      {/* Alerts Section */}
      {(lowStockAlerts.length > 0 || nearExpiryAlerts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockAlerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-red-800 mb-2">
                ⚠ Low Stock ({lowStockAlerts.length})
              </h2>
              <ul className="space-y-1 text-sm text-red-700">
                {lowStockAlerts.slice(0, 5).map((a: any, i: number) => (
                  <li key={i}>
                    {a.name || a.medicine?.name || 'Unknown'} — {a.quantity ?? a.stock ?? '?'} units left
                  </li>
                ))}
                {lowStockAlerts.length > 5 && (
                  <li className="text-red-500">...and {lowStockAlerts.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
          {nearExpiryAlerts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-amber-800 mb-2">
                ⏰ Near Expiry ({nearExpiryAlerts.length})
              </h2>
              <ul className="space-y-1 text-sm text-amber-700">
                {nearExpiryAlerts.slice(0, 5).map((a: any, i: number) => (
                  <li key={i}>
                    {a.name || a.medicine?.name || 'Unknown'} — expires{' '}
                    {a.expiryDate ? new Date(a.expiryDate).toLocaleDateString() : '?'}
                  </li>
                ))}
                {nearExpiryAlerts.length > 5 && (
                  <li className="text-amber-500">...and {nearExpiryAlerts.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Medicine name or batch"
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
            <select
              value={stockStatus}
              onChange={(e) => { setStockStatus(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">All</option>
              <option value="LOW">Low Stock</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>
        </div>

        {isLoading && <p className="p-6 text-gray-500">Loading inventory...</p>}
        {error && <p className="p-6 text-red-600">Error: {(error as Error).message}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Medicine</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Batch</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Quantity</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Expiry</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      No inventory records found
                    </td>
                  </tr>
                ) : (
                  inventory.map((item: any) => {
                    const status = item.stockStatus || (item.quantity < 10 ? 'LOW' : 'NORMAL');
                    const expiry = item.expiryDate || item.expiry;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{item.name || item.medicine?.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.batchNumber || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3">
                          <span className={
                            isExpired(expiry)
                              ? 'text-red-600 font-medium'
                              : isNearExpiry(expiry)
                                ? 'text-amber-600 font-medium'
                                : 'text-gray-600'
                          }>
                            {expiry ? new Date(expiry).toLocaleDateString() : '—'}
                            {isExpired(expiry) && ' (Expired)'}
                            {!isExpired(expiry) && isNearExpiry(expiry) && ' (Expiring soon)'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${stockBadge(status)}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
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
            disabled={inventory.length < 10}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
