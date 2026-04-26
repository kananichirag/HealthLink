'use client';

import React, { useState, useMemo } from 'react';
import {
  useDailyReport,
  useTopMedicines,
  useWeeklySummary,
  usePaymentBreakdown,
  type ReportFilters,
} from '@/hooks/usePharmacyQueries';

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* Today's Sales Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Today&apos;s Sales Summary</h2>
        {dailyLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm text-indigo-600 font-medium">Total Sales</p>
              <p className="text-2xl font-bold text-indigo-900">{daily.totalSales ?? 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Revenue</p>
              <p className="text-2xl font-bold text-green-900">₹{Number(daily.totalRevenue ?? 0).toFixed(2)}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-sm text-amber-600 font-medium">Items Sold</p>
              <p className="text-2xl font-bold text-amber-900">{daily.totalItemsSold ?? 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as RangePreset)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="quarter">Past Quarter</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        {preset === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border rounded-lg px-3 py-2"
              />
            </div>
          </>
        )}
      </div>

      {/* Top 10 Most-Sold Medicines */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Top 10 Most-Sold Medicines</h2>
        </div>
        {topLoading ? (
          <p className="p-6 text-gray-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">#</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Medicine</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Qty Sold</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No data for selected range</td>
                  </tr>
                ) : (
                  topMedicines.map((m: any, i: number) => (
                    <tr key={m.medicineId ?? i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{m.medicineName ?? m.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{m.totalQuantity ?? m.quantitySold ?? 0}</td>
                      <td className="px-4 py-3 text-gray-600">₹{Number(m.totalRevenue ?? m.revenue ?? 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Weekly Summary */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Weekly Summary</h2>
        </div>
        {weeklyLoading ? (
          <p className="p-6 text-gray-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Week</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Revenue</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Purchase Cost</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Net Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {weeklySummaries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No data for selected range</td>
                  </tr>
                ) : (
                  weeklySummaries.map((w: any, i: number) => {
                    const margin = Number(w.netMargin ?? (Number(w.totalRevenue ?? 0) - Number(w.totalPurchaseCost ?? 0)));
                    return (
                      <tr key={w.week ?? i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{w.week ?? w.weekLabel ?? `Week ${i + 1}`}</td>
                        <td className="px-4 py-3 text-gray-600">₹{Number(w.totalRevenue ?? 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-600">₹{Number(w.totalPurchaseCost ?? 0).toFixed(2)}</td>
                        <td className={`px-4 py-3 font-medium ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{margin.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Payment Method Breakdown</h2>
        </div>
        {paymentLoading ? (
          <p className="p-6 text-gray-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Method</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Count</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paymentBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500">No data for selected range</td>
                  </tr>
                ) : (
                  paymentBreakdown.map((p: any) => (
                    <tr key={p.method ?? p.paymentMethod} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{p.method ?? p.paymentMethod ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{p.count ?? 0}</td>
                      <td className="px-4 py-3 text-gray-600">₹{Number(p.revenue ?? p.totalRevenue ?? 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
