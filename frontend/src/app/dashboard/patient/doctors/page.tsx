'use client';

import React, { useState } from 'react';
import {
  useDoctorList,
  useConnectWithDoctor,
  type DoctorListFilters,
} from '@/hooks/usePatientQueries';

export default function PatientDoctorsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useDoctorList({ search, page, limit: 10 });
  const connectDoctor = useConnectWithDoctor();

  const doctors = Array.isArray(data) ? data : (data as any)?.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Find a Doctor</h1>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search doctors by name or specialization..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {isLoading && <p className="p-6 text-gray-500">Loading doctors...</p>}
        {error && <p className="p-6 text-red-600">Error: {(error as Error).message}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Clinic</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Specialization</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Availability</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {doctors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      No doctors found
                    </td>
                  </tr>
                ) : (
                  doctors.map((d: any) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{d.name || d.email}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {d.tenant?.name || d.clinicName || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {d.specialization || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            d.isAvailable !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {d.isAvailable !== false ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => connectDoctor.mutate(d.id)}
                          disabled={connectDoctor.isPending || d.isConnected}
                          className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                        >
                          {d.isConnected ? 'Connected' : connectDoctor.isPending ? 'Connecting...' : 'Connect'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {connectDoctor.isError && (
          <p className="px-4 pb-4 text-red-600 text-sm">
            {(connectDoctor.error as Error).message}
          </p>
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
            disabled={doctors.length < 10}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
