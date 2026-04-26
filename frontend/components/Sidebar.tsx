'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { removeToken } from '@/lib/api';

type UserRole = 'DOCTOR' | 'PATIENT' | 'PHARMACY' | 'ADMIN';

interface SidebarProps {
  role: UserRole;
}

// SVG icon paths
const Icons = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  patients: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  schedule: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  prescriptions: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  allergy: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  pharmacy: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  inventory: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  reports: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  doctors: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  tenants: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  help: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  connections: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  sales: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
  purchases: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
};

function NavIcon({ path }: { path: string }) {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export default function Sidebar({ role }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  const getNavLinks = () => {
    switch (role) {
      case 'DOCTOR':
        return [
          { label: 'Dashboard', href: '/dashboard/doctor', icon: Icons.dashboard },
          { label: 'Patients', href: '/dashboard/doctor/patients', icon: Icons.patients },
          { label: 'Schedule', href: '/dashboard/doctor/schedule', icon: Icons.schedule },
          { label: 'Prescriptions', href: '/dashboard/doctor/prescriptions', icon: Icons.prescriptions },
          { label: 'Allergy Reports', href: '/dashboard/doctor/allergy-reports', icon: Icons.allergy },
          { label: 'Pharmacy Connections', href: '/dashboard/doctor/pharmacy-connections', icon: Icons.connections },
          { label: 'Appointments', href: '/dashboard/doctor/appointments', icon: Icons.schedule },
          { label: 'Settings', href: '/dashboard/doctor/settings', icon: Icons.settings },
        ];
      case 'PATIENT':
        return [
          { label: 'Dashboard', href: '/dashboard/patient', icon: Icons.dashboard },
          { label: 'Doctors', href: '/dashboard/patient/doctors', icon: Icons.doctors },
          { label: 'Appointments', href: '/dashboard/patient/appointments', icon: Icons.schedule },
          { label: 'Prescriptions', href: '/dashboard/patient/prescriptions', icon: Icons.prescriptions },
        ];
      case 'PHARMACY':
        return [
          { label: 'Dashboard', href: '/dashboard/pharmacy', icon: Icons.dashboard },
          { label: 'Prescriptions', href: '/dashboard/pharmacy/prescriptions', icon: Icons.prescriptions },
          { label: 'Medicines', href: '/dashboard/pharmacy/medicines', icon: Icons.pharmacy },
          { label: 'Inventory', href: '/dashboard/pharmacy/inventory', icon: Icons.inventory },
          { label: 'Purchases', href: '/dashboard/pharmacy/purchases', icon: Icons.purchases },
          { label: 'Sales', href: '/dashboard/pharmacy/sales', icon: Icons.sales },
          { label: 'Reports', href: '/dashboard/pharmacy/reports', icon: Icons.reports },
        ];
      case 'ADMIN':
        return [
          { label: 'Dashboard', href: '/dashboard/admin', icon: Icons.dashboard },
          { label: 'Tenants', href: '/dashboard/admin/tenants', icon: Icons.tenants },
          { label: 'Users', href: '/dashboard/admin/users', icon: Icons.users },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const isActive = (href: string) => {
    if (href === '/dashboard/doctor' || href === '/dashboard/patient' || href === '/dashboard/pharmacy' || href === '/dashboard/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-gray-200"
        aria-label="Toggle sidebar"
      >
        <svg width="20" height="20" fill="none" stroke="#005c55" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: '220px',
          flexShrink: 0,
          background: '#ffffff',
          borderRight: '1px solid #e5e9e7',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
        className={`fixed md:static top-0 left-0 z-40 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e5e9e7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
            <div style={{ width: '32px', height: '32px', background: '#005c55', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '15px', color: '#181c1c', lineHeight: 1 }}>MediFlow</p>
              <p style={{ fontSize: '9px', color: '#6e7977', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2px' }}>Clinical Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  color: active ? '#005c55' : '#3e4947',
                  background: active ? '#f1f4f3' : 'transparent',
                  borderLeft: active ? '3px solid #005c55' : '3px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = '#f7faf8'; e.currentTarget.style.color = '#181c1c'; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3e4947'; } }}
              >
                <span style={{ color: active ? '#005c55' : '#6e7977', flexShrink: 0 }}>
                  <NavIcon path={link.icon} />
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid #e5e9e7', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* New Appointment CTA */}
          {role === 'DOCTOR' && (
            <Link
              href="/dashboard/doctor/appointments"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px 12px', borderRadius: '8px',
                background: '#005c55', color: '#fff',
                fontSize: '13px', fontWeight: 600,
                textDecoration: 'none', marginBottom: '8px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#0f766e'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#005c55'; }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Appointment
            </Link>
          )}

          <button
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', color: '#3e4947', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'Inter, system-ui, sans-serif', transition: 'background 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f7faf8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ color: '#6e7977' }}><NavIcon path={Icons.help} /></span>
            Help Center
          </button>

          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', color: '#3e4947', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'Inter, system-ui, sans-serif', transition: 'background 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f7faf8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ color: '#6e7977' }}><NavIcon path={Icons.logout} /></span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
