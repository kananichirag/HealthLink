'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';

type UserRole = 'DOCTOR' | 'PATIENT' | 'PHARMACY' | 'ADMIN';

interface DecodedToken {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

const DEFAULT_ROUTES: Record<UserRole, string> = {
  DOCTOR: '/dashboard/doctor',
  PATIENT: '/dashboard/patient/doctors',
  PHARMACY: '/dashboard/pharmacy/prescriptions',
  ADMIN: '/dashboard/admin/tenants',
};

/**
 * Dashboard home page — redirects to the role-appropriate default page.
 * Falls back to a loading spinner while decoding the JWT.
 */
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) return; // layout.tsx handles the login redirect

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return;

      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      ) as DecodedToken;

      const target = DEFAULT_ROUTES[payload.role];
      if (target) {
        router.replace(target);
      }
    } catch {
      // layout.tsx handles redirect on invalid token
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4" />
        <p className="text-lg text-gray-600 font-medium">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
