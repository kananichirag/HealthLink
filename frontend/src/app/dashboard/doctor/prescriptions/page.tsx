'use client';

import React, { useState } from 'react';
import {
  usePatients,
  useCreatePrescription,
  useDispatchPrescription,
  usePharmacyConnections,
  type PrescriptionItemInput,
} from '@/hooks/useDoctorQueries';
import { 
  Plus, 
  Trash2, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  User,
  Pill,
  FileText,
  Clock,
  Calendar as CalendarIcon,
  Search,
  Save
} from 'lucide-react';

export default function DoctorPrescriptionsPage() {
  const [showForm, setShowForm] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [targetPharmacyId, setTargetPharmacyId] = useState('');
  const [items, setItems] = useState<PrescriptionItemInput[]>([
    { medicineName: '', dosage: '', frequency: '', quantity: 1 },
  ]);

  const { data: patientsData } = usePatients();
  const patients = Array.isArray(patientsData) ? patientsData : (patientsData as any)?.data ?? [];

  const { data: connectionsData } = usePharmacyConnections();
  const connections = Array.isArray(connectionsData) ? connectionsData : [];
  const activeConnections = connections.filter((c: any) => c.status === 'ACTIVE');

  const createPrescription = useCreatePrescription();

  const selectedPatient = patients.find((p: any) => p.id === patientId);

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
        },
      },
    );
  };

  // Mock recent prescriptions
  const recentPrescriptions = [
    { name: 'Amlodipine 5mg', date: 'Oct 12, 2023', items: 2 },
    { name: 'Atorvastatin 20mg', date: 'Aug 05, 2023', items: 1 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Prescription</h1>
              <p className="text-gray-600 text-sm mt-1">Fill prescription details for patient care</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Selection */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <User size={20} className="text-teal-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Patient Selection</h2>
                </div>
              </div>

              <div className="p-6">
                <div className="relative mb-4">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patient by name or ID..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {selectedPatient && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={24} className="text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{selectedPatient.name}</h3>
                        <span className="text-xs text-gray-500">ID: {selectedPatient.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {selectedPatient.age || '72'} years • {selectedPatient.gender || 'Female'} • Type 2 Diabetes • Hypertension
                      </p>
                    </div>
                    <CheckCircle size={20} className="text-teal-600" />
                  </div>
                )}

                {!selectedPatient && (
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select patient...</option>
                    {patients.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Medications List */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Pill size={20} className="text-teal-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Medications List</h2>
                  </div>
                  <span className="text-sm text-gray-600">{items.length} ITEMS ADDED</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="col-span-3">
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">MEDICINE NAME</label>
                        <input
                          type="text"
                          placeholder="e.g., Metformin Hydrochloride"
                          value={item.medicineName}
                          onChange={(e) => updateItem(idx, 'medicineName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">DOSAGE</label>
                        <input
                          type="text"
                          placeholder="500mg"
                          value={item.dosage}
                          onChange={(e) => updateItem(idx, 'dosage', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">FREQUENCY</label>
                        <input
                          type="text"
                          placeholder="Twice daily"
                          value={item.frequency}
                          onChange={(e) => updateItem(idx, 'frequency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">QTY</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                            min={1}
                            required
                          />
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">DURATION</label>
                        <input
                          type="text"
                          placeholder="30 days"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">QTY</label>
                        <input
                          type="number"
                          placeholder="60"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addItem}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors font-medium"
                >
                  <Plus size={18} />
                  Add Another Medication
                </button>
              </div>
            </div>

            {/* Pharmacy Selection */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-teal-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Pharmacy Selection</h2>
                </div>
              </div>

              <div className="p-6">
                <select
                  value={targetPharmacyId}
                  onChange={(e) => setTargetPharmacyId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">City Pharmacy - 124 Medical Dr, North Wing</option>
                  {activeConnections.map((c: any) => (
                    <option key={c.pharmacy?.id || c.pharmacyId} value={c.pharmacy?.id || c.pharmacyId}>
                      {c.pharmacy?.name || c.pharmacyId}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error/Success Messages */}
            {createPrescription.isError && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Error creating prescription</p>
                  <p className="text-sm text-red-700 mt-1">{(createPrescription.error as Error).message}</p>
                </div>
              </div>
            )}

            {createPrescription.isSuccess && (
              <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-green-900">Prescription created successfully!</p>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Prescription Summary */}
            <div className="bg-teal-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold">Prescription Summary</h3>
                  <p className="text-xs text-teal-100">VERIFICATION STEP</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-teal-100 uppercase mb-1">PATIENT</p>
                  {selectedPatient ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">EM</span>
                      </div>
                      <div>
                        <p className="font-semibold">{selectedPatient.name}</p>
                        <p className="text-xs text-teal-100">{selectedPatient.age || '72'} y • {selectedPatient.gender || 'Female'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">No patient selected</p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-teal-100 uppercase mb-2">MEDICATIONS ({items.length})</p>
                  <div className="space-y-2">
                    {items.filter(i => i.medicineName).map((item, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-semibold">{item.medicineName}</p>
                        <p className="text-xs text-teal-100">
                          {item.dosage} • Qty: {item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-teal-100 uppercase mb-1">PHARMACY</p>
                  <p className="text-sm font-semibold">City Pharmacy</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20 space-y-3">
                <button
                  onClick={handleCreate}
                  disabled={createPrescription.isPending || !patientId}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-teal-600 rounded-lg hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  <Send size={18} />
                  {createPrescription.isPending ? 'Creating...' : 'Create & Send'}
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium">
                  <Save size={18} />
                  Save as Draft
                </button>
              </div>

              <p className="text-xs text-teal-100 text-center mt-4">
                By clicking Create & Send, you are digitally signing this prescription under CURES 2.0 Act.
              </p>
            </div>

            {/* Recent Prescriptions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-teal-600" />
                <h3 className="font-bold text-gray-900">Recent Prescriptions</h3>
              </div>
              <div className="space-y-3">
                {recentPrescriptions.map((rx, i) => (
                  <div key={i} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">{rx.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{rx.date} • {rx.items} items</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
