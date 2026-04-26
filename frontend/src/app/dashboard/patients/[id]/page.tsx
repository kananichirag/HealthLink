'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import PatientDetail from '../../../../../components/patients/PatientDetail';
import PatientForm from '../../../../../components/patients/PatientForm';
import { PatientResponse } from '../../../../../lib/api';

interface PatientDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PatientDetailPage({ params }: PatientDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (patient: PatientResponse) => {
    setEditingPatient(patient);
    setIsFormOpen(true);
  };

  const handleDelete = async (patientId: string) => {
    // TODO: Implement delete functionality
    alert('Delete functionality will be implemented soon!');
    // After successful deletion, navigate back to patients list
    // router.push('/dashboard/patients');
  };

  const handleBack = () => {
    router.push('/dashboard/patients');
  };

  const handleFormSuccess = (patient: PatientResponse) => {
    setRefreshKey(prev => prev + 1); // Trigger refresh of patient details
    setIsFormOpen(false);
    setEditingPatient(null);
  };

  const handleFormError = (error: string) => {
    alert(`Error: ${error}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <PatientDetail
          key={refreshKey}
          patientId={resolvedParams.id}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBack={handleBack}
        />

        <PatientForm
          patient={editingPatient}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingPatient(null);
          }}
          onSuccess={handleFormSuccess}
          onError={handleFormError}
        />
      </div>
    </div>
  );
}
