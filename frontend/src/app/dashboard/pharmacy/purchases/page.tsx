'use client';

import React, { useState } from 'react';
import {
  usePurchases,
  useRecordPurchase,
  useMedicines,
  type RecordPurchaseInput,
} from '@/hooks/usePharmacyQueries';

export default function PharmacyPurchasesPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<RecordPurchaseInput>({
    medicineId: '',
    batchNumber: '',
    quantity: 0,
    unitCost: 0,
    sellerName: '',
    sellerCompany: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  const { data, isLoading, error } = usePurchases({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 10,
  });
  const purchases = Array.isArray(data) ? data : (data as any)?.data ?? [];

  const { data: medicinesData } = useMedicines({ limit: 100 });
  const medicines = Array.isArray(medicinesData) ? medicinesData : (medicinesData as any)?.data ?? [];

  const recordPurchase = useRecordPurchase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.medicineId || !form.batchNumber || !form.quantity || !form.sellerName || !form.sellerCompany) return;
    recordPurchase.mutate(form, {
      onSuccess: () => {
        setForm({
          medicineId: '',
          batchNumber: '',
          quantity: 0,
          unitCost: 0,
          sellerName: '',
          sellerCompany: '',
          purchaseDate: new Date().toISOString().split('T')[0],
        });
        setShowForm(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          {showForm ? 'Cancel' : 'Record Purchase'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold">Record New Purchase</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medicine *</label>
              <select
                value={form.medicineId}
                onChange={(e) => setForm({ ...form, medicineId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select medicine</option>
                {medicines.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.batchNumber})</option>
                ))}
              </select>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                className="w-full border rounded-lg px-3 py-2"
                min={1}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost *</label>
              <input
                type="number"
                value={form.unitCost}
                onChange={(e) => setForm({ ...form, unitCost: parseFloat(e.target.value) || 0 })}
                className="w-full border rounded-lg px-3 py-2"
                min={0}
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seller Name *</label>
              <input
                type="text"
                value={form.sellerName}
                onChange={(e) => setForm({ ...form, sellerName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seller Company *</label>
              <input
                type="text"
                value={form.sellerCompany}
                onChange={(e) => setForm({ ...form, sellerCompany: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date *</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>
          {recordPurchase.isError && (
            <p className="text-red-600 text-sm">{(recordPurchase.error as Error).message}</p>
          )}
          <button
            type="submit"
            disabled={recordPurchase.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {recordPurchase.isPending ? 'Recording...' : 'Record Purchase'}
          </button>
        </form>
      )}

      {/* Purchase History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {isLoading && <p className="p-6 text-gray-500">Loading purchases...</p>}
        {error && <p className="p-6 text-red-600">Error: {(error as Error).message}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Medicine</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Batch</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Qty</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Unit Cost</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Seller</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Company</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                      No purchase records found
                    </td>
                  </tr>
                ) : (
                  purchases.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{p.medicine?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{p.batchNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{p.quantity}</td>
                      <td className="px-4 py-3 text-gray-600">₹{Number(p.unitCost).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">₹{Number(p.totalCost).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">{p.sellerName}</td>
                      <td className="px-4 py-3 text-gray-600">{p.sellerCompany}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : '—'}
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
            disabled={purchases.length < 10}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
