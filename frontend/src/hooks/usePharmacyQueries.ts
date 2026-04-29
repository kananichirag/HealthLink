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

// ── Prescription hooks ──

export interface PharmacyPrescriptionFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function usePharmacyPrescriptions(filters?: PharmacyPrescriptionFilters) {
  return useQuery({
    queryKey: ['pharmacy', 'prescriptions', filters],
    queryFn: () =>
      fetchJson(`/pharmacy/prescriptions${toQueryString(filters as Record<string, unknown>)}`),
  });
}

export function useDispensePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prescriptionId: string) =>
      mutateJson(`/pharmacy/prescriptions/${prescriptionId}/dispense`, 'PATCH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'prescriptions'] });
    },
  });
}

// ── Medicine hooks ──

export interface MedicineFilters {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export function useMedicines(filters?: MedicineFilters) {
  return useQuery({
    queryKey: ['pharmacy', 'medicines', filters],
    queryFn: () =>
      fetchJson(`/pharmacy/medicines${toQueryString(filters as Record<string, unknown>)}`),
  });
}

export interface AddMedicineInput {
  name: string;
  category?: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  supplier?: string;
  unitPrice?: number;
}

export function useAddMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddMedicineInput) =>
      mutateJson('/pharmacy/medicines', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'medicines'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'inventory'] });
    },
  });
}

export interface UpdateMedicineInput {
  id: string;
  name?: string;
  category?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity?: number;
  supplier?: string;
  unitPrice?: number;
}

export function useUpdateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateMedicineInput) =>
      mutateJson(`/pharmacy/medicines/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'medicines'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'inventory'] });
    },
  });
}

// ── Inventory hooks ──

export interface InventoryFilters {
  search?: string;
  stockStatus?: string;
  page?: number;
  limit?: number;
}

export function useInventory(filters?: InventoryFilters) {
  return useQuery({
    queryKey: ['pharmacy', 'inventory', filters],
    queryFn: () =>
      fetchJson(`/pharmacy/inventory${toQueryString(filters as Record<string, unknown>)}`),
  });
}

export function useInventoryAlerts() {
  return useQuery({
    queryKey: ['pharmacy', 'inventory', 'alerts'],
    queryFn: () => fetchJson('/pharmacy/inventory/alerts'),
  });
}

// ── Purchase hooks ──

export interface PurchaseFilters {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function usePurchases(filters?: PurchaseFilters) {
  return useQuery({
    queryKey: ['pharmacy', 'purchases', filters],
    queryFn: () =>
      fetchJson(`/pharmacy/purchases${toQueryString(filters as Record<string, unknown>)}`),
  });
}

export interface RecordPurchaseInput {
  medicineId: string;
  batchNumber: string;
  quantity: number;
  unitCost: number;
  sellerName: string;
  sellerCompany: string;
  purchaseDate: string;
}

export function useRecordPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordPurchaseInput) =>
      mutateJson('/pharmacy/purchases', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'purchases'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'medicines'] });
    },
  });
}

// ── Sales hooks ──

export interface SalesFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export function useSales(filters?: SalesFilters) {
  return useQuery({
    queryKey: ['pharmacy', 'sales', filters],
    queryFn: () =>
      fetchJson(`/pharmacy/sales${toQueryString(filters as Record<string, unknown>)}`),
  });
}

export function useSaleDetail(saleId: string) {
  return useQuery({
    queryKey: ['pharmacy', 'sales', saleId],
    queryFn: () => fetchJson(`/pharmacy/sales/${saleId}`),
    enabled: !!saleId,
  });
}

export function useSaleInvoice(saleId: string) {
  return useQuery({
    queryKey: ['pharmacy', 'sales', saleId, 'invoice'],
    queryFn: () => fetchJson(`/pharmacy/sales/${saleId}/invoice`),
    enabled: !!saleId,
  });
}

export interface CreateSaleInput {
  items: Array<{
    medicineId: string;
    quantity: number;
    pricePerUnit: number;
  }>;
  discount?: number;
  discountType?: 'FLAT' | 'PERCENTAGE';
  taxRate?: number;
  paymentMethod: 'CASH' | 'CARD' | 'ONLINE';
  patientId?: string;
  prescriptionId?: string;
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSaleInput) =>
      mutateJson('/pharmacy/sales', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'sales'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'inventory'] });
    },
  });
}

export function usePrescriptionCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prescriptionId: string) =>
      mutateJson('/pharmacy/sales/prescription-checkout', 'POST', { prescriptionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'sales'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'inventory'] });
    },
  });
}

export function useSendBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (saleId: string) =>
      mutateJson(`/pharmacy/sales/${saleId}/send-bill`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'sales'] });
    },
  });
}

// ── Report hooks ──

export interface ReportFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
}

export function useDailyReport(date?: string) {
  const filters: ReportFilters = date ? { date } : {};
  return useQuery({
    queryKey: ['pharmacy', 'reports', 'daily', date],
    queryFn: () =>
      fetchJson(`/pharmacy/reports/daily${toQueryString(filters as Record<string, unknown>)}`),
  });
}

export function useTopMedicines(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['pharmacy', 'reports', 'top-medicines', filters],
    queryFn: () =>
      fetchJson(`/pharmacy/reports/top-medicines${toQueryString(filters as Record<string, unknown>)}`),
  });
}

export function useWeeklySummary(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['pharmacy', 'reports', 'weekly-summary', filters],
    queryFn: () =>
      fetchJson(`/pharmacy/reports/weekly-summary${toQueryString(filters as Record<string, unknown>)}`),
  });
}

export function usePaymentBreakdown(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['pharmacy', 'reports', 'payment-breakdown', filters],
    queryFn: () =>
      fetchJson(`/pharmacy/reports/payment-breakdown${toQueryString(filters as Record<string, unknown>)}`),
  });
}

// ── Doctor Connection hooks ──

export interface DoctorConnection {
  id: string;
  status: string;
  createdAt: string;
  doctor: { id: string; name: string; email: string };
}

export function useDoctorConnections(status?: string) {
  return useQuery({
    queryKey: ['pharmacy', 'doctor-connections', status],
    queryFn: () =>
      fetchJson<DoctorConnection[]>(
        `/pharmacy/doctor-connections${toQueryString(status !== undefined ? { status } : undefined)}`
      ),
  });
}

export function useAcceptConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateJson(`/doctor/pharmacy-connections/${id}/accept`, 'PATCH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'doctor-connections'] });
    },
  });
}

export function useRejectConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateJson(`/doctor/pharmacy-connections/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'doctor-connections'] });
    },
  });
}
