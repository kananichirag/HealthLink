'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';

type UserRole = 'DOCTOR' | 'PATIENT' | 'PHARMACY' | 'ADMIN';

interface DecodedToken {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Layout wrapper for all authenticated dashboard pages.
 * Handles auth check, decodes JWT, and renders Sidebar + Header for every sub-route.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token format');

      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      ) as DecodedToken;

      setUserRole(payload.role);
      setUserName(payload.email);
      setIsAuthenticated(true);
    } catch {
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f7faf8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e5e9e7', borderTopColor: '#005c55', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', color: '#3e4947', fontFamily: 'Inter, system-ui, sans-serif' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !userRole) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f7faf8', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar role={userRole} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Header userName={userName} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
