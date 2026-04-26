'use client';

import React, { useState } from 'react';
import PatientList from '../../../../components/patients/PatientList';
import PatientForm from '../../../../components/patients/PatientForm';
import PatientDetail from '../../../../components/patients/PatientDetail';
import { PatientResponse } from '../../../lib/api';

export default function PatientsPage() {
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePatientSelect = (patient: PatientResponse) => {
    setSelectedPatient(patient);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedPatient(null);
  };

  const handleAddPatient = () => {
    setEditingPatient(null);
    setIsFormOpen(true);
  };

  const handleEditPatient = (patient: PatientResponse) => {
    setEditingPatient(patient);
    setIsFormOpen(true);
  };

  const handleDeletePatient = async (patientId: string) => {
    // TODO: Implement delete functionality
    alert('Delete functionality will be implemented soon!');
  };

  const handleFormSuccess = (patient: PatientResponse) => {
    setRefreshKey(prev => prev + 1); // Trigger refresh
    if (editingPatient) {
      // If we were editing and we're in detail view, update the selected patient
      if (currentView === 'detail' && selectedPatient?.id === patient.id) {
        setSelectedPatient(patient);
      }
    }
  };

  const handleFormError = (error: string) => {
    alert(`Error: ${error}`);
  };

  if (currentView === 'detail' && selectedPatient) {
    return (
      <PatientDetail
        patientId={selectedPatient.id}
        onEdit={handleEditPatient}
        onDelete={handleDeletePatient}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PatientList
        key={refreshKey}
        onPatientSelect={handlePatientSelect}
        onEditPatient={handleEditPatient}
        onDeletePatient={handleDeletePatient}
        onAddPatient={handleAddPatient}
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
  );
}