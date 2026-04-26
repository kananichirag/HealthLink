'use client';

import React, { useState } from 'react';
import {
  usePatients,
  useAllergyReports,
  useCreateAllergyReport,
  type CreateAllergyReportInput,
} from '@/hooks/useDoctorQueries';

const SEVERITIES = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as const;

const severityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800',
  MODERATE: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export default function AllergyReportsPage() {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<CreateAllergyReportInput, 'patientId'>>({
    allergyType: '',
    symptoms: '',
    severity: 'LOW',
    notes: '',
  });

  const { data: patientsData } = usePatients();
  const patients = Array.isArray(patientsData) ? patientsData : (patientsData as any)?.data ?? [];

  const { data: reports, isLoading, error } = useAllergyReports(selectedPatientId);
  const reportsList = Array.isArray(reports) ? reports : [];

  const createReport = useCreateAllergyReport();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !form.allergyType || !form.symptoms) return;
    createReport.mutate(
      { ...form, patientId: selectedPatientId },
      {
        onSuccess: () => {
          setForm({ allergyType: '', symptoms: '', severity: 'LOW', notes: '' });
          setShowForm(false);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Allergy Reports</h1>
        {selectedPatientId && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            {showForm ? 'Cancel' : 'New Report'}
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
        <select
          value={selectedPatientId}
          onChange={(e) => { setSelectedPatientId(e.target.value); setShowForm(false); }}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">-- Choose a patient --</option>
          {patients.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
          ))}
        </select>
      </div>

      {showForm && selectedPatientId && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold">New Allergy Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Allergy Type"
              value={form.allergyType}
              onChange={(e) => setForm({ ...form, allergyType: e.target.value })}
              className="border rounded-lg px-3 py-2"
              required
            />
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value as any })}
              className="border rounded-lg px-3 py-2"
              required
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <textarea
              placeholder="Symptoms"
              value={form.symptoms}
              onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
              className="border rounded-lg px-3 py-2 md:col-span-2"
              rows={2}
              required
            />
            <textarea
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="border rounded-lg px-3 py-2 md:col-span-2"
              rows={2}
            />
          </div>
          {createReport.isError && (
            <p className="text-red-600 text-sm">{(createReport.error as Error).message}</p>
          )}
          <button
            type="submit"
            disabled={createReport.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {createReport.isPending ? 'Creating...' : 'Create Report'}
          </button>
        </form>
      )}

      {selectedPatientId && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800">Reports</h2>
          </div>
          {isLoading && <p className="p-6 text-gray-500">Loading reports...</p>}
          {error && <p className="p-6 text-red-600">Error: {(error as Error).message}</p>}
          {!isLoading && !error && (
            <div className="divide-y">
              {reportsList.length === 0 ? (
                <p className="p-6 text-center text-gray-500">No allergy reports for this patient</p>
              ) : (
                reportsList.map((r: any) => (
                  <div key={r.id} className="p-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.allergyType}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${severityColors[r.severity] || 'bg-gray-100'}`}>
                        {r.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{r.symptoms}</p>
                    {r.notes && <p className="text-sm text-gray-500 italic">{r.notes}</p>}
                    <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {!selectedPatientId && (
        <p className="text-center text-gray-500 py-8">Select a patient to view their allergy reports</p>
      )}
    </div>
  );
}
