'use client';

import React, { useState } from 'react';
import {
  usePatients,
  useCreatePrescription,
  useDispatchPrescription,
  usePharmacyConnections,
  type PrescriptionItemInput,
} from '@/hooks/useDoctorQueries';

export default function DoctorPrescriptionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [targetPharmacyId, setTargetPharmacyId] = useState('');
  const [items, setItems] = useState<PrescriptionItemInput[]>([
    { medicineName: '', dosage: '', frequency: '', quantity: 1 },
  ]);
  const [dispatchId, setDispatchId] = useState('');
  const [dispatchPharmacyId, setDispatchPharmacyId] = useState('');

  const { data: patientsData } = usePatients();
  const patients = Array.isArray(patientsData) ? patientsData : (patientsData as any)?.data ?? [];

  const { data: connectionsData } = usePharmacyConnections();
  const connections = Array.isArray(connectionsData) ? connectionsData : [];
  const activeConnections = connections.filter((c: any) => c.status === 'ACTIVE');

  const createPrescription = useCreatePrescription();
  const dispatchPrescription = useDispatchPrescription();

  const addItem = () => {
    setItems([...items, { medicineName: '', dosage: '', frequency: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PrescriptionItemInput, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || items.some((i) => !i.medicineName || !i.dosage || !i.frequency)) return;
    createPrescription.mutate(
      { patientId, items, targetPharmacyId: targetPharmacyId || undefined },
      {
        onSuccess: () => {
          setPatientId('');
          setTargetPharmacyId('');
          setItems([{ medicineName: '', dosage: '', frequency: '', quantity: 1 }]);
          setShowForm(false);
        },
      },
    );
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchId || !dispatchPharmacyId) return;
    dispatchPrescription.mutate(
      { prescriptionId: dispatchId, pharmacyId: dispatchPharmacyId },
      { onSuccess: () => { setDispatchId(''); setDispatchPharmacyId(''); } },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          {showForm ? 'Cancel' : 'New Prescription'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold">Create Prescription</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Select patient</option>
                {patients.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Pharmacy (optional)</label>
              <select
                value={targetPharmacyId}
                onChange={(e) => setTargetPharmacyId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">None</option>
                {activeConnections.map((c: any) => (
                  <option key={c.pharmacy?.id || c.pharmacyId} value={c.pharmacy?.id || c.pharmacyId}>
                    {c.pharmacy?.name || c.pharmacyId}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Medicine Items</h3>
              <button type="button" onClick={addItem} className="text-sm text-indigo-600 hover:underline">
                + Add Item
              </button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                <input
                  type="text"
                  placeholder="Medicine Name"
                  value={item.medicineName}
                  onChange={(e) => updateItem(idx, 'medicineName', e.target.value)}
                  className="border rounded-lg px-3 py-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Dosage"
                  value={item.dosage}
                  onChange={(e) => updateItem(idx, 'dosage', e.target.value)}
                  className="border rounded-lg px-3 py-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Frequency"
                  value={item.frequency}
                  onChange={(e) => updateItem(idx, 'frequency', e.target.value)}
                  className="border rounded-lg px-3 py-2"
                  required
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                  className="border rounded-lg px-3 py-2"
                  min={1}
                  required
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-red-500 hover:text-red-700 text-sm py-2"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {createPrescription.isError && (
            <p className="text-red-600 text-sm">{(createPrescription.error as Error).message}</p>
          )}
          <button
            type="submit"
            disabled={createPrescription.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {createPrescription.isPending ? 'Creating...' : 'Create Prescription'}
          </button>
        </form>
      )}

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold">Dispatch Prescription</h2>
        <form onSubmit={handleDispatch} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prescription ID</label>
            <input
              type="text"
              placeholder="Prescription ID"
              value={dispatchId}
              onChange={(e) => setDispatchId(e.target.value)}
              className="border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy</label>
            <select
              value={dispatchPharmacyId}
              onChange={(e) => setDispatchPharmacyId(e.target.value)}
              className="border rounded-lg px-3 py-2"
              required
            >
              <option value="">Select pharmacy</option>
              {activeConnections.map((c: any) => (
                <option key={c.pharmacy?.id || c.pharmacyId} value={c.pharmacy?.id || c.pharmacyId}>
                  {c.pharmacy?.name || c.pharmacyId}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={dispatchPrescription.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          >
            {dispatchPrescription.isPending ? 'Dispatching...' : 'Dispatch'}
          </button>
        </form>
        {dispatchPrescription.isError && (
          <p className="text-red-600 text-sm">{(dispatchPrescription.error as Error).message}</p>
        )}
        {dispatchPrescription.isSuccess && (
          <p className="text-green-600 text-sm">Prescription dispatched successfully!</p>
        )}
      </div>
    </div>
  );
}
