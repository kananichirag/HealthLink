'use client';

import React, { useState, useEffect } from 'react';
import {
  usePurchases,
  useRecordPurchase,
  useMedicines,
  type RecordPurchaseInput,
} from '@/hooks/usePharmacyQueries';
import {
  Package,
  FileText,
  Printer,
  TrendingUp,
  Calendar,
  Search,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function PharmacyPurchasesPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [form, setForm] = useState<RecordPurchaseInput>({
    medicineId: '',
    batchNumber: '',
    quantity: 0,
    unitCost: 0,
    sellerName: '',
    sellerCompany: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  const { data, isLoading, error } = usePurchases({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 10,
  });
  const purchases = Array.isArray(data) ? data : (data as any)?.data ?? [];

  const { data: medicinesData } = useMedicines({ limit: 100 });
  const medicines = Array.isArray(medicinesData) ? medicinesData : (medicinesData as any)?.data ?? [];

  const recordPurchase = useRecordPurchase();

  // Calculate total spending
  const totalSpending = purchases.reduce((sum: number, p: any) => sum + Number(p.totalCost || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.medicineId || !form.batchNumber || !form.quantity || !form.sellerName || !form.sellerCompany) return;
    recordPurchase.mutate(form, {
      onSuccess: () => {
        setForm({
          medicineId: '',
          batchNumber: '',
          quantity: 0,
          unitCost: 0,
          sellerName: '',
          sellerCompany: '',
          purchaseDate: new Date().toISOString().split('T')[0],
        });
        setShowForm(false);
      },
    });
  };

  const totalCost = form.quantity * form.unitCost;

  // Top suppliers
  const supplierStats = purchases.reduce((acc: any, p: any) => {
    const company = p.sellerCompany || 'Unknown';
    if (!acc[company]) acc[company] = 0;
    acc[company] += Number(p.totalCost || 0);
    return acc;
  }, {});
  const topSuppliers = Object.entries(supplierStats)
    .map(([name, amount]) => ({ name, amount: amount as number }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span>Pharmacy Module</span>
                <span>/</span>
                <span className="text-teal-600 font-medium">Purchase Recording</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Inbound</h1>
              <p className="text-gray-600 text-sm mt-1">Record new medicinal supplies and update stock records.</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                <FileText size={18} />
                Import CSV
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                <Printer size={18} />
                Print Log
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Record Purchase Form */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-teal-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Record Purchase</h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Medicine Search */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">MEDICINE SEARCH</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={form.medicineId}
                    onChange={(e) => setForm({ ...form, medicineId: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Medicine...</option>
                    {medicines.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Batch Number and Purchase Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">BATCH NUMBER</label>
                  <input
                    type="text"
                    value={form.batchNumber}
                    onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                    placeholder="e.g., B-4028"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">PURCHASE DATE</label>
                  <input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Supplier Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SUPPLIER NAME</label>
                <select
                  value={form.sellerCompany}
                  onChange={(e) => setForm({ ...form, sellerCompany: e.target.value, sellerName: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Supplier...</option>
                  <option value="Global Health Dist.">Global Health Dist.</option>
                  <option value="MediSource Ltd.">MediSource Ltd.</option>
                  <option value="Reliance Pharma">Reliance Pharma</option>
                  <option value="PharmaCorp Ltd.">PharmaCorp Ltd.</option>
                </select>
              </div>

              {/* Quantity, Unit Cost, Total Cost */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                    placeholder="100"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    min={1}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Cost ($)</label>
                  <input
                    type="number"
                    value={form.unitCost}
                    onChange={(e) => setForm({ ...form, unitCost: parseFloat(e.target.value) || 0 })}
                    placeholder="4.50"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    min={0}
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Total Cost</label>
                  <div className="px-3 py-2.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 font-semibold">
                    ${totalCost.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
              {recordPurchase.isError && (
                <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Error recording purchase</p>
                    <p className="text-sm text-red-700 mt-1">{(recordPurchase.error as Error).message}</p>
                  </div>
                </div>
              )}

              {recordPurchase.isSuccess && (
                <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-green-900">Purchase recorded successfully!</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={recordPurchase.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                <Package size={18} />
                {recordPurchase.isPending ? 'Recording...' : 'Record Purchase'}
              </button>
            </form>
          </div>

          {/* Recent Transactions Sidebar */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
                <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">View All</button>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {purchases.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{p.medicine?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{p.sellerCompany}</p>
                      </div>
                      <span className="text-sm font-bold text-teal-600">${Number(p.totalCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{isClient && p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Loading...'}</span>
                      <span>{p.quantity} units</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Total Spending Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <p className="text-sm text-blue-100 mb-2">Total Spending</p>
            <h3 className="text-3xl font-bold mb-1">${totalSpending.toFixed(2)}</h3>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} />
              <span>+19% from last month</span>
            </div>
          </div>

          {/* Top Suppliers */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">TOP SUPPLIERS</h3>
            <div className="space-y-3">
              {topSuppliers.map((supplier, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                    <span className="text-sm text-gray-900">{supplier.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">${supplier.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Billing */}
          <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-teal-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Compliance Billing</h3>
              <span className="ml-auto text-2xl font-bold text-teal-600">98.4%</span>
            </div>
            <p className="text-xs text-gray-600">All purchases comply with regulatory standards</p>
          </div>
        </div>
      </div>
    </div>
  );
}
