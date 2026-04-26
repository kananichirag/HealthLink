'use client';

import React, { useState, useEffect } from 'react';
import {
  usePatientPrescriptions,
  usePatientPrescriptionDetail,
} from '@/hooks/usePatientQueries';
import {
  Pill,
  Calendar,
  User,
  Download,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  X
} from 'lucide-react';

const statusConfig: Record<string, { bg: string; text: string; dot: string; icon: React.ReactNode; label: string }> = {
  DISPENSED: {
    bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500',
    icon: <CheckCircle size={12} />, label: 'DISPENSED'
  },
  PENDING: {
    bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500',
    icon: <Clock size={12} />, label: 'PENDING'
  },
  CANCELLED: {
    bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500',
    icon: <XCircle size={12} />, label: 'CANCELLED'
  },
};

const TABS = ['All', 'Active', 'Completed', 'Cancelled'] as const;
type Tab = typeof TABS[number];

const tabToStatus: Record<Tab, string> = {
  All: '',
  Active: 'PENDING',
  Completed: 'DISPENSED',
  Cancelled: 'CANCELLED',
};

export default function PatientPrescriptionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  const statusFilter = tabToStatus[activeTab];

  const { data, isLoading, error } = usePatientPrescriptions({
    status: statusFilter || undefined,
    page,
    limit: 10,
  });
  const prescriptions = Array.isArray(data) ? data : (data as any)?.data ?? [];

  const { data: detail, isLoading: detailLoading } = usePatientPrescriptionDetail(selectedId);

  // Mock prescription card data for display
  const getPrescriptionTitle = (p: any) => {
    const items = p.items || [];
    if (items.length === 0) return 'Prescription';
    if (items.length === 1) return items[0].medicineName || 'Prescription';
    return `${items[0].medicineName || 'Medication'} Plan`;
  };

  const getMedicineNames = (p: any) => {
    return (p.items || []).map((i: any) => i.medicineName || i.medicine?.name).filter(Boolean).join(', ') || '—';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Detail Modal */}
      {selectedId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Prescription Details</h2>
              <button onClick={() => setSelectedId('')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            {detailLoading ? (
              <div className="p-12 flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mb-3"></div>
                <p className="text-gray-500 text-sm">Loading details...</p>
              </div>
            ) : detail ? (
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Doctor</p>
                    <p className="text-sm font-semibold text-gray-900">{(detail as any).doctor?.name || (detail as any).doctor?.email || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Date Issued</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {isClient ? new Date((detail as any).createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${statusConfig[(detail as any).status]?.bg || 'bg-gray-100'} ${statusConfig[(detail as any).status]?.text || 'text-gray-700'}`}>
                      {statusConfig[(detail as any).status]?.icon}
                      {(detail as any).status}
                    </span>
                  </div>
                  {(detail as any).targetPharmacy && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Pharmacy</p>
                      <p className="text-sm font-semibold text-gray-900">{(detail as any).targetPharmacy.name || (detail as any).targetPharmacy.email}</p>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Medicines</h3>
                  <div className="space-y-2">
                    {((detail as any).items || []).map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-teal-50 border border-teal-100 rounded-lg">
                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Pill size={16} className="text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.medicineName || item.medicine?.name || '—'}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{item.dosage} • {item.frequency} • Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="p-6 text-gray-500">No details available</p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Prescriptions</h1>
              <p className="text-gray-600 text-sm mt-1">Manage and track your active medication plans and historical prescriptions.</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                <Download size={18} />
                Export History
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">
                <Plus size={18} />
                Request Refill
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Tabs + Filter */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPage(1); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by medication or doctor..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent w-64"
            />
          </div>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading prescriptions...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-700 font-medium">Error loading prescriptions</p>
            <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {prescriptions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <Pill size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No prescriptions found</p>
                <p className="text-gray-500 text-sm mt-1">Your prescriptions will appear here once issued by your doctor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prescriptions.map((p: any) => {
                  const config = statusConfig[p.status] || { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', icon: null, label: p.status };
                  const isCancelled = p.status === 'CANCELLED';
                  const medicines = getMedicineNames(p);

                  return (
                    <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">{p.id?.slice(0, 8)?.toUpperCase() || 'RX-00000'}</p>
                          <h3 className={`text-lg font-bold ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {getPrescriptionTitle(p)}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Issued on {isClient ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${config.bg} ${config.text}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      </div>

                      {/* Medicine Info */}
                      <div className="space-y-2 mb-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Pill size={14} className={isCancelled ? 'text-gray-400' : 'text-teal-600'} />
                          </div>
                          <p className={`text-sm ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {medicines}
                          </p>
                        </div>

                        {p.status === 'DISPENSED' && (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Calendar size={14} className="text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-700">Twice daily, after meals • 14 days remaining</p>
                          </div>
                        )}

                        {p.status === 'PENDING' && (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Clock size={14} className="text-amber-600" />
                            </div>
                            <p className="text-sm text-amber-700">Waiting for pharmacy verification...</p>
                          </div>
                        )}

                        {p.status === 'CANCELLED' && (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <XCircle size={14} className="text-red-500" />
                            </div>
                            <p className="text-sm text-red-500">Replaced by alternative treatment plan</p>
                          </div>
                        )}
                      </div>

                      {/* Doctor Info + Action */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center">
                            <User size={16} className="text-teal-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{p.doctor?.name || p.doctor?.email || 'Doctor'}</p>
                            <p className="text-xs text-gray-500">{p.doctor?.specialization || 'Physician'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedId(p.id)}
                          className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-semibold"
                        >
                          View Details <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Refill Reminders Card */}
                <div className="bg-teal-600 rounded-xl p-6 text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                    <RefreshCw size={20} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Refill Reminders</h3>
                  <p className="text-sm text-teal-100 mb-6 leading-relaxed">
                    You have 2 prescriptions eligible for refill this week. Connect with your pharmacy in one tap to avoid gaps in your treatment.
                  </p>
                  <button className="w-full px-4 py-2.5 bg-white text-teal-600 rounded-lg font-semibold hover:bg-teal-50 transition-colors">
                    Configure Auto-Refill
                  </button>
                </div>
              </div>
            )}

            {/* Pagination */}
            {prescriptions.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">Page <span className="font-semibold">{page}</span></span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={prescriptions.length < 10}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
