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

// ── Tenant hooks ──

export interface TenantFilters {
  search?: string;
  type?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export function useTenants(filters?: TenantFilters) {
  return useQuery({
    queryKey: ['admin', 'tenants', filters],
    queryFn: () =>
      fetchJson(`/admin/tenants${toQueryString(filters as Record<string, unknown>)}`),
  });
}

export function useActivateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) =>
      mutateJson(`/admin/tenants/${tenantId}/activate`, 'PATCH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
}

export function useDeactivateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) =>
      mutateJson(`/admin/tenants/${tenantId}/deactivate`, 'PATCH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
}

// ── User hooks ──

export interface UserFilters {
  search?: string;
  role?: string;
  tenantId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function useAdminUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () =>
      fetchJson(`/admin/users${toQueryString(filters as Record<string, unknown>)}`),
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      mutateJson(`/admin/users/${userId}/activate`, 'PATCH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      mutateJson(`/admin/users/${userId}/deactivate`, 'PATCH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
