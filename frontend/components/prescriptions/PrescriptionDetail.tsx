'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPrescription, updatePrescriptionStatus, PrescriptionResponse } from '../../lib/api';

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white/80 rounded-2xl shadow-lg border border-white/50 p-6 space-y-4">
        <div className="h-5 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-gray-100 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white/80 rounded-2xl shadow-lg border border-white/50 p-6 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    DISPENSED: 'bg-blue-100 text-blue-800 border-blue-200',
    CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${map[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  );
}

export default function PrescriptionDetail({ id }: { id: string }) {
  const [prescription, setPrescription] = useState<PrescriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPrescription(id);
        setPrescription(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prescription');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Cancel this prescription? Stock will be restored.')) return;
    try {
      setCancelling(true);
      const updated = await updatePrescriptionStatus(id, 'CANCELLED');
      setPrescription(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel prescription');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <SkeletonDetail />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div>
          <h3 className="text-sm font-semibold text-red-800">Error</h3>
          <p className="mt-0.5 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!prescription) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard/prescriptions" className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Prescriptions
            </Link>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Prescription Details
          </h1>
        </div>
        {prescription.status === 'PENDING' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="inline-flex items-center px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl hover:bg-red-100 transition-all duration-200 disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Cancel Prescription'}
          </button>
        )}
      </div>

      {/* Meta */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Prescription Info</h2>
          <StatusBadge status={prescription.status} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Prescription ID</p>
            <p className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg">{prescription.id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Patient ID</p>
            <p className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg">{prescription.patientId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Doctor ID</p>
            <p className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg">{prescription.doctorId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Created</p>
            <p className="text-sm text-gray-900">{formatDate(prescription.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Prescribed Medicines</h2>
        </div>
        {!prescription.items || prescription.items.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">No items found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/80">
                  {['Medicine', 'Quantity', 'Added'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {prescription.items.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-indigo-600">{item.medicineName.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{item.medicineName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{item.quantity} units</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
