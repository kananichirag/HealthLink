'use client';

import React, { useState, useEffect } from 'react';
import { getPatient, PatientResponse } from '../../lib/api';

interface PatientDetailProps {
  patientId: string;
  onEdit?: (patient: PatientResponse) => void;
  onDelete?: (patientId: string) => void;
  onBack?: () => void;
}

export default function PatientDetail({
  patientId,
  onEdit,
  onDelete,
  onBack,
}: PatientDetailProps) {
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getPatient(patientId);
        setPatient(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patient details');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAgeGroupInfo = (ageGroup?: string) => {
    const info = {
      CHILD: { label: 'Child', color: 'bg-blue-100 text-blue-800', icon: '👶' },
      ADULT: { label: 'Adult', color: 'bg-green-100 text-green-800', icon: '👤' },
      SENIOR: { label: 'Senior', color: 'bg-purple-100 text-purple-800', icon: '👴' },
    };
    
    return ageGroup ? info[ageGroup as keyof typeof info] : null;
  };

  const getGenderIcon = (gender: string) => {
    const icons = {
      MALE: '👨',
      FEMALE: '👩',
      OTHER: '👤',
    };
    return icons[gender as keyof typeof icons] || '👤';
  };

  const handleDelete = () => {
    if (patient && onDelete) {
      const confirmed = confirm(
        `Are you sure you want to delete ${patient.name}? This action cannot be undone.`
      );
      if (confirmed) {
        onDelete(patient.id);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading patient details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading patient</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Patient not found</h3>
        <p className="mt-1 text-sm text-gray-500">The requested patient could not be found.</p>
      </div>
    );
  }

  const ageGroupInfo = getAgeGroupInfo(patient.ageGroup);

  return (
    <div className="bg-white shadow-sm rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Details</h1>
              <p className="text-sm text-gray-500">View and manage patient information</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(patient)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                  {getGenderIcon(patient.gender)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{patient.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-600">{patient.age} years old</span>
                    {ageGroupInfo && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${ageGroupInfo.color}`}>
                        {ageGroupInfo.icon} {ageGroupInfo.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Gender</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {patient.gender.toLowerCase()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Patient ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {patient.id.slice(0, 8)}...
                  </dd>
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Medical History</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {patient.medicalHistory ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{patient.medicalHistory}</p>
                ) : (
                  <p className="text-gray-500 italic">No medical history recorded</p>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Record Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(patient.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(patient.updatedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created By</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {patient.creator ? (
                      <div>
                        <div className="font-medium">{patient.creator.name}</div>
                        <div className="text-xs text-gray-500 capitalize">
                          {patient.creator.role.toLowerCase()}
                        </div>
                      </div>
                    ) : (
                      'Unknown'
                    )}
                  </dd>
                </div>
                {patient.recordAge && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Record Age</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {patient.recordAge} day{patient.recordAge !== 1 ? 's' : ''}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Quick Stats */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Quick Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Age Group:</span>
                  <span className="text-blue-900 font-medium">
                    {ageGroupInfo?.label || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Gender:</span>
                  <span className="text-blue-900 font-medium capitalize">
                    {patient.gender.toLowerCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Has Medical History:</span>
                  <span className="text-blue-900 font-medium">
                    {patient.medicalHistory ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}