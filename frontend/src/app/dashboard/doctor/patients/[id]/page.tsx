'use client';

import React from 'react';
import Link from 'next/link';
import { usePatientPrescriptions } from '@/hooks/useDoctorQueries';

const AVATAR_COLORS = ['#0f766e', '#4648d4', '#e07b39', '#7f4025', '#6063ee', '#005c55', '#16a34a'];

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  let color = '#6e7977';
  let bg = '#f1f4f3';
  
  if (s === 'PENDING') {
    color = '#e07b39';
    bg = '#fff0e6';
  } else if (s === 'DISPENSED') {
    color = '#0f766e';
    bg = '#f1f4f3';
  } else if (s === 'CANCELLED') {
    color = '#ba1a1a';
    bg = '#ffdad6';
  }
  
  return (
    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: bg, color, letterSpacing: '0.03em' }}>
      {s || 'DRAFT'}
    </span>
  );
}

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const patientId = params.id;
  const { data: prescriptions, isLoading, error } = usePatientPrescriptions(patientId);

  const prescriptionList = Array.isArray(prescriptions) ? prescriptions : [];

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#181c1c' }}>
      {/* Header with back button */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/doctor/patients" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#005c55', textDecoration: 'none', marginBottom: '12px', fontWeight: 500 }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Patients
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#181c1c', margin: 0, letterSpacing: '-0.02em' }}>Patient Profile</h1>
        <p style={{ fontSize: '13px', color: '#3e4947', marginTop: '4px' }}>View patient details and prescription history.</p>
      </div>

      {/* Prescription History Section */}
      <div style={{ background: '#fff', border: '1px solid #e5e9e7', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e9e7' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#181c1c' }}>Prescription History</span>
        </div>

        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr 1.5fr 0.8fr', padding: '10px 20px', background: '#f7faf8', borderBottom: '1px solid #e5e9e7' }}>
          {['DATE & TIME', 'MEDICINES', 'TARGET PHARMACY', 'STATUS', ''].map((h) => (
            <span key={h} style={{ fontSize: '10px', fontWeight: 700, color: '#6e7977', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: '#6e7977', fontSize: '13px', margin: 0 }}>Loading prescription history...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: '#ba1a1a', fontSize: '13px', margin: 0 }}>Error: {(error as Error).message}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && prescriptionList.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f4f3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="24" height="24" fill="none" stroke="#6e7977" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#181c1c', margin: '0 0 4px' }}>No prescriptions on record</p>
            <p style={{ fontSize: '12px', color: '#6e7977', margin: 0 }}>This patient has no prescription history yet.</p>
          </div>
        )}

        {/* Prescription List */}
        {!isLoading && !error && prescriptionList.map((rx: any, i: number) => {
          const createdDate = new Date(rx.createdAt);
          const dateStr = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const timeStr = createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          const itemCount = rx.items?.length || 0;
          const pharmacyName = rx.targetPharmacy?.name || '—';

          return (
            <div key={rx.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr 1.5fr 0.8fr', padding: '14px 20px', borderBottom: i < prescriptionList.length - 1 ? '1px solid #f1f4f3' : 'none', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#181c1c', margin: 0 }}>{dateStr}</p>
                <p style={{ fontSize: '11px', color: '#6e7977', margin: '2px 0 0' }}>{timeStr}</p>
              </div>
              <span style={{ fontSize: '13px', color: '#181c1c' }}>{itemCount} {itemCount === 1 ? 'medicine' : 'medicines'}</span>
              <span style={{ fontSize: '12px', color: '#3e4947' }}>{pharmacyName}</span>
              <div>
                <StatusBadge status={rx.status} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ width: '28px', height: '28px', border: '1px solid #e5e9e7', borderRadius: '6px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e7977' }}>
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
