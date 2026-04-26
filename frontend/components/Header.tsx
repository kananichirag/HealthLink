'use client';

import { useRouter } from 'next/navigation';
import { removeToken } from '@/lib/api';
import NotificationBell from './notifications/NotificationBell';

type UserRole = 'DOCTOR' | 'PATIENT' | 'PHARMACY' | 'ADMIN';

interface HeaderProps {
  userName: string;
  userRole?: UserRole;
  placeholder?: string;
}

export default function Header({ userName, userRole, placeholder = 'Search patients, records, or files...' }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  const initials = userName
    .split('@')[0]
    .split('.')
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  const displayName = userName.includes('@')
    ? userName.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : userName;

  // Get role-specific display information
  const getRoleDisplay = (role?: UserRole) => {
    switch (role) {
      case 'DOCTOR':
        return {
          prefix: 'Dr.',
          title: 'Doctor Portal',
          gradient: 'linear-gradient(135deg, #0f766e, #005c55)',
        };
      case 'PATIENT':
        return {
          prefix: '',
          title: 'Patient Portal',
          gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        };
      case 'PHARMACY':
        return {
          prefix: '',
          title: 'Pharmacy Portal',
          gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        };
      case 'ADMIN':
        return {
          prefix: '',
          title: 'Admin Portal',
          gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
        };
      default:
        return {
          prefix: '',
          title: 'User',
          gradient: 'linear-gradient(135deg, #6b7280, #4b5563)',
        };
    }
  };

  const roleDisplay = getRoleDisplay(userRole);

  return (
    <header
      style={{
        height: '56px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e9e7',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
        flexShrink: 0,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Search */}
      <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6e7977', pointerEvents: 'none' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '7px 12px 7px 32px',
            border: '1px solid #e5e9e7',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#181c1c',
            background: '#f7faf8',
            outline: 'none',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#0f766e'; e.target.style.background = '#fff'; }}
          onBlur={(e) => { e.target.style.borderColor = '#e5e9e7'; e.target.style.background = '#f7faf8'; }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Notification bell */}
        <NotificationBell />

        {/* Help */}
        <button
          style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e5e9e7', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6e7977' }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#181c1c', margin: 0, lineHeight: 1.2 }}>
              {roleDisplay.prefix} {displayName}
            </p>
            <p style={{ fontSize: '11px', color: '#6e7977', margin: 0 }}>{roleDisplay.title}</p>
          </div>
          <div
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: roleDisplay.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '12px', fontWeight: 700, flexShrink: 0,
            }}
          >
            {initials || userRole?.substring(0, 2) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
