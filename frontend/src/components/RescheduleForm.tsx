'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAvailableSlots, useRescheduleAppointment } from '@/hooks/usePatientQueries';
import { formatTimeToAMPM, formatSlotRange, formatDate, getTodayDateString } from '@/utils/timeFormat';

interface RescheduleFormProps {
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  currentDate: Date;
  currentSlot: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const RescheduleForm: React.FC<RescheduleFormProps> = ({
  appointmentId,
  doctorId,
  doctorName,
  currentDate,
  currentSlot,
  onSuccess,
  onCancel,
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const today = getTodayDateString();

  const { data: slotsData, isLoading: slotsLoading } = useAvailableSlots(doctorId, selectedDate);
  const slots: string[] = Array.isArray(slotsData) ? slotsData : (slotsData as any)?.slots ?? [];

  const rescheduleAppointment = useRescheduleAppointment();
  const isSubmitting = rescheduleAppointment.isPending;

  const handleSubmit = async () => {
    if (!selectedDate || !selectedSlot) {
      setError('Please select both date and time slot');
      return;
    }
    setError(null);
    try {
      await rescheduleAppointment.mutateAsync({
        appointmentId,
        data: { newDate: selectedDate, newTimeSlot: selectedSlot },
      });
      setSuccess(true);
      setTimeout(() => onSuccess(), 1000);
    } catch (err: any) {
      const msg = err?.message || 'An unexpected error occurred';
      setError(msg);
    }
  };

  useEffect(() => {
    setSelectedSlot('');
  }, [selectedDate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-lg max-w-lg w-full mx-4 p-6">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Reschedule Appointment</h2>
          <p className="text-gray-600 text-sm">Select a new date and time for your appointment</p>
        </div>

        {/* Current Appointment Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Current Appointment</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User size={16} className="text-gray-400 flex-shrink-0" />
              <span>{doctorName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar size={16} className="text-gray-400 flex-shrink-0" />
              <span>{formatDate(currentDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock size={16} className="text-gray-400 flex-shrink-0" />
              <span>{formatSlotRange(currentSlot)}</span>
            </div>
          </div>
        </div>

        {/* New Date and Time Selection */}
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="new-date" className="block text-sm font-semibold text-gray-700 mb-2">New Date</label>
            <input
              id="new-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="new-time-slot" className="block text-sm font-semibold text-gray-700 mb-2">New Time Slot</label>
            {slotsLoading && selectedDate ? (
              <div className="flex items-center gap-2 py-2.5 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin"></div>
                Loading available slots...
              </div>
            ) : slots.length > 0 ? (
              <select
                id="new-time-slot"
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select a time slot</option>
                {slots.map((slot: string) => (
                  <option key={slot} value={slot}>{formatSlotRange(slot)}</option>
                ))}
              </select>
            ) : selectedDate ? (
              <p className="text-sm text-gray-500 py-2.5">No available slots for this date</p>
            ) : (
              <p className="text-sm text-gray-500 py-2.5">Please select a date first</p>
            )}
          </div>
        </div>

        {error && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">Appointment rescheduled successfully!</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedDate || !selectedSlot}
            className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? 'Rescheduling...' : 'Reschedule Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleForm;
