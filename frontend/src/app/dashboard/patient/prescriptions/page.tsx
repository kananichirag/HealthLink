'use client';

import React, { useState } from 'react';
import {
  usePatientPrescriptions,
  usePatientPrescriptionDetail,
} from '@/hooks/usePatientQueries';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  DISPENSED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function PatientPrescriptionsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState('');

  const { data, isLoading, error } = usePatientPrescriptions({
    status: statusFilter || undefined,
    page,
    limit: 10,
  });
  const prescriptions = Array.isArray(data) ? data : (data as any)?.data ?? [];

  const { data: detail, isLoading: detailLoading } = usePatientPrescriptionDetail(selectedId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>

      {/* Detail Modal */}
      {selectedId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Prescription Details</h2>
              <button
                onClick={() => setSelectedId('')}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>
            {detailLoading ? (
              <p className="p-6 text-gray-500">Loading details...</p>
            ) : detail ? (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Doctor:</span>{' '}
                    <span className="font-medium">
                      {(detail as any).doctor?.name || (detail as any).doctor?.email || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>{' '}
                    <span className="font-medium">
                      {new Date((detail as any).createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>{' '}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${statusColors[(detail as any).status] || 'bg-gray-100'}`}
                    >
                      {(detail as any).status}
                    </span>
                  </div>
                  {(detail as any).targetPharmacy && (
                    <div>
                      <span className="text-gray-500">Pharmacy:</span>{' '}
                      <span className="font-medium">
                        {(detail as any).targetPharmacy.name || (detail as any).targetPharmacy.email}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Medicines</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-gray-600">Medicine</th>
                          <th className="px-3 py-2 text-gray-600">Dosage</th>
                          <th className="px-3 py-2 text-gray-600">Frequency</th>
                          <th className="px-3 py-2 text-gray-600">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {((detail as any).items || []).map((item: any, i: number) => (
                          <tr key={i}>
                            <td className="px-3 py-2">{item.medicineName || item.medicine?.name || '—'}</td>
                            <td className="px-3 py-2 text-gray-600">{item.dosage || '—'}</td>
                            <td className="px-3 py-2 text-gray-600">{item.frequency || '—'}</td>
                            <td className="px-3 py-2 text-gray-600">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <p className="p-6 text-gray-500">No details available</p>
            )}
          </div>
        </div>
      )}

      {/* Prescription List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="DISPENSED">Dispensed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {isLoading && <p className="p-6 text-gray-500">Loading prescriptions...</p>}
        {error && <p className="p-6 text-red-600">Error: {(error as Error).message}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Doctor</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Medicines</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Pharmacy</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {prescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      No prescriptions found
                    </td>
                  </tr>
                ) : (
                  prescriptions.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {p.doctor?.name || p.doctor?.email || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {(p.items || []).length} item{(p.items || []).length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${statusColors[p.status] || 'bg-gray-100'}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.targetPharmacy?.name || p.targetPharmacy?.email || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedId(p.id)}
                          className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
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
            disabled={prescriptions.length < 10}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
