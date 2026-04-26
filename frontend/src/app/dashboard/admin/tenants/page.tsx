'use client';

import React, { useState } from 'react';
import {
  useTenants,
  useActivateTenant,
  useDeactivateTenant,
  type TenantFilters,
} from '@/hooks/useAdminQueries';

export default function AdminTenantsPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  const filters: TenantFilters = {
    search: search || undefined,
    type: type || undefined,
    page,
    limit: 10,
  };

  const { data, isLoading, error } = useTenants(filters);
  const tenants = Array.isArray(data) ? data : (data as any)?.data ?? [];

  const activateTenant = useActivateTenant();
  const deactivateTenant = useDeactivateTenant();

  const handleToggle = (tenantId: string, isActive: boolean) => {
    if (isActive) {
      deactivateTenant.mutate(tenantId);
    } else {
      activateTenant.mutate(tenantId);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tenant name"
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">All</option>
              <option value="PHARMACY">Pharmacy</option>
              <option value="CLINIC">Clinic</option>
            </select>
          </div>
        </div>

        {isLoading && <p className="p-6 text-gray-500">Loading tenants...</p>}
        {error && <p className="p-6 text-red-600">Error: {(error as Error).message}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Created</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Users</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      No tenants found
                    </td>
                  </tr>
                ) : (
                  tenants.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{t.name}</td>
                      <td className="px-4 py-3 text-gray-600">{t.type}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{t._count?.users ?? t.userCount ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                            t.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {t.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(t.id, t.isActive)}
                          disabled={activateTenant.isPending || deactivateTenant.isPending}
                          className={`px-3 py-1 text-sm rounded-lg text-white transition disabled:opacity-50 ${
                            t.isActive
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {t.isActive ? 'Deactivate' : 'Activate'}
                        </button>
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={tenants.length < 10}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
