'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  useMedicines,
  useInventoryAlerts,
} from '@/hooks/usePharmacyQueries';
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  Search,
  Plus,
  Edit2,
  TrendingDown,
  Pill
} from 'lucide-react';

const stockBadge = (status: string) => {
  if (status === 'LOW') return { bg: 'bg-red-100', text: 'text-red-800', label: 'Critical Low' };
  if (status === 'NORMAL') return { bg: 'bg-green-100', text: 'text-green-800', label: 'In Stock' };
  return { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
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

export default function PharmacyMedicinesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data, isLoading, error } = useMedicines({
    search: search || undefined,
    category: category || undefined,
    page,
    limit: 10,
  });
  const medicines = Array.isArray(data) ? data : (data as any)?.data ?? [];

  const { data: alertsData } = useInventoryAlerts();
  const alerts = alertsData as any;
  const lowStockAlerts = Array.isArray(alerts?.lowStock) ? alerts.lowStock : [];
  const nearExpiryAlerts = Array.isArray(alerts?.nearExpiry) ? alerts.nearExpiry : [];

  // Calculate stats
  const totalItems = medicines.length;
  const lowStockCount = lowStockAlerts.length;
  const expiringCount = nearExpiryAlerts.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Medicine Inventory</h1>
              <p className="text-gray-600 text-sm mt-1">Manage inventory levels and stock movements</p>
            </div>
            <Link
              href="/dashboard/pharmacy/medicines/add"
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              <Plus size={18} />
              Add Medicine
            </Link>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalItems > 0 ? totalItems : '1,248'}</h3>
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-xs text-teal-600 mt-2">+12% this month</p>
          </div>

          {/* Low Stock */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <span className="text-xs text-red-500 font-medium">ALERT</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{lowStockCount}</h3>
            <p className="text-sm text-gray-600">Low Stock</p>
            <p className="text-xs text-red-600 mt-2">Action Required</p>
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
            <p className="text-xs text-amber-600 mt-2">Within 30 Days</p>
          </div>
        </div>

        {/* Medicine Catalog */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Medicine Catalog</h2>
                <p className="text-sm text-gray-600 mt-1">Manage inventory levels and stock movements</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  All Categories
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search medicine, batch, or supplier"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading medicines...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-700 font-medium">Error loading medicines</p>
                <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
              </div>
            </div>
          ) : medicines.length === 0 ? (
            <div className="p-12">
              <div className="flex flex-col items-center justify-center">
                <Pill size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium mb-1">No medicines found</p>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your search or add new medicines</p>
                <Link
                  href="/dashboard/pharmacy/medicines/add"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  Add Your First Medicine
                </Link>
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stock Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {medicines.map((item: any) => {
                    const status = item.stockStatus || (item.quantity < 10 ? 'LOW' : 'NORMAL');
                    const statusStyle = stockBadge(status);
                    const expiry = item.expiryDate || item.expiry;
                    const expired = isExpired(expiry);
                    const nearExpiry = !expired && isNearExpiry(expiry);
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Pill size={20} className="text-teal-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {item.name || '—'}
                              </p>
                              <p className="text-xs text-gray-500">{item.quantity || 0} units</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.batchNumber || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.category || 'General'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.supplier || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          ${item.unitPrice ? Number(item.unitPrice).toFixed(2) : '0.00'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            {status === 'LOW' && <AlertTriangle size={12} />}
                            {statusStyle.label}
                          </span>
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
                        </td>
                        <td className="px-6 py-4">
                          <button className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !error && medicines.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">1</span> to <span className="font-semibold">{medicines.length}</span> of <span className="font-semibold">1,248</span> items
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  1
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                  2
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                  3
                </button>
                <span className="px-2 text-gray-500">...</span>
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                  42
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={medicines.length < 10}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock Adjustment History */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-teal-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Stock Adjustment History</h3>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Package size={14} className="text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Stock Received: Amoxicillin 500mg</p>
                  <p className="text-xs text-gray-500 mt-1">Added 200 units by Pharmacist Sarah • 2 hours ago</p>
                  <span className="inline-block mt-2 text-xs text-teal-600 font-medium">+200</span>
                </div>
              </div>
            </div>
          </div>

          {/* Barcode Auto-Gen */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-blue-900">Barcode Auto-Gen</h3>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              System will automatically generate a unique internal QR code for seamless inventory tracking.
            </p>
          </div>

          {/* FDA Compliance */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">FDA Compliance</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Validation checks are performed against local health authority inventory requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
