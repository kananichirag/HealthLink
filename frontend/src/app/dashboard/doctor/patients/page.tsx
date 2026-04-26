'use client';

import React, { useState } from 'react';
import {
  usePatients,
  useCreatePatient,
  type CreatePatientInput,
} from '@/hooks/useDoctorQueries';

export default function DoctorPatientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreatePatientInput>({
    name: '',
    email: '',
    mobile: '',
    age: 0,
    gender: '',
  });

  const { data, isLoading, error } = usePatients({ search, page, limit: 10 });
  const createPatient = useCreatePatient();

  const patients = Array.isArray(data) ? data : (data as any)?.data ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.mobile || !form.age || !form.gender) return;
    createPatient.mutate(form, {
      onSuccess: () => {
        setForm({ name: '', email: '', mobile: '', age: 0, gender: '' });
        setShowForm(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          {showForm ? 'Cancel' : 'Add Patient'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold">New Patient</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded-lg px-3 py-2"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border rounded-lg px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Mobile"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              className="border rounded-lg px-3 py-2"
              required
            />
            <input
              type="number"
              placeholder="Age"
              value={form.age || ''}
              onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
              className="border rounded-lg px-3 py-2"
              required
              min={1}
            />
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="border rounded-lg px-3 py-2"
              required
            >
              <option value="">Select Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          {createPatient.isError && (
            <p className="text-red-600 text-sm">{(createPatient.error as Error).message}</p>
          )}
          <button
            type="submit"
            disabled={createPatient.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {createPatient.isPending ? 'Creating...' : 'Create Patient'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {isLoading && <p className="p-6 text-gray-500">Loading patients...</p>}
        {error && <p className="p-6 text-red-600">Error: {(error as Error).message}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Mobile</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Age</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Gender</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {patients.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No patients found</td></tr>
                ) : (
                  patients.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.email}</td>
                      <td className="px-4 py-3 text-gray-600">{p.mobile}</td>
                      <td className="px-4 py-3 text-gray-600">{p.age}</td>
                      <td className="px-4 py-3 text-gray-600">{p.gender}</td>
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
            disabled={patients.length < 10}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
