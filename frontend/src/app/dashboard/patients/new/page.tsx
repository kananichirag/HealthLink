'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PatientForm from '../../../../../components/patients/PatientForm';
import { PatientResponse } from '../../../../../lib/api';

export default function NewPatientPage() {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(true);

  const handleSuccess = (patient: PatientResponse) => {
    // Navigate to the patient detail page after successful creation
    router.push(`/dashboard/patients/${patient.id}`);
  };

  const handleError = (error: string) => {
    alert(`Error: ${error}`);
  };

  const handleClose = () => {
    // Navigate back to patients list when form is closed
    router.push('/dashboard/patients');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleClose}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Patients
          </button>
        </div>

        <PatientForm
          patient={null}
          isOpen={isFormOpen}
          onClose={handleClose}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </div>
  );
}
