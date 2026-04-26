'use client';

import React, { useState } from 'react';
import { useDoctorAppointments, type AppointmentFilters } from '@/hooks/useDoctorQueries';

const STATUSES = ['', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const;

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function DoctorAppointmentsPage() {
  const [filters, setFilters] = useState<AppointmentFilters>({
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  });

  const { data, isLoading, error } = useDoctorAppointments(filters);
  const appointments = Array.isArray(data) ? data : (data as any)?.data ?? [];

  const updateFilter = (key: keyof AppointmentFilters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? Number(value) : 1,
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>

      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s || 'All'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => updateFilter('startDate', e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => updateFilter('endDate', e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>
        <button
          onClick={() => setFilters({ status: '', startDate: '', endDate: '', page: 1, limit: 10 })}
          className="text-sm text-indigo-600 hover:underline"
        >
          Clear Filters
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {isLoading && <p className="p-6 text-gray-500">Loading appointments...</p>}
        {error && <p className="p-6 text-red-600">Error: {(error as Error).message}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Patient</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Time Slot</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {appointments.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No appointments found</td></tr>
                ) : (
                  appointments.map((a: any) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{a.patient?.name || a.patientId}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-600">{a.timeSlot}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status] || 'bg-gray-100'}`}>
                          {a.status}
                        </span>
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
            onClick={() => updateFilter('page', Math.max(1, (filters.page || 1) - 1))}
            disabled={(filters.page || 1) <= 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {filters.page || 1}</span>
          <button
            onClick={() => updateFilter('page', (filters.page || 1) + 1)}
            disabled={appointments.length < (filters.limit || 10)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
