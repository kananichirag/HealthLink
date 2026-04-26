'use client';

import React, { useState } from 'react';
import {
  useSetAvailability,
  useBlockDate,
  useUnblockDate,
  useSetMaxAppointments,
  type TimeSlot,
} from '@/hooks/useDoctorQueries';

// ── constants ────────────────────────────────────────────────────────────────
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday',
};
const DEFAULT_ON = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

// ── mini toggle ───────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: '40px', height: '22px', borderRadius: '999px', border: 'none', cursor: 'pointer',
        background: on ? '#005c55' : '#d1d9d7', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '3px', left: on ? '21px' : '3px',
        width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

// ── mini calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({
  blockedDates, onToggleBlock,
}: {
  blockedDates: Set<string>;
  onToggleBlock: (dateStr: string) => void;
}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const toStr = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const isToday = (d: number) => new Date(year, month, d).toDateString() === today.toDateString();

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#181c1c' }}>{monthName}</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['‹', '›'].map((ch, i) => (
            <button key={ch} type="button"
              onClick={() => setViewDate(new Date(year, month + (i === 0 ? -1 : 1), 1))}
              style={{ width: '24px', height: '24px', border: '1px solid #e5e9e7', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '13px', color: '#3e4947', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, color: '#6e7977' }}>{d}</span>
        ))}
      </div>

      {/* Date cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const str = toStr(d);
          const blocked = blockedDates.has(str);
          const todayCell = isToday(d);
          return (
            <button key={i} type="button" onClick={() => onToggleBlock(str)}
              style={{
                width: '28px', height: '28px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: todayCell ? 700 : 400,
                background: blocked ? '#ba1a1a' : todayCell ? '#f1f4f3' : 'transparent',
                color: blocked ? '#fff' : todayCell ? '#005c55' : '#181c1c',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!blocked) e.currentTarget.style.background = '#f1f4f3'; }}
              onMouseLeave={(e) => { if (!blocked) e.currentTarget.style.background = todayCell ? '#f1f4f3' : 'transparent'; }}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ba1a1a', display: 'inline-block' }} />
          <span style={{ fontSize: '10px', color: '#6e7977' }}>Blocked</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e5e9e7', display: 'inline-block' }} />
          <span style={{ fontSize: '10px', color: '#6e7977' }}>Available</span>
        </div>
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
export default function DoctorSchedulePage() {
  const [slots, setSlots] = useState<Record<string, TimeSlot[]>>(() =>
    Object.fromEntries(DEFAULT_ON.map((d) => [d, [{ startTime: '09:00', endTime: '17:00' }]]))
  );
  const [enabledDays, setEnabledDays] = useState<Set<string>>(new Set(DEFAULT_ON));
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [maxPerDay, setMaxPerDay] = useState(24);

  const setAvailability = useSetAvailability();
  const blockDate = useBlockDate();
  const unblockDate = useUnblockDate();
  const setMaxAppointments = useSetMaxAppointments();

  // ── slot helpers ──
  const toggleDay = (day: string) => {
    const next = new Set(enabledDays);
    if (next.has(day)) {
      next.delete(day);
      setSlots({ ...slots, [day]: [] });
    } else {
      next.add(day);
      if (!slots[day]?.length) setSlots({ ...slots, [day]: [{ startTime: '09:00', endTime: '17:00' }] });
    }
    setEnabledDays(next);
  };

  const addSlot = (day: string) => {
    const daySlots = slots[day] || [];
    setSlots({ ...slots, [day]: [...daySlots, { startTime: '09:00', endTime: '09:30' }] });
  };

  const removeSlot = (day: string, index: number) => {
    const daySlots = [...(slots[day] || [])];
    daySlots.splice(index, 1);
    setSlots({ ...slots, [day]: daySlots });
  };

  const updateSlot = (day: string, index: number, field: keyof TimeSlot, value: string) => {
    const daySlots = [...(slots[day] || [])];
    daySlots[index] = { ...daySlots[index], [field]: value };
    setSlots({ ...slots, [day]: daySlots });
  };

  // ── calendar block/unblock ──
  const handleToggleBlock = (dateStr: string) => {
    const next = new Set(blockedDates);
    if (next.has(dateStr)) {
      next.delete(dateStr);
      unblockDate.mutate(dateStr);
    } else {
      next.add(dateStr);
      blockDate.mutate({ date: dateStr });
    }
    setBlockedDates(next);
  };

  // ── save ──
  const handleSaveAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    setAvailability.mutate({ slots });
  };

  const handleSetMax = (e: React.FormEvent) => {
    e.preventDefault();
    setMaxAppointments.mutate({ maxPerDay });
  };

  const timeInp: React.CSSProperties = {
    padding: '6px 10px', border: '1px solid #d1d9d7', borderRadius: '8px',
    fontSize: '13px', color: '#181c1c', background: '#fff', outline: 'none',
    fontFamily: 'Inter, system-ui, sans-serif', width: '110px',
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#181c1c' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#181c1c', margin: 0, letterSpacing: '-0.02em' }}>
            Schedule Management
          </h1>
          <p style={{ fontSize: '13px', color: '#3e4947', marginTop: '4px' }}>
            Configure your weekly availability and manage blocked dates for appointments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button"
            style={{ padding: '9px 18px', border: '1px solid #d1d9d7', borderRadius: '8px', background: '#fff', fontSize: '13px', color: '#3e4947', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>
            Discard Changes
          </button>
          <button type="button" onClick={handleSaveAvailability}
            disabled={setAvailability.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', border: 'none', borderRadius: '8px', background: '#005c55', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', opacity: setAvailability.isPending ? 0.7 : 1 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {setAvailability.isPending ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      </div>

      {/* Status messages */}
      {setAvailability.isSuccess && (
        <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#166534' }}>
          ✓ Availability saved successfully!
        </div>
      )}
      {setAvailability.isError && (
        <div style={{ padding: '10px 14px', background: '#ffdad6', border: '1px solid #ba1a1a', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#93000a' }}>
          {(setAvailability.error as Error).message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>

        {/* LEFT — Weekly Availability */}
        <div style={{ background: '#fff', border: '1px solid #e5e9e7', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e9e7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#181c1c', margin: 0 }}>Weekly Availability</h2>
            <span style={{ padding: '3px 10px', border: '1px solid #0f766e', borderRadius: '999px', fontSize: '11px', fontWeight: 600, color: '#005c55', letterSpacing: '0.04em' }}>
              RECURRING
            </span>
          </div>

          <div style={{ padding: '8px 0' }}>
            {DAYS.map((day, i) => {
              const enabled = enabledDays.has(day);
              const daySlots = slots[day] || [];
              return (
                <div key={day} style={{ padding: '14px 20px', borderBottom: i < DAYS.length - 1 ? '1px solid #f1f4f3' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Toggle on={enabled} onChange={() => toggleDay(day)} />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: enabled ? '#181c1c' : '#bdc9c6', width: '80px' }}>
                      {DAY_LABELS[day]}
                    </span>

                    {enabled ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {daySlots.map((slot, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="time" value={slot.startTime}
                              onChange={(e) => updateSlot(day, idx, 'startTime', e.target.value)}
                              style={timeInp} />
                            <span style={{ fontSize: '12px', color: '#6e7977' }}>to</span>
                            <input type="time" value={slot.endTime}
                              onChange={(e) => updateSlot(day, idx, 'endTime', e.target.value)}
                              style={timeInp} />
                            {daySlots.length > 1 && (
                              <button type="button" onClick={() => removeSlot(day, idx)}
                                style={{ width: '24px', height: '24px', border: '1px solid #e5e9e7', borderRadius: '6px', background: '#fff', cursor: 'pointer', color: '#ba1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#bdc9c6', flex: 1 }}>Unavailable</span>
                    )}

                    {enabled && (
                      <button type="button" onClick={() => addSlot(day)}
                        style={{ width: '28px', height: '28px', border: '1px solid #d1d9d7', borderRadius: '50%', background: '#fff', cursor: 'pointer', color: '#3e4947', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Appointment Load */}
          <div style={{ background: '#fff', border: '1px solid #e5e9e7', borderRadius: '12px', padding: '18px 20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#181c1c', margin: '0 0 14px' }}>Appointment Load</h3>
            <form onSubmit={handleSetMax}>
              <label style={{ display: 'block', fontSize: '12px', color: '#3e4947', marginBottom: '8px' }}>
                Max Appointments Per Day
              </label>
              <input
                type="number"
                value={maxPerDay}
                onChange={(e) => setMaxPerDay(parseInt(e.target.value) || 1)}
                min={1}
                style={{
                  width: '100%', padding: '10px 14px', border: '1px solid #d1d9d7', borderRadius: '8px',
                  fontSize: '22px', fontWeight: 700, color: '#005c55', textAlign: 'center',
                  background: '#fff', outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#0f766e'; e.target.style.boxShadow = '0 0 0 3px rgba(15,118,110,0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#d1d9d7'; e.target.style.boxShadow = 'none'; }}
              />
              <p style={{ fontSize: '11px', color: '#6e7977', margin: '8px 0 12px', lineHeight: 1.5 }}>
                Limiting capacity helps prevent burnout and ensures quality patient care.
              </p>
              <button type="submit" disabled={setMaxAppointments.isPending}
                style={{ width: '100%', padding: '9px', background: '#005c55', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', opacity: setMaxAppointments.isPending ? 0.7 : 1 }}>
                {setMaxAppointments.isPending ? 'Saving...' : 'Update Limit'}
              </button>
              {setMaxAppointments.isSuccess && <p style={{ fontSize: '11px', color: '#0f766e', marginTop: '6px', textAlign: 'center' }}>✓ Updated!</p>}
              {setMaxAppointments.isError && <p style={{ fontSize: '11px', color: '#ba1a1a', marginTop: '6px' }}>{(setMaxAppointments.error as Error).message}</p>}
            </form>
          </div>

          {/* Blocked Dates */}
          <div style={{ background: '#fff', border: '1px solid #e5e9e7', borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#181c1c', margin: 0 }}>Blocked Dates</h3>
              <button type="button" onClick={() => setBlockedDates(new Set())}
                style={{ fontSize: '12px', color: '#005c55', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500 }}>
                Clear All
              </button>
            </div>
            <MiniCalendar blockedDates={blockedDates} onToggleBlock={handleToggleBlock} />
            {blockDate.isError && <p style={{ fontSize: '11px', color: '#ba1a1a', marginTop: '8px' }}>{(blockDate.error as Error).message}</p>}
            {unblockDate.isError && <p style={{ fontSize: '11px', color: '#ba1a1a', marginTop: '8px' }}>{(unblockDate.error as Error).message}</p>}
          </div>

          {/* Efficiency tip */}
          <div style={{ background: '#f1f4f3', border: '1px solid #e5e9e7', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#005c55', display: 'inline-block' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#005c55' }}>Efficiency Tip</span>
            </div>
            <p style={{ fontSize: '12px', color: '#3e4947', lineHeight: 1.5, margin: 0 }}>
              Doctors who block out 15 minutes every 3 hours for charting report 30% higher satisfaction scores from patients.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom publish bar */}
      <div style={{ marginTop: '20px', background: '#fff', border: '1px solid #e5e9e7', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#181c1c', margin: 0 }}>Update global clinic visibility?</p>
          <p style={{ fontSize: '12px', color: '#6e7977', margin: '2px 0 0' }}>Changes will be reflected across all patient-facing booking portals immediately.</p>
        </div>
        <button type="button" onClick={handleSaveAvailability} disabled={setAvailability.isPending}
          style={{ padding: '10px 22px', background: '#005c55', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', opacity: setAvailability.isPending ? 0.7 : 1 }}>
          {setAvailability.isPending ? 'Publishing...' : 'Publish Changes'}
        </button>
      </div>
    </div>
  );
}
