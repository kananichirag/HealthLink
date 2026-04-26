'use client';

import React, { useState } from 'react';
import {
  usePatients,
  useCreatePrescription,
  useDispatchPrescription,
  usePharmacyConnections,
  type PrescriptionItemInput,
} from '@/hooks/useDoctorQueries';
import { Plus, Trash2, Send, AlertCircle, CheckCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
              <p className="text-gray-600 text-sm mt-1">Create and manage patient prescriptions</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              <Plus size={18} />
              New Prescription
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Create Prescription Form */}
        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Prescription</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              {/* Patient Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Select Patient *</label>
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a patient...</option>
                    {patients.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Target Pharmacy (Optional)</label>
                  <select
                    value={targetPharmacyId}
                    onChange={(e) => setTargetPharmacyId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select pharmacy...</option>
                    {activeConnections.map((c: any) => (
                      <option key={c.pharmacy?.id || c.pharmacyId} value={c.pharmacy?.id || c.pharmacyId}>
                        {c.pharmacy?.name || c.pharmacyId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Medicine Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Medicine Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Medicine Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Amoxicillin"
                          value={item.medicineName}
                          onChange={(e) => updateItem(idx, 'medicineName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Dosage</label>
                        <input
                          type="text"
                          placeholder="e.g., 500mg"
                          value={item.dosage}
                          onChange={(e) => updateItem(idx, 'dosage', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
                        <input
                          type="text"
                          placeholder="e.g., 3x daily"
                          value={item.frequency}
                          onChange={(e) => updateItem(idx, 'frequency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      <div className="w-20">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                          min={1}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {createPrescription.isError && (
                <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Error creating prescription</p>
                    <p className="text-sm text-red-700 mt-1">{(createPrescription.error as Error).message}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPrescription.isPending}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {createPrescription.isPending ? 'Creating...' : 'Create Prescription'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Dispatch Prescription Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Dispatch Prescription</h2>

          <form onSubmit={handleDispatch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Prescription ID *</label>
                <input
                  type="text"
                  placeholder="Enter prescription ID"
                  value={dispatchId}
                  onChange={(e) => setDispatchId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Pharmacy *</label>
                <select
                  value={dispatchPharmacyId}
                  onChange={(e) => setDispatchPharmacyId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose pharmacy...</option>
                  {activeConnections.map((c: any) => (
                    <option key={c.pharmacy?.id || c.pharmacyId} value={c.pharmacy?.id || c.pharmacyId}>
                      {c.pharmacy?.name || c.pharmacyId}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={dispatchPrescription.isPending}
                  className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  {dispatchPrescription.isPending ? 'Dispatching...' : 'Dispatch'}
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {dispatchPrescription.isError && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Error dispatching prescription</p>
                  <p className="text-sm text-red-700 mt-1">{(dispatchPrescription.error as Error).message}</p>
                </div>
              </div>
            )}

            {dispatchPrescription.isSuccess && (
              <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Success!</p>
                  <p className="text-sm text-green-700 mt-1">Prescription dispatched successfully to the pharmacy</p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
