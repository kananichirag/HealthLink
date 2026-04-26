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

// ── Patient hooks ──

export interface PatientFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export function usePatients(filters?: PatientFilters) {
  return useQuery({
    queryKey: ['doctor', 'patients', filters],
    queryFn: () => fetchJson(`/doctor/patients${toQueryString(filters as Record<string, unknown>)}`),
  });
}

export interface CreatePatientInput {
  name: string;
  email: string;
  mobile: string;
  age: number;
  gender: string;
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePatientInput) =>
      mutateJson('/doctor/patients', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'patients'] });
    },
  });
}

// ── Allergy Report hooks ──

export function useAllergyReports(patientId: string) {
  return useQuery({
    queryKey: ['doctor', 'allergy-reports', patientId],
    queryFn: () => fetchJson(`/doctor/allergy-reports/${patientId}`),
    enabled: !!patientId,
  });
}

export interface CreateAllergyReportInput {
  patientId: string;
  allergyType: string;
  symptoms: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  notes?: string;
}

export function useCreateAllergyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAllergyReportInput) =>
      mutateJson('/doctor/allergy-reports', 'POST', data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'allergy-reports', variables.patientId] });
    },
  });
}

// ── Prescription hooks ──

export interface PrescriptionItemInput {
  medicineName: string;
  dosage: string;
  frequency: string;
  quantity: number;
}

export interface CreatePrescriptionInput {
  patientId: string;
  items: PrescriptionItemInput[];
  targetPharmacyId?: string;
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePrescriptionInput) =>
      mutateJson('/doctor/prescriptions', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'prescriptions'] });
    },
  });
}

export interface DispatchPrescriptionInput {
  prescriptionId: string;
  pharmacyId: string;
}

export function useDispatchPrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ prescriptionId, pharmacyId }: DispatchPrescriptionInput) =>
      mutateJson(`/doctor/prescriptions/${prescriptionId}/dispatch`, 'POST', { pharmacyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'prescriptions'] });
    },
  });
}

// ── Pharmacy Connection hooks ──

export function usePharmacyConnections() {
  return useQuery({
    queryKey: ['doctor', 'pharmacy-connections'],
    queryFn: () => fetchJson('/doctor/pharmacy-connections'),
  });
}

export function useAvailablePharmacies() {
  return useQuery({
    queryKey: ['doctor', 'pharmacies'],
    queryFn: () => fetchJson('/doctor/pharmacies'),
  });
}

export function useRequestConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pharmacyId: string) =>
      mutateJson('/doctor/pharmacy-connections', 'POST', { pharmacyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'pharmacy-connections'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'pharmacies'] });
    },
  });
}

export function useTerminateConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) =>
      mutateJson(`/doctor/pharmacy-connections/${connectionId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'pharmacy-connections'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'pharmacies'] });
    },
  });
}

// ── Appointment hooks ──

export interface AppointmentFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function useDoctorAppointments(filters?: AppointmentFilters) {
  return useQuery({
    queryKey: ['doctor', 'appointments', filters],
    queryFn: () => fetchJson(`/doctor/appointments${toQueryString(filters as Record<string, unknown>)}`),
  });
}

// ── Scheduling hooks ──

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface SetAvailabilityInput {
  slots: Record<string, TimeSlot[]>;
}

export function useSetAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SetAvailabilityInput) => {
      // Transform { MONDAY: [{startTime, endTime}] } into flat array with dayOfWeek
      const flatSlots = Object.entries(data.slots).flatMap(([day, daySlots]) =>
        daySlots.map((slot) => ({
          dayOfWeek: day,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }))
      );
      return mutateJson('/doctor/schedule', 'PUT', { slots: flatSlots });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'schedule'] });
    },
  });
}

export function useBlockDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string }) =>
      mutateJson('/doctor/schedule/block', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'schedule'] });
    },
  });
}

export function useUnblockDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date: string) =>
      mutateJson(`/doctor/schedule/block/${date}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'schedule'] });
    },
  });
}

export interface SetMaxAppointmentsInput {
  maxPerDay: number;
}

export function useSetMaxAppointments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SetMaxAppointmentsInput) =>
      mutateJson('/doctor/schedule/max-appointments', 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'schedule'] });
    },
  });
}
