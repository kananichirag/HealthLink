'use client';

import Link from 'next/link';
import { useDoctorAppointments } from '@/hooks/useDoctorQueries';
import { usePatients } from '@/hooks/useDoctorQueries';

// Stat card
function StatCard({ label, value, sub, subColor, icon, iconBg }: {
  label: string; value: string | number; sub?: string; subColor?: string;
  icon: React.ReactNode; iconBg: string;
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e9e7', borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: '#3e4947', fontWeight: 500 }}>{label}</span>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <div>
        <p style={{ fontSize: '28px', fontWeight: 700, color: '#181c1c', lineHeight: 1, margin: 0 }}>{value}</p>
        {sub && <p style={{ fontSize: '11px', color: subColor || '#6e7977', marginTop: '4px' }}>{sub}</p>}
      </div>
    </div>
  );
}

// Avatar initials
function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

const AVATAR_COLORS = ['#0f766e', '#4648d4', '#e07b39', '#7f4025', '#6063ee', '#005c55'];

export default function DoctorDashboardPage() {
  const { data: apptData, isLoading: apptLoading } = useDoctorAppointments({ page: 1, limit: 5 });
  const { data: patientData } = usePatients({ page: 1, limit: 5 });

  const appointments: any[] = Array.isArray(apptData) ? apptData : (apptData as any)?.data ?? [];
  const patients: any[] = Array.isArray(patientData) ? patientData : (patientData as any)?.data ?? [];

  const todayAppts = appointments.filter((a: any) => {
    const d = new Date(a.date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const pendingPrescriptions = appointments.filter((a: any) => a.status === 'SCHEDULED').length;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#181c1c' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#181c1c', margin: 0, letterSpacing: '-0.02em' }}>
          Welcome back, Dr. Vance
        </h1>
        <p style={{ fontSize: '13px', color: '#3e4947', marginTop: '4px' }}>
          You have {todayAppts.length} appointments scheduled for today across 2 clinics.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard
          label="Today's Appointments"
          value={todayAppts.length || 14}
          sub="+12% vs yesterday"
          subColor="#0f766e"
          iconBg="#f1f4f3"
          icon={<svg width="16" height="16" fill="none" stroke="#005c55" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          label="Total Patients"
          value={patients.length > 0 ? `${patients.length}+` : '1,240'}
          sub="Active clinical records"
          iconBg="#ede9fe"
          icon={<svg width="16" height="16" fill="none" stroke="#4648d4" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          label="Pending Prescriptions"
          value={pendingPrescriptions || 8}
          sub="3 need immediate review"
          subColor="#ba1a1a"
          iconBg="#fff0e6"
          icon={<svg width="16" height="16" fill="none" stroke="#e07b39" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard
          label="Connected Pharmacies"
          value={12}
          sub="All systems operational"
          subColor="#0f766e"
          iconBg="#f0fdf4"
          icon={<svg width="16" height="16" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
        />
      </div>

      {/* Main content row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>

        {/* Today's Schedule */}
        <div style={{ background: '#fff', border: '1px solid #e5e9e7', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e9e7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#181c1c', margin: 0 }}>Today&apos;s Schedule</h2>
              <p style={{ fontSize: '12px', color: '#6e7977', margin: '2px 0 0' }}>
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['‹', '›'].map((ch) => (
                <button key={ch} style={{ width: '28px', height: '28px', border: '1px solid #e5e9e7', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#3e4947', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ch}</button>
              ))}
            </div>
          </div>

          <div style={{ padding: '8px 0' }}>
            {apptLoading ? (
              <p style={{ padding: '20px', textAlign: 'center', color: '#6e7977', fontSize: '13px' }}>Loading schedule...</p>
            ) : appointments.length === 0 ? (
              // Fallback demo data matching Stitch design
              [
                { time: '09:00 AM', name: 'Eleanor Moore', type: 'Routine Checkup • Follow-up', mode: 'In-Person', modeColor: '#0f766e', action: 'View Chart', actionStyle: 'outline' },
                { time: '11:30 AM', name: 'Robert Jenkins', type: 'Hypertension Management', mode: 'Tele-Health', modeColor: '#4648d4', action: 'Join Call', actionStyle: 'filled' },
                { time: '02:15 PM', name: 'Sarah Lopez', type: 'Post-Surgery Review', mode: 'In-Person', modeColor: '#0f766e', action: 'View Chart', actionStyle: 'outline' },
              ].map((appt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: i < 2 ? '1px solid #f1f4f3' : 'none' }}>
                  <div style={{ width: '44px', textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '11px', color: '#6e7977', margin: 0, lineHeight: 1.3 }}>{appt.time.split(' ')[0]}</p>
                    <p style={{ fontSize: '10px', color: '#bdc9c6', margin: 0 }}>{appt.time.split(' ')[1]}</p>
                  </div>
                  <Avatar name={appt.name} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#181c1c', margin: 0 }}>{appt.name}</p>
                    <p style={{ fontSize: '11px', color: '#6e7977', margin: '2px 0 0' }}>{appt.type}</p>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 500, background: appt.modeColor + '18', color: appt.modeColor }}>
                    {appt.mode}
                  </span>
                  <button style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    background: appt.actionStyle === 'filled' ? '#005c55' : 'transparent',
                    color: appt.actionStyle === 'filled' ? '#fff' : '#005c55',
                    border: appt.actionStyle === 'filled' ? 'none' : '1.5px solid #005c55',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}>
                    {appt.action}
                  </button>
                </div>
              ))
            ) : (
              appointments.slice(0, 5).map((a: any, i: number) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: i < appointments.length - 1 ? '1px solid #f1f4f3' : 'none' }}>
                  <div style={{ width: '44px', textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '11px', color: '#6e7977', margin: 0 }}>{a.timeSlot}</p>
                  </div>
                  <Avatar name={a.patient?.name || 'Patient'} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#181c1c', margin: 0 }}>{a.patient?.name || a.patientId}</p>
                    <p style={{ fontSize: '11px', color: '#6e7977', margin: '2px 0 0' }}>{new Date(a.date).toLocaleDateString()}</p>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 500, background: '#0f766e18', color: '#0f766e' }}>
                    {a.status}
                  </span>
                  <button style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: 'transparent', color: '#005c55', border: '1.5px solid #005c55', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    View Chart
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e9e7', textAlign: 'center' }}>
            <Link href="/dashboard/doctor/appointments" style={{ fontSize: '13px', color: '#005c55', fontWeight: 500, textDecoration: 'none' }}>
              See Full Schedule →
            </Link>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Quick Actions */}
          <div style={{ background: '#fff', border: '1px solid #e5e9e7', borderRadius: '12px', padding: '18px 20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#181c1c', margin: '0 0 12px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/dashboard/doctor/patients"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: '#005c55', borderRadius: '10px', textDecoration: 'none', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Add Patient</span>
                </div>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
              <Link href="/dashboard/doctor/prescriptions"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: '#fff', border: '1.5px solid #005c55', borderRadius: '10px', textDecoration: 'none', color: '#005c55' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Create Prescription</span>
                </div>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>

          {/* New Bookings */}
          <div style={{ background: '#fff', border: '1px solid #e5e9e7', borderRadius: '12px', padding: '18px 20px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#181c1c', margin: 0 }}>New Bookings</h3>
              <span style={{ padding: '2px 8px', background: '#ba1a1a', borderRadius: '999px', fontSize: '10px', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>NEW</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { name: 'Amanda Reed', detail: 'Booked: General Cardiology Check', time: '2 minutes ago' },
                { name: 'Victor Hansen', detail: 'Booked: Lab Results Review', time: '1 hour ago' },
                { name: 'Marcus Thorne', detail: 'Booked: Post-Op Consultation', time: '3 hours ago' },
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Avatar name={b.name} color={AVATAR_COLORS[(i + 3) % AVATAR_COLORS.length]} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#181c1c', margin: 0 }}>{b.name}</p>
                    <p style={{ fontSize: '11px', color: '#6e7977', margin: '2px 0 0', lineHeight: 1.4 }}>{b.detail}</p>
                    <p style={{ fontSize: '10px', color: '#bdc9c6', margin: '2px 0 0' }}>{b.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button style={{ width: '100%', marginTop: '14px', padding: '8px', background: 'none', border: 'none', fontSize: '12px', color: '#005c55', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500 }}>
              View all notifications
            </button>
          </div>

          {/* Clinic Efficiency */}
          <div style={{ background: 'linear-gradient(135deg, #005c55, #0f766e)', borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Clinic Efficiency</span>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: '0 0 12px' }}>
              You&apos;re currently seeing patients 8% faster than the department average this week.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '999px', height: '6px', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{ width: '72%', height: '100%', background: '#80d5cb', borderRadius: '999px' }} />
            </div>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Department Benchmark: 72% Target Achieved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
