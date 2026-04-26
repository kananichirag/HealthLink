'use client';

import React, { useState, useEffect } from 'react';
import {
  getMedicines,
  deleteMedicine,
  MedicineResponse,
  GetInventoryQuery,
  PaginatedMedicinesResponse,
} from '../../lib/api';

type SortField = 'name' | 'batchNumber' | 'quantity' | 'expiryDate' | 'status';
type SortDirection = 'asc' | 'desc';

interface InventoryTableProps {
  onEdit?: (medicine: MedicineResponse) => void;
  onAdd?: () => void;
  filters?: GetInventoryQuery;
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-200 flex-shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-28" />
            <div className="h-3 bg-gray-100 rounded w-20" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-md w-24" /></td>
      <td className="px-6 py-4"><div className="h-3 bg-gray-200 rounded w-16" /></td>
      <td className="px-6 py-4">
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-100 rounded w-16" />
        </div>
      </td>
      <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-full w-16" /></td>
      <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded-lg w-20 ml-auto" /></td>
    </tr>
  );
}

export default function InventoryTable({ onEdit, onAdd, filters = {} }: InventoryTableProps) {
  const [medicines, setMedicines] = useState<MedicineResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, [page, filters]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: PaginatedMedicinesResponse = await getMedicines({ page, limit, ...filters });
      setMedicines(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(true);
      await deleteMedicine(id);
      setDeleteConfirm(null);
      fetchMedicines();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete medicine');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const getStatusBadges = (medicine: MedicineResponse) => {
    const badges: React.ReactNode[] = [];
    if (medicine.expiryStatus === 'EXPIRED')
      badges.push(<span key="exp" className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">Expired</span>);
    else if (medicine.expiryStatus === 'EXPIRING')
      badges.push(<span key="expiring" className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">Expiring Soon</span>);
    if (medicine.stockStatus === 'LOW')
      badges.push(<span key="low" className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 border border-orange-200">Low Stock</span>);
    if (badges.length === 0)
      badges.push(<span key="ok" className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">Normal</span>);
    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  const getRowAccent = (medicine: MedicineResponse) => {
    if (medicine.expiryStatus === 'EXPIRED') return 'border-l-red-400 bg-red-50/30';
    if (medicine.expiryStatus === 'EXPIRING') return 'border-l-yellow-400 bg-yellow-50/30';
    if (medicine.stockStatus === 'LOW') return 'border-l-orange-400 bg-orange-50/20';
    return 'border-l-transparent';
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
    return sortDirection === 'asc'
      ? <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
      : <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
  };

  const sortedMedicines = [...medicines].sort((a, b) => {
    let aVal: string | number, bVal: string | number;
    switch (sortField) {
      case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
      case 'batchNumber': aVal = a.batchNumber.toLowerCase(); bVal = b.batchNumber.toLowerCase(); break;
      case 'quantity': aVal = a.quantity; bVal = b.quantity; break;
      case 'expiryDate': aVal = new Date(a.expiryDate).getTime(); bVal = new Date(b.expiryDate).getTime(); break;
      case 'status': {
        const p = (m: MedicineResponse) => m.expiryStatus === 'EXPIRED' ? 0 : m.expiryStatus === 'EXPIRING' ? 1 : m.stockStatus === 'LOW' ? 2 : 3;
        aVal = p(a); bVal = p(b); break;
      }
      default: return 0;
    }
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Medicine Inventory</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {loading ? 'Loading...' : `Showing ${medicines.length} of ${total} medicines`}
          </p>
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Medicine
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/80">
                {[
                  { label: 'Medicine Name', field: 'name' as SortField },
                  { label: 'Batch Number', field: 'batchNumber' as SortField },
                  { label: 'Quantity', field: 'quantity' as SortField },
                  { label: 'Expiry Date', field: 'expiryDate' as SortField },
                  { label: 'Status', field: 'status' as SortField },
                ].map((col) => (
                  <th
                    key={col.field}
                    onClick={() => handleSort(col.field)}
                    className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {getSortIcon(col.field)}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : sortedMedicines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">No medicines found</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or add a new medicine.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedMedicines.map((medicine) => (
                  <tr key={medicine.id} className={`border-l-4 hover:bg-indigo-50/20 transition-colors duration-150 ${getRowAccent(medicine)}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-indigo-600">{medicine.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{medicine.name}</p>
                          <p className="text-xs text-gray-500">{medicine.supplier}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 font-mono bg-gray-100 px-2 py-0.5 rounded-md">{medicine.batchNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{medicine.quantity} units</p>
                      {medicine.stockStatus === 'LOW' && (
                        <p className="text-xs text-orange-600 font-medium">Below threshold</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{formatDate(medicine.expiryDate)}</p>
                      <p className="text-xs text-gray-400">
                        {medicine.daysUntilExpiry > 0
                          ? `${medicine.daysUntilExpiry} days left`
                          : `Expired ${Math.abs(medicine.daysUntilExpiry)} days ago`}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadges(medicine)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(medicine)}
                            title="Edit medicine"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-150"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm(medicine.id)}
                          title="Delete medicine"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-150"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-700">{(page - 1) * limit + 1}</span>–
              <span className="font-semibold text-gray-700">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-semibold text-gray-700">{total}</span> results
            </p>
            <nav className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Medicine</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6 bg-gray-50 rounded-xl p-3">
              Are you sure you want to permanently delete this medicine from the inventory?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteLoading}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteLoading}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-semibold shadow hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none transition-all duration-200"
              >
                {deleteLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
