'use client';

import React, { useState, useEffect } from 'react';
import {
  useInventory,
  useInventoryAlerts,
} from '@/hooks/usePharmacyQueries';
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  Search,
  Filter,
  X,
  TrendingDown,
  RotateCcw,
  History
} from 'lucide-react';

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
  const [showFilters, setShowFilters] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Calculate stats
  const totalItems = inventory.length;
  const lowStockCount = lowStockAlerts.length;
  const expiringCount = nearExpiryAlerts.length;

  const clearFilters = () => {
    setSearch('');
    setStockStatus('');
    setPage(1);
    setShowFilters(false);
  };

  const hasActiveFilters = search || stockStatus;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Medicine Inventory</h1>
              <p className="text-gray-600 text-sm mt-1">Manage stock levels and track medicine availability</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              <Filter size={18} />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Package size={24} className="text-teal-600" />
              </div>
              <span className="text-xs text-gray-500 font-medium">TOTAL</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalItems}</h3>
            <p className="text-sm text-gray-600">Total Items</p>
          </div>

          {/* Low Stock */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown size={24} className="text-red-600" />
              </div>
              <span className="text-xs text-red-500 font-medium">ALERT</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{lowStockCount}</h3>
            <p className="text-sm text-gray-600">Low Stock</p>
          </div>

          {/* Expiring Soon */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock size={24} className="text-amber-600" />
              </div>
              <span className="text-xs text-amber-500 font-medium">WARNING</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{expiringCount}</h3>
            <p className="text-sm text-gray-600">Expiring Soon</p>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Inventory</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Medicine</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Medicine name or batch number"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                <select
                  value={stockStatus}
                  onChange={(e) => { setStockStatus(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="LOW">Low Stock</option>
                  <option value="NORMAL">Normal</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Active Filters Badge */}
        {hasActiveFilters && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="text-gray-500">Active filters:</span>
            {search && (
              <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                Search: {search}
              </span>
            )}
            {stockStatus && (
              <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                Status: {stockStatus}
              </span>
            )}
          </div>
        )}

        {/* Medicine Catalog */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Medicine Catalog</h2>
            <p className="text-sm text-gray-600 mt-1">Complete inventory of available medicines</p>
          </div>

          {isLoading ? (
            <div className="p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading inventory...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-700 font-medium">Error loading inventory</p>
                <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
              </div>
            </div>
          ) : inventory.length === 0 ? (
            <div className="p-12">
              <div className="flex flex-col items-center justify-center">
                <Package size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium mb-1">No inventory records found</p>
                <p className="text-gray-500 text-sm">Try adjusting your filters or add new medicines</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Medicine Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Batch No.</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventory.map((item: any) => {
                    const status = item.stockStatus || (item.quantity < 10 ? 'LOW' : 'NORMAL');
                    const expiry = item.expiryDate || item.expiry;
                    const expired = isExpired(expiry);
                    const nearExpiry = !expired && isNearExpiry(expiry);
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">
                            {item.name || item.medicine?.name || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.batchNumber || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.category || 'General'}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{item.quantity} units</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={
                            expired
                              ? 'text-red-600 font-medium text-sm'
                              : nearExpiry
                                ? 'text-amber-600 font-medium text-sm'
                                : 'text-gray-600 text-sm'
                          }>
                            {expiry && isClient ? new Date(expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </span>
                          {expired && (
                            <span className="ml-2 text-xs text-red-600">(Expired)</span>
                          )}
                          {nearExpiry && (
                            <span className="ml-2 text-xs text-amber-600">(Expiring soon)</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${stockBadge(status)}`}>
                            {status === 'LOW' && <AlertTriangle size={12} />}
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !error && inventory.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page <span className="font-semibold">{page}</span>
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={inventory.length < 10}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Stock Adjustment History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <History size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Stock Adjustment History</h2>
                <p className="text-sm text-gray-600">Recent inventory changes</p>
              </div>
            </div>
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <History size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent adjustments</p>
              </div>
            </div>
          </div>

          {/* Automated Reordering */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <RotateCcw size={20} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Automated Reordering</h2>
                <p className="text-sm text-gray-600">Smart inventory management</p>
              </div>
            </div>
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <RotateCcw size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Auto-reorder feature coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
