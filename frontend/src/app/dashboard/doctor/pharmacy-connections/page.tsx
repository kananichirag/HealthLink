'use client';

import React, { useState } from 'react';
import {
  usePharmacyConnections,
  useAvailablePharmacies,
  useRequestConnection,
  useTerminateConnection,
} from '@/hooks/useDoctorQueries';

// ── helpers ───────────────────────────────────────────────────────────────────
const ICON_COLORS = ['#0f766e', '#e07b39', '#4648d4', '#7f4025', '#16a34a'];

function PharmacyIcon({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: '13px', fontWeight: 700, color }}>{initials}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    ACTIVE: { bg: '#f0fdf4', color: '#16a34a', label: 'Active' },
    PENDING: { bg: '#fffbeb', color: '#d97706', label: 'Pending Approval' },
    INACTIVE: { bg: '#f7faf8', color: '#6e7977', label: 'Inactive' },
  };
  const s = map[status] || map.INACTIVE;
  return (
    <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

type TabType = 'all' | 'active' | 'pending';

// ── demo data (shown when API returns empty) ──────────────────────────────────
const DEMO_CONNECTIONS = [
  { id: 'd1', pharmacyId: 'd1', status: 'ACTIVE', pharmacy: { name: "St. Mary's Community Rx", email: 'stmarys@rx.com' }, connectedSince: 'Oct 12, 2023', address: '452 Medical Plaza, Suite 10', phone: '(555) 123-4567' },
  { id: 'd2', pharmacyId: 'd2', status: 'PENDING', pharmacy: { name: 'HealthLink Wellness Center', email: 'healthlink@wellness.com' }, connectedSince: 'Jan 04, 2024', address: '89 Greenway Blvd, East Side', phone: '(555) 987-6543' },
  { id: 'd3', pharmacyId: 'd3', status: 'ACTIVE', pharmacy: { name: 'CityCare Specialized Rx', email: 'citycare@rx.com' }, connectedSince: 'May 20, 2023', address: '12 Market St, Central District', phone: '(555) 444-2222' },
  { id: 'd4', pharmacyId: 'd4', status: 'INACTIVE', pharmacy: { name: 'Northside Family Meds', email: 'northside@meds.com' }, connectedSince: 'Dec 20, 2023', address: '777 Polar Way, North Point', phone: '(555) 000-1111' },
];

// ── page ──────────────────────────────────────────────────────────────────────
export default function PharmacyConnectionsPage() {
  const [tab, setTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: connectionsData, isLoading: loadingConnections, error: connectionsError } = usePharmacyConnections();
  const { data: pharmaciesData, isLoading: loadingPharmacies } = useAvailablePharmacies();

  const connections: any[] = Array.isArray(connectionsData) ? connectionsData : [];
  const pharmacies: any[] = Array.isArray(pharmaciesData) ? pharmaciesData : [];

  const requestConnection = useRequestConnection();
  const terminateConnection = useTerminateConnection();

  const connectedPharmacyIds = new Set(connections.map((c: any) => c.pharmacyId));

  // Use demo data when API returns empty
  const displayConnections = connections.length > 0 ? connections : DEMO_CONNECTIONS;

  const filtered = displayConnections.filter((c: any) => {
    if (tab === 'active') return c.status === 'ACTIVE';
    if (tab === 'pending') return c.status === 'PENDING';
    return true;
  });

  const activeCount = displayConnections.filter((c: any) => c.status === 'ACTIVE').length;
  const pendingCount = displayConnections.filter((c: any) => c.status === 'PENDING').length;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#181c1c' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#6e7977', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 4px' }}>Manage Network</p>
          <p style={{ fontSize: '13px', color: '#3e4947', margin: 0 }}>Connect with trusted local and national pharmacies for direct e-prescribing.</p>
        </div>
        <button
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', background: '#005c55', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', transition: 'background 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#0f766e'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#005c55'; }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Request New Connection
        </button>
      </div>

      {/* Tabs + view toggle */}
      <div style={{ background: '#fff', border: '1px solid #e5e9e7', borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {([
            { key: 'all', label: `All Connections`, count: displayConnections.length },
            { key: 'active', label: 'Active', count: activeCount },
            { key: 'pending', label: 'Pending', count: pendingCount },
          ] as { key: TabType; label: string; count: number }[]).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: tab === t.key ? '#f1f4f3' : 'transparent',
                color: tab === t.key ? '#005c55' : '#3e4947',
                fontSize: '13px', fontWeight: tab === t.key ? 600 : 400,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>
              {t.label}
              {t.count > 0 && (
                <span style={{ padding: '1px 6px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: tab === t.key ? '#005c55' : '#e5e9e7', color: tab === t.key ? '#fff' : '#6e7977' }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* View mode */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['grid', 'list'] as const).map((m) => (
            <button key={m} onClick={() => setViewMode(m)}
              style={{ width: '32px', height: '32px', border: '1px solid #e5e9e7', borderRadius: '6px', background: viewMode === m ? '#f1f4f3' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: viewMode === m ? '#005c55' : '#6e7977' }}>
              {m === 'grid'
                ? <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                : <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              }
            </button>
          ))}
        </div>
      </div>

      {/* Loading / error */}
      {loadingConnections && <p style={{ textAlign: 'center', color: '#6e7977', fontSize: '13px', padding: '24px' }}>Loading connections...</p>}
      {connectionsError && <p style={{ textAlign: 'center', color: '#ba1a1a', fontSize: '13px', padding: '24px' }}>Error: {(connectionsError as Error).message}</p>}

      {/* Connection cards */}
      {!loadingConnections && !connectionsError && (
        <div style={{
          display: viewMode === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(3, 1fr)' : undefined,
          flexDirection: viewMode === 'list' ? 'column' : undefined,
          gap: '16px',
          marginBottom: '20px',
        }}>
          {filtered.map((c: any, i: number) => {
            const name = c.pharmacy?.name || c.pharmacyId;
            const isDemo = connections.length === 0;
            const address = isDemo ? c.address : (c.pharmacy?.email || '');
            const phone = isDemo ? c.phone : '';
            const since = isDemo ? c.connectedSince : '';
            const sinceLabel = c.status === 'INACTIVE' ? `Disconnected ${since}` : c.status === 'PENDING' ? `Requested ${since}` : `Connected since ${since}`;

            return (
              <div key={c.id}
                style={{ background: '#fff', border: '1px solid #e5e9e7', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <PharmacyIcon name={name} color={ICON_COLORS[i % ICON_COLORS.length]} />
                  <StatusBadge status={c.status} />
                </div>

                {/* Name + since */}
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#181c1c', margin: '0 0 4px' }}>{name}</p>
                  {since && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <svg width="11" height="11" fill="none" stroke="#6e7977" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span style={{ fontSize: '11px', color: '#6e7977' }}>{sinceLabel}</span>
                    </div>
                  )}
                </div>

                {/* Address + phone */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="12" height="12" fill="none" stroke="#6e7977" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span style={{ fontSize: '12px', color: '#3e4947' }}>{address}</span>
                    </div>
                  )}
                  {phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="12" height="12" fill="none" stroke="#6e7977" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      <span style={{ fontSize: '12px', color: '#3e4947' }}>{phone}</span>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', paddingTop: '12px', borderTop: '1px solid #f1f4f3' }}>
                  {c.status === 'ACTIVE' && (
                    <button
                      onClick={() => terminateConnection.mutate(c.id)}
                      disabled={terminateConnection.isPending}
                      style={{ padding: '7px 16px', border: '1.5px solid #005c55', borderRadius: '8px', background: 'transparent', color: '#005c55', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      View Details
                    </button>
                  )}
                  {c.status === 'PENDING' && (
                    <button style={{ padding: '7px 16px', border: '1px solid #d1d9d7', borderRadius: '8px', background: '#fff', color: '#3e4947', fontSize: '12px', fontWeight: 500, cursor: 'default', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      Awaiting Response
                    </button>
                  )}
                  {c.status === 'INACTIVE' && (
                    <button
                      onClick={() => requestConnection.mutate(c.pharmacyId)}
                      disabled={requestConnection.isPending}
                      style={{ padding: '7px 16px', border: '1px solid #d1d9d7', borderRadius: '8px', background: '#fff', color: '#3e4947', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      Re-Establish
                    </button>
                  )}
                  <button style={{ width: '28px', height: '28px', border: '1px solid #e5e9e7', borderRadius: '6px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6e7977' }}>
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Available pharmacies to connect */}
          {!loadingPharmacies && pharmacies.filter((p: any) => !connectedPharmacyIds.has(p.id)).map((p: any, i: number) => (
            <div key={p.id}
              style={{ background: '#fff', border: '1.5px dashed #d1d9d7', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <PharmacyIcon name={p.name} color={ICON_COLORS[(i + 2) % ICON_COLORS.length]} />
                <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: '#f7faf8', color: '#6e7977' }}>Available</span>
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#181c1c', margin: '0 0 4px' }}>{p.name}</p>
                {p.email && <p style={{ fontSize: '12px', color: '#6e7977', margin: 0 }}>{p.email}</p>}
              </div>
              <div style={{ paddingTop: '12px', borderTop: '1px solid #f1f4f3' }}>
                <button
                  onClick={() => requestConnection.mutate(p.id)}
                  disabled={requestConnection.isPending}
                  style={{ padding: '7px 16px', border: 'none', borderRadius: '8px', background: '#005c55', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {requestConnection.isError && (
        <p style={{ color: '#ba1a1a', fontSize: '12px', marginBottom: '16px' }}>{(requestConnection.error as Error).message}</p>
      )}

      {/* Bottom banners */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Insights */}
        <div style={{ background: 'linear-gradient(135deg, #005c55, #0f766e)', borderRadius: '12px', padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '20px', bottom: '10px', opacity: 0.15 }}>
            <svg width="80" height="80" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Pharmacy Network Insights</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
            Your connected pharmacies have successfully filled over 1,240 prescriptions this month with zero discrepancies reported.
          </p>
        </div>

        {/* Fast Connect */}
        <div style={{ background: 'linear-gradient(135deg, #4648d4, #6063ee)', borderRadius: '12px', padding: '20px 24px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Fast Connect</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: '0 0 16px' }}>
            Scan a pharmacy QR code to instantly request a secure data bridge connection.
          </p>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: '#fff', border: 'none', borderRadius: '8px', color: '#4648d4', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
            Scan Pharmacy ID
          </button>
        </div>
      </div>
    </div>
  );
}
