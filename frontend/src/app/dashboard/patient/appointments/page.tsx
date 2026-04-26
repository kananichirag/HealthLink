'use client';

import React, { useState } from 'react';
import {
  useDoctorList,
  useAvailableSlots,
  useBookAppointment,
  useCancelAppointment,
  usePatientAppointments,
  type BookAppointmentInput,
} from '@/hooks/usePatientQueries';

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function PatientAppointmentsPage() {
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: doctorsData } = useDoctorList({ limit: 100 });
  const doctors = Array.isArray(doctorsData) ? doctorsData : (doctorsData as any)?.data ?? [];

  const { data: slotsData, isLoading: slotsLoading } = useAvailableSlots(
    selectedDoctorId,
    selectedDate,
  );
  const slots: string[] = Array.isArray(slotsData) ? slotsData : (slotsData as any)?.slots ?? [];

  const bookAppointment = useBookAppointment();
  const cancelAppointment = useCancelAppointment();

  const { data: appointmentsData, isLoading: apptLoading, error: apptError } =
    usePatientAppointments({ status: statusFilter || undefined, page, limit: 10 });
  const appointments = Array.isArray(appointmentsData)
    ? appointmentsData
    : (appointmentsData as any)?.data ?? [];

  const handleBook = () => {
    if (!selectedDoctorId || !selectedDate || !selectedSlot) return;
    const input: BookAppointmentInput = {
      doctorId: selectedDoctorId,
      date: selectedDate,
      timeSlot: selectedSlot,
    };
    bookAppointment.mutate(input, {
      onSuccess: () => {
        setSelectedSlot('');
      },
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>

      {/* Booking Section */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Book an Appointment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => { setSelectedDoctorId(e.target.value); setSelectedSlot(''); }}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select a doctor</option>
              {doctors.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name || d.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(''); }}
              className="w-full border rounded-lg px-3 py-2"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
            {slotsLoading && selectedDoctorId && selectedDate ? (
              <p className="text-sm text-gray-500 py-2">Loading slots...</p>
            ) : slots.length > 0 ? (
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select a slot</option>
                {slots.map((s: string) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500 py-2">
                {selectedDoctorId && selectedDate ? 'No slots available' : 'Select doctor & date'}
              </p>
            )}
          </div>
        </div>

        {bookAppointment.isError && (
          <p className="text-red-600 text-sm">{(bookAppointment.error as Error).message}</p>
        )}
        {bookAppointment.isSuccess && (
          <p className="text-green-600 text-sm">Appointment booked successfully!</p>
        )}

        <button
          onClick={handleBook}
          disabled={!selectedDoctorId || !selectedDate || !selectedSlot || bookAppointment.isPending}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {bookAppointment.isPending ? 'Booking...' : 'Book Appointment'}
        </button>
      </div>

      {/* Appointment List */}
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
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {apptLoading && <p className="p-6 text-gray-500">Loading appointments...</p>}
        {apptError && <p className="p-6 text-red-600">Error: {(apptError as Error).message}</p>}

        {!apptLoading && !apptError && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Doctor</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Time Slot</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      No appointments found
                    </td>
                  </tr>
                ) : (
                  appointments.map((a: any) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {a.doctor?.name || a.doctor?.email || a.doctorId}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(a.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{a.timeSlot}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status] || 'bg-gray-100'}`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {a.status === 'SCHEDULED' && (
                          <button
                            onClick={() => cancelAppointment.mutate(a.id)}
                            disabled={cancelAppointment.isPending}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {cancelAppointment.isError && (
          <p className="px-4 pb-4 text-red-600 text-sm">
            {(cancelAppointment.error as Error).message}
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
            disabled={appointments.length < 10}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
