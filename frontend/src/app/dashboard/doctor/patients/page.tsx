'use client';

import React, { useState } from 'react';
import {
  usePatients,
  useCreatePatient,
  type CreatePatientInput,
} from '@/hooks/useDoctorQueries';

const AVATAR_COLORS = ['#0f766e', '#4648d4', '#e07b39', '#7f4025', '#6063ee', '#005c55', '#16a34a'];

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function GenderBadge({ gender }: { gender: string }) {
  const g = gender?.toUpperCase();
  const color = g === 'FEMALE' ? '#4648d4' : g === 'MALE' ? '#0f766e' : '#6e7977';
  return (
    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: color + '18', color, letterSpacing: '0.04em' }}>
      {g || 'N/A'}
    </span>
  );
}

const inpStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #d1d9d7', borderRadius: '8px',
  fontSize: '13px', color: '#181c1c', background: '#fff', outline: 'none',
  fontFamily: 'Inter, system-ui, sans-serif',
};

export default function DoctorPatientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreatePatientInput>({ name: '', email: '', mobile: '', age: 0, gender: '' });

  const { data, isLoading, error } = usePatients({ search, page, limit: 10 });
  const createPatient = useCreatePatient();

  const patients: any[] = Array.isArray(data) ? data : (data as any)?.data ?? [];
  const total: number = (data as any)?.total ?? patients.length;

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

  const demoPatients = [
    { id: 'd1', name: 'Eleanor Moore', patientId: 'ID: #MF-8021', age: 62, gender: 'FEMALE', mobile: '+1 (555) 012-3456', email: 'e.moore@example.com', lastVisit: 'Oct 24, 2023', lastVisitType: 'General Checkup', lastVisitColor: '#0f766e' },
    { id: 'd2', name: 'Robert Jenkins', patientId: 'ID: #MF-6332', age: 45, gender: 'MALE', mobile: '+1 (500) 987-6543', email: 'r.jenkins@mail.net', lastVisit: 'Nov 02, 2023', lastVisitType: 'Hypertension Appt.', lastVisitColor: '#4648d4' },
    { id: 'd3', name: 'Sarah Lopez', patientId: 'ID: #MF-1103', age: 29, gender: 'FEMALE', mobile: '+1 (555) 441-2290', email: 'sarah.lopez@clinic.org', lastVisit: 'Oct 29, 2023', lastVisitType: 'Lab Results', lastVisitColor: '#e07b39' },
    { id: 'd4', name: 'David Harrison', patientId: 'ID: #MF-5561', age: 51, gender: 'MALE', mobile: '+1 (555) 778-9001', email: 'd.harrison@web.com', lastVisit: 'Oct 19, 2023', lastVisitType: 'Vaccination', lastVisitColor: '#6e7977' },
  ];

  const displayPatients = patients.length > 0 ? patients : demoPatients;
  const displayTotal = total > 0 ? total : 1284;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#181c1c' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#181c1c', margin: 0, letterSpacing: '-0.02em' }}>Patient Management</h1>
          <p style={{ fontSize: '13px', color: '#3e4947', marginTop: '4px' }}>Manage and monitor patient clinical records and history.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: '1px solid #d1d9d7', borderRadius: '8px', background: '#fff', fontSize: '13px', color: '#3e4947', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filters
          </button>
          <button onClick={() => setShowForm(!showForm)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: 'none', borderRadius: '8px', background: '#005c55', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            {showForm ? 'Cancel' : 'Add Patient'}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e9e7', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#181c1c', margin: '0 0 16px' }}>New Patient</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#3e4947', marginBottom: '5px' }}>Full Name</label>
                <input type="text" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inpStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#3e4947', marginBottom: '5px' }}>Email</label>
                <input type="email" placeholder="patient@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inpStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#3e4947', marginBottom: '5px' }}>Mobile</label>
                <input type="text" placeholder="+1 (555) 000-0000" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} style={inpStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#3e4947', marginBottom: '5px' }}>Age</label>
                <input type="number" placeholder="Age" value={form.age || ''} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })} style={inpStyle} required min={1} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#3e4947', marginBottom: '5px' }}>Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} style={inpStyle} required>
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            {createPatient.isError && <p style={{ color: '#ba1a1a', fontSize: '12px', marginBottom: '10px' }}>{(createPatient.error as Error).message}</p>}
            <button type="submit" disabled={createPatient.isPending}
              style={{ padding: '9px 20px', background: '#005c55', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', opacity: createPatient.isPending ? 0.6 : 1 }}>
              {createPatient.isPending ? 'Creating...' : 'Create Patient'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'Total Patients', value: displayTotal.toLocaleString(), sub: '+4%', subColor: '#0f766e', iconColor: '#0f766e', iconBg: '#f1f4f3', iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'In-Care Now', value: '42', sub: 'Active', subColor: '#0f766e', iconColor: '#4648d4', iconBg: '#ede9fe', iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
          { label: 'Pending Lab Results', value: '18', sub: '', subColor: '', iconColor: '#e07b39', iconBg: '#fff0e6', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
          { label: 'Critical Alerts', value: '03', sub: '', subColor: '', iconColor: '#ba1a1a', iconBg: '#ffdad6', iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e9e7', borderRadius: '12px', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" fill="none" stroke={s.iconColor} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={s.iconPath} /></svg>
              </div>
              {s.sub && <span style={{ fontSize: '11px', fontWeight: 600, color: s.subColor }}>{s.sub}</span>}
            </div>
            <p style={{ fontSize: '11px', color: '#6e7977', margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: '26px', fontWeight: 700, color: '#181c1c', margin: 0, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e9e7', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e9e7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#181c1c' }}>Patient List</span>
            <span style={{ fontSize: '12px', color: '#6e7977' }}>Show: <span style={{ color: '#005c55', fontWeight: 500 }}>Recent</span></span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#6e7977', pointerEvents: 'none' }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input type="text" placeholder="Search patients..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ padding: '7px 12px 7px 30px', border: '1px solid #d1d9d7', borderRadius: '8px', fontSize: '12px', color: '#181c1c', background: '#f7faf8', outline: 'none', width: '220px', fontFamily: 'Inter, system-ui, sans-serif' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.7fr 1.2fr 1.6fr 1.2fr 0.5fr', padding: '10px 20px', background: '#f7faf8', borderBottom: '1px solid #e5e9e7' }}>
          {['PATIENT NAME', 'AGE', 'GENDER', 'MOBILE', 'EMAIL', 'LAST VISIT', 'ACTIONS'].map((h) => (
            <span key={h} style={{ fontSize: '10px', fontWeight: 700, color: '#6e7977', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {isLoading && <p style={{ padding: '24px', textAlign: 'center', color: '#6e7977', fontSize: '13px' }}>Loading patients...</p>}
        {error && <p style={{ padding: '24px', textAlign: 'center', color: '#ba1a1a', fontSize: '13px' }}>Error: {(error as Error).message}</p>}

        {!isLoading && !error && displayPatients.map((p: any, i: number) => {
          const isDemo = patients.length === 0;
          const name = p.name || '';
          const patientId = isDemo ? p.patientId : `ID: #MF-${String(p.id).slice(-4)}`;
          const lastVisit = isDemo ? p.lastVisit : '—';
          const lastVisitType = isDemo ? p.lastVisitType : '';
          const lastVisitColor = isDemo ? p.lastVisitColor : '#6e7977';
          return (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 0.5fr 0.7fr 1.2fr 1.6fr 1.2fr 0.5fr', padding: '14px 20px', borderBottom: i < displayPatients.length - 1 ? '1px solid #f1f4f3' : 'none', alignItems: 'center', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f7faf8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Avatar name={name} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#181c1c', margin: 0 }}>{name}</p>
                  <p style={{ fontSize: '11px', color: '#6e7977', margin: '2px 0 0' }}>{patientId}</p>
                </div>
              </div>
              <span style={{ fontSize: '13px', color: '#181c1c' }}>{p.age || '—'}</span>
              <GenderBadge gender={p.gender} />
              <span style={{ fontSize: '12px', color: '#3e4947' }}>{p.mobile || '—'}</span>
              <span style={{ fontSize: '12px', color: '#3e4947' }}>{p.email || '—'}</span>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 500, color: '#181c1c', margin: 0 }}>{lastVisit}</p>
                {lastVisitType && <p style={{ fontSize: '11px', color: lastVisitColor, margin: '2px 0 0', fontWeight: 500 }}>{lastVisitType}</p>}
              </div>
              <button style={{ width: '28px', height: '28px', border: '1px solid #e5e9e7', borderRadius: '6px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e7977' }}>
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
              </button>
            </div>
          );
        })}

        <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e9e7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: '#6e7977' }}>Showing 1–{Math.min(10, displayPatients.length)} of {displayTotal.toLocaleString()} patients</span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              style={{ width: '28px', height: '28px', border: '1px solid #e5e9e7', borderRadius: '6px', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3e4947' }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            {[1, 2, 3].map((n) => (
              <button key={n} onClick={() => setPage(n)}
                style={{ width: '28px', height: '28px', border: '1px solid #e5e9e7', borderRadius: '6px', fontSize: '12px', fontWeight: page === n ? 700 : 400, background: page === n ? '#005c55' : '#fff', color: page === n ? '#fff' : '#3e4947', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {n}
              </button>
            ))}
            <span style={{ fontSize: '12px', color: '#6e7977', padding: '0 4px' }}>...</span>
            <button style={{ width: '28px', height: '28px', border: '1px solid #e5e9e7', borderRadius: '6px', fontSize: '12px', background: '#fff', color: '#3e4947', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>
              {Math.ceil(displayTotal / 10)}
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={displayPatients.length < 10}
              style={{ width: '28px', height: '28px', border: '1px solid #e5e9e7', borderRadius: '6px', background: '#fff', cursor: displayPatients.length < 10 ? 'not-allowed' : 'pointer', opacity: displayPatients.length < 10 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3e4947' }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
