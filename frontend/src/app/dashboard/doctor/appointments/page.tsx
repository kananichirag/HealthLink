'use client';

import React, { useState, useEffect } from 'react';
import { useDoctorAppointments, type AppointmentFilters } from '@/hooks/useDoctorQueries';
import { Calendar, Clock, User, Filter, X } from 'lucide-react';

const STATUSES = ['', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const;

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  SCHEDULED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  COMPLETED: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export default function DoctorAppointmentsPage() {
  const [filters, setFilters] = useState<AppointmentFilters>({
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data, isLoading, error } = useDoctorAppointments(filters);
  const appointments = Array.isArray(data) ? data : (data as any)?.data ?? [];

  const updateFilter = (key: keyof AppointmentFilters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? Number(value) : 1,
    }));
  };

  const hasActiveFilters = filters.status || filters.startDate || filters.endDate;

  const clearFilters = () => {
    setFilters({ status: '', startDate: '', endDate: '', page: 1, limit: 10 });
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
              <p className="text-gray-600 text-sm mt-1">Manage and track all patient consultations</p>
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
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Appointments</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s || 'All Statuses'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
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
            {filters.status && (
              <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                Status: {filters.status}
              </span>
            )}
            {filters.startDate && (
              <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                From: {filters.startDate}
              </span>
            )}
            {filters.endDate && (
              <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                To: {filters.endDate}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Loading appointments...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700 font-medium">Error loading appointments</p>
            <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <Calendar size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium mb-1">No appointments found</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters or check back later</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((a: any) => {
              const config = statusConfig[a.status] || { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' };
              return (
                <div
                  key={a.id}
                  className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{a.patient?.name || a.patientId}</h3>
                          <p className="text-xs text-gray-500">Patient ID: {a.patientId}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="text-sm">{isClient ? new Date(a.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Loading...'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock size={16} className="text-gray-400" />
                          <span className="text-sm font-medium">{a.timeSlot}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
                          <span className={`text-sm font-medium ${config.text}`}>{a.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                      {a.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && appointments.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => updateFilter('page', Math.max(1, (filters.page || 1) - 1))}
              disabled={(filters.page || 1) <= 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page <span className="font-semibold">{filters.page || 1}</span>
            </span>
            <button
              onClick={() => updateFilter('page', (filters.page || 1) + 1)}
              disabled={appointments.length < (filters.limit || 10)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
