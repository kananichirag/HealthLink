'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  useDailyReport,
  useTopMedicines,
  useWeeklySummary,
  usePaymentBreakdown,
  type ReportFilters,
} from '@/hooks/usePharmacyQueries';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Calendar,
  Download,
  CreditCard,
  Smartphone,
  Banknote
} from 'lucide-react';

type RangePreset = 'week' | 'month' | 'quarter' | 'custom';

function getDateRange(preset: RangePreset, customStart: string, customEnd: string) {
  const today = new Date();
  const end = today.toISOString().split('T')[0];
  let start = end;

  if (preset === 'custom') {
    return { startDate: customStart || undefined, endDate: customEnd || undefined };
  }

  const d = new Date(today);
  if (preset === 'week') d.setDate(d.getDate() - 7);
  else if (preset === 'month') d.setMonth(d.getMonth() - 1);
  else if (preset === 'quarter') d.setMonth(d.getMonth() - 3);
  start = d.toISOString().split('T')[0];

  return { startDate: start, endDate: end };
}

export default function PharmacyReportsPage() {
  const [preset, setPreset] = useState<RangePreset>('week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeTab, setActiveTab] = useState('daily');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const range = useMemo(() => getDateRange(preset, customStart, customEnd), [preset, customStart, customEnd]);
  const filters: ReportFilters = range;

  const today = new Date().toISOString().split('T')[0];
  const { data: dailyData, isLoading: dailyLoading } = useDailyReport(today);
  const { data: topData, isLoading: topLoading } = useTopMedicines(filters);
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklySummary(filters);
  const { data: paymentData, isLoading: paymentLoading } = usePaymentBreakdown(filters);

  const daily = (dailyData as any) ?? {};
  const topMedicines = Array.isArray(topData) ? topData : (topData as any)?.data ?? [];
  const weeklySummaries = Array.isArray(weeklyData) ? weeklyData : (weeklyData as any)?.data ?? [];
  const paymentBreakdown = Array.isArray(paymentData) ? paymentData : (paymentData as any)?.data ?? [];

  // Calculate payment percentages
  const totalPayments = paymentBreakdown.reduce((sum: number, p: any) => sum + Number(p.revenue || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Calendar size={16} />
                <span>{isClient ? new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Loading...'}</span>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">
              <Download size={18} />
              Export PDF
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {['Daily Report', 'Weekly Summary', 'Top Medicines', 'Payment Breakdown'].map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(['daily', 'weekly', 'top', 'payment'][i])}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === ['daily', 'weekly', 'top', 'payment'][i]
                    ? 'bg-teal-100 text-teal-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Daily Performance Summary */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Daily Performance Summary</h2>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">{isClient ? new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Loading...'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Sales */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart size={24} className="text-teal-600" />
                </div>
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <TrendingUp size={12} />
                  +2.8%
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Sales</p>
              <h3 className="text-3xl font-bold text-gray-900">{daily.totalSales ?? 148}</h3>
            </div>

            {/* Total Revenue */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign size={24} className="text-blue-600" />
                </div>
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <TrendingUp size={12} />
                  +14.4%
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold text-gray-900">${Number(daily.totalRevenue ?? 4820.50).toFixed(2)}</h3>
            </div>

            {/* Items Sold */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Package size={24} className="text-red-600" />
                </div>
                <span className="text-xs text-red-600 font-semibold flex items-center gap-1">
                  <TrendingDown size={12} />
                  -1.8%
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Items Sold</p>
              <h3 className="text-3xl font-bold text-gray-900">{daily.totalItemsSold ?? 632}</h3>
            </div>

            {/* Avg Order Value */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={24} className="text-purple-600" />
                </div>
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <TrendingUp size={12} />
                  +9.4%
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
              <h3 className="text-3xl font-bold text-gray-900">$32.57</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Revenue Trajectory */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Weekly Revenue Trajectory</h3>
                <p className="text-sm text-gray-600">Daily performance for Oct 18 - Oct 24</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-teal-600 rounded-full"></div>
                  <span className="text-gray-600">Current Week</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-gray-600">Previous Week</span>
                </div>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <TrendingUp size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Revenue Chart</p>
                <p className="text-sm text-gray-400 mt-1">Chart visualization coming soon</p>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Payment Breakdown</h3>
            <p className="text-sm text-gray-600 mb-6">Revenue split by method</p>
            
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#0d9488" strokeWidth="20" strokeDasharray="440" strokeDashoffset="88" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-gray-900">$4.8k</p>
                  <p className="text-xs text-gray-500">Total Today</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-teal-600 rounded-full"></div>
                  <CreditCard size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-900">Card Payments</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">65%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <Smartphone size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-900">Online/QR</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">20%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <Banknote size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-900">Cash</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">15%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Medications */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Top Selling Medications</h3>
              <p className="text-sm text-gray-600">Highest sales volume by category</p>
            </div>
            <button className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
              View Full Inventory →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {[
                { rank: '01', name: 'Amoxicillin 500mg', units: 248, color: 'bg-teal-600' },
                { rank: '02', name: 'Lisinopril 10mg', units: 156, color: 'bg-teal-500' },
                { rank: '03', name: 'Omeprazole 20mg', units: 128, color: 'bg-teal-400' },
              ].map((med) => (
                <div key={med.rank}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-teal-600">{med.rank}</span>
                      <span className="text-sm font-medium text-gray-900">{med.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{med.units} units</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${med.color} rounded-full`} style={{ width: `${(med.units / 248) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {[
                { rank: '04', name: 'Atorvastatin 20mg', units: 182, color: 'bg-teal-600' },
                { rank: '05', name: 'Metformin 850mg', units: 142, color: 'bg-teal-500' },
                { rank: '06', name: 'Amlodipine 5mg', units: 114, color: 'bg-teal-400' },
              ].map((med) => (
                <div key={med.rank}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-teal-600">{med.rank}</span>
                      <span className="text-sm font-medium text-gray-900">{med.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{med.units} units</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${med.color} rounded-full`} style={{ width: `${(med.units / 248) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
