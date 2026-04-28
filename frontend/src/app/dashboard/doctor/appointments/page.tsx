'use client';

import React, { useState, useEffect } from 'react';
import {
  useDoctorAppointments,
  useDoctorCancelAppointment,
  useCompleteAppointment,
  type AppointmentFilters,
} from '@/hooks/useDoctorQueries';
import ConfirmationPopup from '@/components/ConfirmationPopup';
import DoctorRescheduleForm from '@/components/DoctorRescheduleForm';
import { formatTimeToAMPM, formatSlotRange } from '@/utils/timeFormat';
import { Calendar, Clock, User, Filter, X, AlertCircle, CheckCircle, Tag, AlertTriangle } from 'lucide-react';

const STATUSES = ['', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const;

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  SCHEDULED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Scheduled' },
  COMPLETED: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Completed' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Cancelled' },
};

function isOverdue(appt: any): boolean {
  if (appt.status !== 'SCHEDULED') return false;
  if (appt.isOverdue !== undefined) return appt.isOverdue;
  try {
    const d = new Date(appt.date);
    const slot: string = appt.timeSlot || '';
    if (slot.includes('AM') || slot.includes('PM')) {
      const [time, period] = slot.split(' ');
      const [h, m] = time.split(':').map(Number);
      let hours = h;
      if (period === 'PM' && h !== 12) hours += 12;
      if (period === 'AM' && h === 12) hours = 0;
      d.setHours(hours, m, 0, 0);
    }
    return d < new Date();
  } catch {
    return false;
  }
}

export default function DoctorAppointmentsPage() {
  const [filters, setFilters] = useState<AppointmentFilters>({ status: '', startDate: '', endDate: '', page: 1, limit: 10 });
  const [showFilters, setShowFilters] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Cancel state
  const [cancelPopupOpen, setCancelPopupOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Complete state
  const [completePopupOpen, setCompletePopupOpen] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<string | null>(null);

  // Reschedule state
  const [rescheduleAppt, setRescheduleAppt] = useState<any | null>(null);

  useEffect(() => { setIsClient(true); }, []);

  const { data, isLoading, error } = useDoctorAppointments(filters);
  const appointments = Array.isArray(data) ? data : (data as any)?.data ?? [];

  const cancelAppointment = useDoctorCancelAppointment();
  const completeAppointment = useCompleteAppointment();

  const updateFilter = (key: keyof AppointmentFilters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? Number(value) : 1 }));
  };

  const hasActiveFilters = filters.status || filters.startDate || filters.endDate;

  const clearFilters = () => {
    setFilters({ status: '', startDate: '', endDate: '', page: 1, limit: 10 });
    setShowFilters(false);
  };

  const handleCancelConfirm = () => {
    if (!appointmentToCancel) return;
    cancelAppointment.mutate(appointmentToCancel, {
      onSuccess: () => {
        setCancelSuccess(true);
        setCancelPopupOpen(false);
        setAppointmentToCancel(null);
        setTimeout(() => setCancelSuccess(false), 3000);
      },
      onError: (err: any) => {
        setCancelError(err?.message || 'Failed to cancel appointment');
        setCancelPopupOpen(false);
      },
    });
  };

  const handleCompleteConfirm = () => {
    if (!appointmentToComplete) return;
    completeAppointment.mutate(appointmentToComplete, {
      onSuccess: () => {
        setCompletePopupOpen(false);
        setAppointmentToComplete(null);
      },
      onError: (err: any) => {
        setCancelError(err?.message || 'Failed to complete appointment');
        setCompletePopupOpen(false);
      },
    });
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
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                  {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input type="date" value={filters.startDate} onChange={(e) => updateFilter('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input type="date" value={filters.endDate} onChange={(e) => updateFilter('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={clearFilters} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium">Clear Filters</button>
              <button onClick={() => setShowFilters(false)} className="px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors font-medium">Apply Filters</button>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="text-gray-500">Active filters:</span>
            {filters.status && <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">Status: {filters.status}</span>}
            {filters.startDate && <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">From: {filters.startDate}</span>}
            {filters.endDate && <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">To: {filters.endDate}</span>}
          </div>
        )}

        {/* Global messages */}
        {cancelError && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{cancelError}</p>
          </div>
        )}
        {cancelSuccess && (
          <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">Appointment cancelled successfully.</p>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700 font-medium">Error loading appointments</p>
            <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 flex flex-col items-center justify-center">
            <Calendar size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-600 font-medium mb-1">No appointments found</p>
            <p className="text-gray-500 text-sm">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((a: any) => {
              const config = statusConfig[a.status] || { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500', label: a.status };
              const overdue = isClient && isOverdue(a);
              const isRescheduled = a.isRescheduled || (Array.isArray(a.tags) && a.tags.includes('Rescheduled'));

              return (
                <div key={a.id} className={`bg-white rounded-lg border p-5 hover:shadow-md transition-shadow ${overdue ? 'border-orange-300' : 'border-gray-200'}`}>
                  {/* Overdue banner */}
                  {overdue && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                      <AlertTriangle size={16} className="text-orange-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-orange-700">This appointment is overdue</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{a.patient?.name || a.patientId}</h3>
                          <p className="text-xs text-gray-500">Patient</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="text-sm">{isClient ? new Date(a.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock size={16} className="text-gray-400" />
                          <span className="text-sm font-medium">{formatSlotRange(a.timeSlot)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
                          <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {isRescheduled && (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                            <Tag size={10} />
                            Rescheduled
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                      {config.label}
                    </div>
                  </div>

                  {/* Action buttons */}
                  {a.status === 'SCHEDULED' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                      {/* Cancel — no time restriction for doctors */}
                      <button
                        onClick={() => { setAppointmentToCancel(a.id); setCancelError(null); setCancelSuccess(false); setCancelPopupOpen(true); }}
                        className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>

                      {/* Reschedule — available for overdue or any scheduled */}
                      {(overdue || a.status === 'SCHEDULED') && (
                        <button
                          onClick={() => setRescheduleAppt(a)}
                          className="px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                        >
                          Reschedule
                        </button>
                      )}

                      {/* Complete */}
                      <button
                        onClick={() => { setAppointmentToComplete(a.id); setCompletePopupOpen(true); }}
                        className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Complete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && appointments.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => updateFilter('page', Math.max(1, (filters.page || 1) - 1))} disabled={(filters.page || 1) <= 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
              Previous
            </button>
            <span className="text-sm text-gray-600">Page <span className="font-semibold">{filters.page || 1}</span></span>
            <button onClick={() => updateFilter('page', (filters.page || 1) + 1)} disabled={appointments.length < (filters.limit || 10)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
              Next
            </button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation */}
      <ConfirmationPopup
        isOpen={cancelPopupOpen}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment?"
        confirmText="Yes, Cancel"
        cancelText="No, Keep"
        variant="danger"
        onConfirm={handleCancelConfirm}
        onCancel={() => { setCancelPopupOpen(false); setAppointmentToCancel(null); }}
      />

      {/* Complete Confirmation */}
      <ConfirmationPopup
        isOpen={completePopupOpen}
        title="Complete Appointment"
        message="Mark this appointment as completed?"
        confirmText="Yes, Complete"
        cancelText="Cancel"
        variant="info"
        onConfirm={handleCompleteConfirm}
        onCancel={() => { setCompletePopupOpen(false); setAppointmentToComplete(null); }}
      />

      {/* Reschedule Form */}
      {rescheduleAppt && (
        <DoctorRescheduleForm
          appointmentId={rescheduleAppt.id}
          doctorId={rescheduleAppt.doctorId}
          patientName={rescheduleAppt.patient?.name || 'Patient'}
          currentDate={new Date(rescheduleAppt.date)}
          currentSlot={rescheduleAppt.timeSlot}
          onSuccess={() => setRescheduleAppt(null)}
          onCancel={() => setRescheduleAppt(null)}
        />
      )}
    </div>
  );
}
