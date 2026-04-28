'use client';

import React, { useState, useEffect } from 'react';
import {
  useDoctorList,
  useAvailableSlots,
  useBookAppointment,
  useCancelAppointment,
  usePatientAppointments,
  type BookAppointmentInput,
} from '@/hooks/usePatientQueries';
import ConfirmationPopup from '@/components/ConfirmationPopup';
import RescheduleForm from '@/components/RescheduleForm';
import { formatTimeToAMPM, formatSlotRange } from '@/utils/timeFormat';
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  HelpCircle,
  Tag,
} from 'lucide-react';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  SCHEDULED: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Scheduled' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
};

const TABS = ['Upcoming', 'Past', 'Cancelled'] as const;
type Tab = typeof TABS[number];

const tabToStatus: Record<Tab, string> = {
  Upcoming: 'SCHEDULED',
  Past: 'COMPLETED',
  Cancelled: 'CANCELLED',
};

interface BookingFormErrors {
  doctor?: string;
  date?: string;
  slot?: string;
  terms?: string;
}

export default function PatientAppointmentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Upcoming');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formErrors, setFormErrors] = useState<BookingFormErrors>({});
  const [page, setPage] = useState(1);
  const [showBooking, setShowBooking] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Cancel confirmation state
  const [cancelPopupOpen, setCancelPopupOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Reschedule state
  const [rescheduleAppt, setRescheduleAppt] = useState<any | null>(null);

  useEffect(() => { setIsClient(true); }, []);

  const today = new Date().toISOString().split('T')[0];
  const statusFilter = tabToStatus[activeTab];

  const { data: doctorsData } = useDoctorList({ limit: 100 });
  const doctors = Array.isArray(doctorsData) ? doctorsData : (doctorsData as any)?.data ?? [];

  const { data: slotsData, isLoading: slotsLoading } = useAvailableSlots(selectedDoctorId, selectedDate);
  const slots: string[] = Array.isArray(slotsData) ? slotsData : (slotsData as any)?.slots ?? [];

  const bookAppointment = useBookAppointment();
  const cancelAppointment = useCancelAppointment();

  const { data: appointmentsData, isLoading: apptLoading, error: apptError } =
    usePatientAppointments({ status: statusFilter || undefined, page, limit: 10 });
  const appointments = Array.isArray(appointmentsData)
    ? appointmentsData
    : (appointmentsData as any)?.data ?? [];

  // ── Booking form validation ──
  const validateForm = (): boolean => {
    const errors: BookingFormErrors = {};
    if (!selectedDoctorId) errors.doctor = 'This field is required';
    if (!selectedDate) errors.date = 'This field is required';
    else if (selectedDate < today) errors.date = 'Please select a future date';
    if (!selectedSlot) errors.slot = 'Please select a time slot';
    if (!termsAccepted) errors.terms = 'You must accept the terms and conditions';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBook = () => {
    if (!validateForm()) return;
    const input: BookAppointmentInput = { doctorId: selectedDoctorId, date: selectedDate, timeSlot: selectedSlot };
    bookAppointment.mutate(input, {
      onSuccess: () => {
        setSelectedSlot('');
        setSelectedDate('');
        setSelectedDoctorId('');
        setTermsAccepted(false);
        setFormErrors({});
        setShowBooking(false);
      },
    });
  };

  // ── Cancel flow ──
  const handleCancelClick = (id: string) => {
    setAppointmentToCancel(id);
    setCancelError(null);
    setCancelSuccess(false);
    setCancelPopupOpen(true);
  };

  const handleCancelConfirm = () => {
    if (!appointmentToCancel) return;
    cancelAppointment.mutate(appointmentToCancel, {
      onSuccess: () => {
        setCancelSuccess(true);
        setCancelPopupOpen(false);
        setAppointmentToCancel(null);
      },
      onError: (err: any) => {
        setCancelError(err?.message || 'Failed to cancel appointment');
        setCancelPopupOpen(false);
      },
    });
  };

  const isWithin30Minutes = (appt: any): boolean => {
    try {
      const apptDate = new Date(appt.date);
      const timeSlot = appt.timeSlot || '';
      if (timeSlot.includes('AM') || timeSlot.includes('PM')) {
        const [time, period] = timeSlot.split(' ');
        const [h, m] = time.split(':').map(Number);
        let hours = h;
        if (period === 'PM' && h !== 12) hours += 12;
        if (period === 'AM' && h === 12) hours = 0;
        apptDate.setHours(hours, m, 0, 0);
      }
      const diff = (apptDate.getTime() - Date.now()) / 60000;
      return diff < 30;
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
              <p className="text-gray-600 text-sm mt-1">Manage your clinical visits and healthcare schedule.</p>
            </div>
            <button
              onClick={() => setShowBooking(!showBooking)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              <Plus size={18} />
              Book New Appointment
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Booking Form */}
        {showBooking && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Book an Appointment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Doctor Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Doctor</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => { setSelectedDoctorId(e.target.value); setSelectedSlot(''); setFormErrors((p) => ({ ...p, doctor: undefined })); }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white ${formErrors.doctor ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Choose a doctor...</option>
                  {doctors.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name || d.email}</option>
                  ))}
                </select>
                {formErrors.doctor && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} />{formErrors.doctor}</p>}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(''); setFormErrors((p) => ({ ...p, date: undefined })); }}
                  min={today}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${formErrors.date ? 'border-red-400' : 'border-gray-300'}`}
                />
                {formErrors.date && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} />{formErrors.date}</p>}
              </div>

              {/* Time Slot */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time Slot</label>
                {slotsLoading && selectedDoctorId && selectedDate ? (
                  <p className="text-sm text-gray-500 py-2.5">Loading slots...</p>
                ) : slots.length > 0 ? (
                  <select
                    value={selectedSlot}
                    onChange={(e) => { setSelectedSlot(e.target.value); setFormErrors((p) => ({ ...p, slot: undefined })); }}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white ${formErrors.slot ? 'border-red-400' : 'border-gray-300'}`}
                  >
                    <option value="">Select a slot</option>
                    {slots.map((s: string) => <option key={s} value={s}>{formatSlotRange(s)}</option>)}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500 py-2.5">
                    {selectedDoctorId && selectedDate ? 'No slots available' : 'Select doctor & date first'}
                  </p>
                )}
                {formErrors.slot && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} />{formErrors.slot}</p>}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="mb-4">
              <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border ${formErrors.terms ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => { setTermsAccepted(e.target.checked); setFormErrors((p) => ({ ...p, terms: undefined })); }}
                  className="mt-0.5 w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">
                  You cannot cancel this appointment if 30 minutes or less remain before the appointment time
                </span>
              </label>
              {formErrors.terms && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={12} />{formErrors.terms}</p>}
            </div>

            {bookAppointment.isError && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{(bookAppointment.error as Error).message}</p>
              </div>
            )}
            {bookAppointment.isSuccess && (
              <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700">Appointment booked successfully!</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowBooking(false); setFormErrors({}); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={bookAppointment.isPending}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {bookAppointment.isPending ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {/* Global cancel error/success */}
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

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {apptLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading appointments...</p>
          </div>
        )}
        {apptError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-700 font-medium">Error loading appointments</p>
            <p className="text-red-600 text-sm mt-1">{(apptError as Error).message}</p>
          </div>
        )}

        {!apptLoading && !apptError && (
          <>
            {appointments.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No {activeTab.toLowerCase()} appointments</p>
                <p className="text-gray-500 text-sm mt-1">Book a new appointment to get started.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                  {appointments.map((a: any) => {
                    const config = statusConfig[a.status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: a.status };
                    const doctorName = a.doctor?.name || a.doctor?.email || 'Doctor';
                    const isRescheduled = a.isRescheduled || (Array.isArray(a.tags) && a.tags.includes('Rescheduled'));
                    const within30 = isWithin30Minutes(a);

                    return (
                      <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        {/* Doctor Info + Status */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User size={22} className="text-teal-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{doctorName}</h3>
                              <p className="text-xs text-gray-500">{a.doctor?.specialization || 'Specialist'}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${config.bg} ${config.text}`}>
                              {config.label}
                            </span>
                            {isRescheduled && (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                                <Tag size={10} />
                                Rescheduled
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Calendar size={15} className="text-gray-400 flex-shrink-0" />
                            <span>{isClient ? new Date(a.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Clock size={15} className="text-gray-400 flex-shrink-0" />
                            <span>{formatSlotRange(a.timeSlot)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        {a.status === 'SCHEDULED' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (within30) {
                                  setCancelError('Cannot cancel appointment within 30 minutes of scheduled time');
                                } else {
                                  handleCancelClick(a.id);
                                }
                              }}
                              className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                if (within30) {
                                  setCancelError('Cannot reschedule appointment within 30 minutes of scheduled time');
                                } else {
                                  setRescheduleAppt(a);
                                }
                              }}
                              className="flex-1 px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                            >
                              Reschedule
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{appointments.length}</span> appointments
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft size={16} />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center bg-teal-600 text-white rounded-lg text-sm font-semibold">{page}</button>
                    <button onClick={() => setPage((p) => p + 1)} disabled={appointments.length < 10}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Bottom Promo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <div className="lg:col-span-2 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl border border-teal-200 p-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Need a check-up?</h3>
              <p className="text-sm text-gray-600 mb-4">Easily schedule a follow-up or a new consultation with our healthcare experts.</p>
              <button onClick={() => setShowBooking(true)} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">
                <Calendar size={18} />
                Quick Book
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <HelpCircle size={20} className="text-teal-600" />
              </div>
              <h3 className="font-bold text-gray-900">Help Center</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Facing issues with your schedule? Our support team is available 24/7.</p>
            <button className="text-sm text-teal-600 hover:text-teal-700 font-semibold">Contact Support →</button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Popup */}
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

      {/* Reschedule Form */}
      {rescheduleAppt && (
        <RescheduleForm
          appointmentId={rescheduleAppt.id}
          doctorId={rescheduleAppt.doctorId}
          doctorName={rescheduleAppt.doctor?.name || 'Doctor'}
          currentDate={new Date(rescheduleAppt.date)}
          currentSlot={rescheduleAppt.timeSlot}
          onSuccess={() => { setRescheduleAppt(null); }}
          onCancel={() => setRescheduleAppt(null)}
        />
      )}
    </div>
  );
}
