'use client';

import React, { useState } from 'react';
import {
  useMedicines,
  useAddMedicine,
  type AddMedicineInput,
} from '@/hooks/usePharmacyQueries';

export default function PharmacyMedicinesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<AddMedicineInput>({
    name: '',
    category: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 0,
    supplier: '',
    unitPrice: 0,
  });

  const { data, isLoading, error } = useMedicines({
    search: search || undefined,
    category: category || undefined,
    page,
    limit: 10,
  });
  const medicines = Array.isArray(data) ? data : (data as any)?.data ?? [];

  const addMedicine = useAddMedicine();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.batchNumber || !form.expiryDate) return;
    addMedicine.mutate(
      { ...form, category: form.category || undefined, supplier: form.supplier || undefined },
      {
        onSuccess: () => {
          setForm({ name: '', category: '', batchNumber: '', expiryDate: '', quantity: 0, supplier: '', unitPrice: 0 });
          setShowForm(false);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Medicines</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          {showForm ? 'Cancel' : 'Add Medicine'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold">Add New Medicine</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="e.g. Antibiotics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
              <input
                type="text"
                value={form.batchNumber}
                onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                className="w-full border rounded-lg px-3 py-2"
                min={0}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
              <input
                type="number"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full border rounded-lg px-3 py-2"
                min={0}
                step="0.01"
              />
            </div>
          </div>
          {addMedicine.isError && (
            <p className="text-red-600 text-sm">{(addMedicine.error as Error).message}</p>
          )}
          <button
            type="submit"
            disabled={addMedicine.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {addMedicine.isPending ? 'Adding...' : 'Add Medicine'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Name or batch number"
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              placeholder="Filter by category"
              className="border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {isLoading && <p className="p-6 text-gray-500">Loading medicines...</p>}
        {error && <p className="p-6 text-red-600">Error: {(error as Error).message}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Category</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Batch</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Quantity</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Expiry</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Unit Price</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {medicines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      No medicines found
                    </td>
                  </tr>
                ) : (
                  medicines.map((m: any) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3 text-gray-600">{m.category || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{m.batchNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{m.quantity}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {m.unitPrice != null ? `₹${Number(m.unitPrice).toFixed(2)}` : '—'}
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
            disabled={medicines.length < 10}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
