'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPrescriptions, updatePrescriptionStatus, PrescriptionResponse } from '../../lib/api';

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-3 bg-gray-200 rounded w-28" /></td>
      <td className="px-6 py-4"><div className="h-3 bg-gray-200 rounded w-28" /></td>
      <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-full w-20" /></td>
      <td className="px-6 py-4"><div className="h-3 bg-gray-200 rounded w-8" /></td>
      <td className="px-6 py-4"><div className="h-3 bg-gray-200 rounded w-24" /></td>
      <td className="px-6 py-4"><div className="h-3 bg-gray-200 rounded w-16" /></td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    DISPENSED: 'bg-blue-100 text-blue-800 border-blue-200',
    CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${map[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  );
}

export default function PrescriptionList() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchPrescriptions = async (p: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPrescriptions(p, limit);
      setPrescriptions(res.data);
      setTotal(res.total);
      setPage(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrescriptions(1); }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this prescription? Stock will be restored.')) return;
    try {
      await updatePrescriptionStatus(id, 'CANCELLED');
      fetchPrescriptions(page);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel prescription');
    }
  };

  const totalPages = Math.ceil(total / limit);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Prescriptions
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage and track all prescriptions</p>
        </div>
        <Link
          href="/dashboard/prescriptions/new"
          className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Prescription
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-red-800">Error loading prescriptions</h3>
            <p className="mt-0.5 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/80">
                {['Patient ID', 'Doctor ID', 'Status', 'Items', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : prescriptions.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                          <span className="text-3xl">💊</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No prescriptions yet</p>
                        <p className="text-xs text-gray-400">Create your first prescription to get started.</p>
                      </div>
                    </td>
                  </tr>
                )
                : prescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-indigo-50/30 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">{rx.patientId.slice(0, 8)}…</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">{rx.doctorId.slice(0, 8)}…</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={rx.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{rx.itemCount ?? '—'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(rx.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/prescriptions/${rx.id}`}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          View
                        </Link>
                        {rx.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancel(rx.id)}
                            className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchPrescriptions(page - 1)}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => fetchPrescriptions(page + 1)}
                disabled={page === totalPages || loading}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
