import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

// ── Helpers ──

function toQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  return res.json();
}

async function mutateJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ── Doctor Discovery hooks ──

export interface DoctorListFilters {
  search?: string;
  specialization?: string;
  page?: number;
  limit?: number;
}

export function useDoctorList(filters?: DoctorListFilters) {
  return useQuery({
    queryKey: ['patient', 'doctors', filters],
    queryFn: () => fetchJson(`/patient/doctors${toQueryString(filters as Record<string, unknown>)}`),
  });
}

export function useConnectWithDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (doctorId: string) =>
      mutateJson(`/patient/doctors/${doctorId}/connect`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', 'doctors'] });
    },
  });
}

// ── Available Slots hook ──

export function useAvailableSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: ['patient', 'slots', doctorId, date],
    queryFn: () => fetchJson(`/patient/doctors/${doctorId}/slots?date=${encodeURIComponent(date)}`),
    enabled: !!doctorId && !!date,
  });
}

// ── Appointment hooks ──

export interface BookAppointmentInput {
  doctorId: string;
  date: string;
  timeSlot: string;
}

export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BookAppointmentInput) =>
      mutateJson('/patient/appointments', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient', 'slots'] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) =>
      mutateJson(`/patient/appointments/${appointmentId}/cancel`, 'PATCH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient', 'slots'] });
    },
  });
}

export interface PatientAppointmentFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function usePatientAppointments(filters?: PatientAppointmentFilters) {
  return useQuery({
    queryKey: ['patient', 'appointments', filters],
    queryFn: () => fetchJson(`/patient/appointments${toQueryString(filters as Record<string, unknown>)}`),
  });
}

// ── Prescription hooks ──

export interface PatientPrescriptionFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export function usePatientPrescriptions(filters?: PatientPrescriptionFilters) {
  return useQuery({
    queryKey: ['patient', 'prescriptions', filters],
    queryFn: () => fetchJson(`/patient/prescriptions${toQueryString(filters as Record<string, unknown>)}`),
  });
}

export function usePatientPrescriptionDetail(prescriptionId: string) {
  return useQuery({
    queryKey: ['patient', 'prescriptions', prescriptionId],
    queryFn: () => fetchJson(`/patient/prescriptions/${prescriptionId}`),
    enabled: !!prescriptionId,
  });
}
