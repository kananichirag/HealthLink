'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getPatients,
  getMedicines,
  createPrescription,
  PatientResponse,
  MedicineResponse,
} from '../../lib/api';

interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  availableStock: number;
  quantity: number;
}

export default function PrescriptionForm() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [medicines, setMedicines] = useState<MedicineResponse[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [patientId, setPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingData(true);
        const [pRes, mRes] = await Promise.all([
          getPatients({ limit: 100 }),
          getMedicines({ limit: 100 }),
        ]);
        setPatients(pRes.data);
        setMedicines(mRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, []);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const addMedicine = () => {
    if (!selectedMedicineId) return;
    if (items.some((i) => i.medicineId === selectedMedicineId)) return;
    const med = medicines.find((m) => m.id === selectedMedicineId);
    if (!med) return;
    setItems([...items, { medicineId: med.id, medicineName: med.name, availableStock: med.quantity, quantity: 1 }]);
    setSelectedMedicineId('');
  };

  const updateQuantity = (medicineId: string, qty: number) => {
    setItems(items.map((i) => i.medicineId === medicineId ? { ...i, quantity: Math.max(1, qty) } : i));
  };

  const removeItem = (medicineId: string) => {
    setItems(items.filter((i) => i.medicineId !== medicineId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setError('Please select a patient.'); return; }
    if (items.length === 0) { setError('Please add at least one medicine.'); return; }

    const overStock = items.find((i) => i.quantity > i.availableStock);
    if (overStock) {
      setError(`Quantity for "${overStock.medicineName}" exceeds available stock (${overStock.availableStock}).`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createPrescription({ patientId, items: items.map((i) => ({ medicineId: i.medicineId, quantity: i.quantity })) });
      setSuccess(true);
      setTimeout(() => router.push('/dashboard/prescriptions'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prescription');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4" />
          <p className="text-gray-600 font-medium">Loading form data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          New Prescription
        </h1>
        <p className="mt-1 text-sm text-gray-500">Create a prescription and reserve medicine stock</p>
      </div>

      {/* Success */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <svg className="h-5 w-5 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-semibold text-green-800">Prescription created! Redirecting…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-red-800">Error</h3>
            <p className="mt-0.5 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">1</span>
            Select Patient
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search patients by name…"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50"
            />
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50"
              required
            >
              <option value="">— Select a patient —</option>
              {filteredPatients.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (Age: {p.age})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Medicine Selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">2</span>
            Add Medicines
          </h2>
          <div className="flex gap-3 mb-4">
            <select
              value={selectedMedicineId}
              onChange={(e) => setSelectedMedicineId(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50"
            >
              <option value="">— Select a medicine —</option>
              {medicines.filter((m) => !items.some((i) => i.medicineId === m.id)).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — Stock: {m.quantity} units {m.stockStatus === 'LOW' ? '⚠️' : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addMedicine}
              disabled={!selectedMedicineId}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Add
            </button>
          </div>

          {/* Items List */}
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No medicines added yet. Select a medicine above.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.medicineId} className="flex items-center gap-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{item.medicineName}</p>
                    <p className={`text-xs mt-0.5 ${item.quantity > item.availableStock ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      Available: {item.availableStock} units
                      {item.quantity > item.availableStock && ' — Exceeds stock!'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500 font-medium">Qty:</label>
                    <input
                      type="number"
                      min={1}
                      max={item.availableStock}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.medicineId, parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.medicineId)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.push('/dashboard/prescriptions')}
            className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || success}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
          >
            {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {submitting ? 'Creating…' : 'Create Prescription'}
          </button>
        </div>
      </form>
    </div>
  );
}
