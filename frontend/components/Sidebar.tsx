'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type UserRole = 'DOCTOR' | 'PATIENT' | 'PHARMACY' | 'ADMIN';

interface SidebarProps {
  role: UserRole;
}

/**
 * Sidebar component for authenticated pages
 * Displays role-appropriate navigation links with active route highlighting
 * Collapses to hamburger menu on narrow viewports (< 768px)
 */
export default function Sidebar({ role }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Define navigation links based on user role
  const getNavLinks = (): { label: string; href: string; icon: string }[] => {
    switch (role) {
      case 'DOCTOR':
        return [
          { label: 'Patients', href: '/dashboard/doctor/patients', icon: '👥' },
          { label: 'Allergy Reports', href: '/dashboard/doctor/allergy-reports', icon: '🩺' },
          { label: 'Prescriptions', href: '/dashboard/doctor/prescriptions', icon: '💊' },
          { label: 'Pharmacy Connections', href: '/dashboard/doctor/pharmacy-connections', icon: '🔗' },
          { label: 'Appointments', href: '/dashboard/doctor/appointments', icon: '🗓️' },
          { label: 'Schedule', href: '/dashboard/doctor/schedule', icon: '📅' },
        ];
      case 'PATIENT':
        return [
          { label: 'Doctors', href: '/dashboard/patient/doctors', icon: '🩻' },
          { label: 'Appointments', href: '/dashboard/patient/appointments', icon: '🗓️' },
          { label: 'Prescriptions', href: '/dashboard/patient/prescriptions', icon: '💊' },
        ];
      case 'PHARMACY':
        return [
          { label: 'Prescriptions', href: '/dashboard/pharmacy/prescriptions', icon: '💊' },
          { label: 'Medicines', href: '/dashboard/pharmacy/medicines', icon: '💉' },
          { label: 'Inventory', href: '/dashboard/pharmacy/inventory', icon: '📦' },
          { label: 'Purchases', href: '/dashboard/pharmacy/purchases', icon: '🛒' },
          { label: 'Sales', href: '/dashboard/pharmacy/sales', icon: '🧾' },
          { label: 'Reports', href: '/dashboard/pharmacy/reports', icon: '📈' },
        ];
      case 'ADMIN':
        return [
          { label: 'Tenants', href: '/dashboard/admin/tenants', icon: '🏢' },
          { label: 'Users', href: '/dashboard/admin/users', icon: '👤' },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'DOCTOR': return 'from-blue-500 to-blue-600';
      case 'PATIENT': return 'from-green-500 to-green-600';
      case 'PHARMACY': return 'from-purple-500 to-purple-600';
      case 'ADMIN': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
        aria-label="Toggle sidebar"
      >
        <svg
          className={`w-6 h-6 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Sidebar overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-screen w-72 shrink-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl transform transition-all duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                HealthCare+
              </h1>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-2 flex-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 transform hover:translate-x-1 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'hover:bg-white/10'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-2xl mr-4 group-hover:scale-110 transition-transform duration-200">
                    {link.icon}
                  </span>
                  <span className={`font-medium transition-colors duration-200 ${
                    isActive ? 'text-white' : 'group-hover:text-white'
                  }`}>
                    {link.label}
                  </span>
                  {isActive && (
                    <span className="w-2 h-2 bg-white rounded-full ml-auto" />
                  )}
                  {!isActive && (
                    <svg 
                      className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Role badge */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Current Role</p>
              <div className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${getRoleColor(role)} rounded-full shadow-lg`}>
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-bold text-white">{role}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              © 2024 HealthCare+
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
