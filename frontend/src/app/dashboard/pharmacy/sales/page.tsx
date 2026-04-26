'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSales } from '@/hooks/usePharmacyQueries';
import { InvoicePDFViewer } from '@/components/InvoicePDF';
import {
  ArrowLeft,
  Printer,
  Send,
  CreditCard,
  User,
  Calendar,
  FileText,
  CheckCircle
} from 'lucide-react';

export default function PharmacySalesPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data, isLoading, error } = useSales({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 10,
  });
  const sales = Array.isArray(data) ? data : (data as any)?.data ?? [];

  // Get expanded sale details
  const expandedSale = expandedSaleId ? sales.find((s: any) => s.id === expandedSaleId) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
              <p className="text-gray-600 text-sm mt-1">View and manage sales transactions and invoices</p>
            </div>
            <Link
              href="/dashboard/pharmacy/sales/new"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              + New Bill
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Invoice Detail View */}
        {expandedSale ? (
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Invoice Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setExpandedSaleId(null)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft size={20} />
                  <span className="font-medium">Invoice Details</span>
                </button>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 text-teal-700 bg-white border border-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-medium">
                    <Send size={18} />
                    Send to Patient
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">
                    <Printer size={18} />
                    Print Invoice
                  </button>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"></div>
            </div>

            {/* Invoice Content */}
            <div className="p-8">
              {/* Pharmacy Info and Invoice Number */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
                      <FileText size={24} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-teal-600">MediFlow Central Pharmacy</h2>
                  </div>
                  <p className="text-sm text-gray-600">742 Medical District Dr.</p>
                  <p className="text-sm text-gray-600">Health City, ST 54021</p>
                  <p className="text-sm text-gray-600">Phone: (555) 124-8900</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full mb-2">
                    + PAID
                  </span>
                  <p className="text-sm text-gray-500 mb-1">SALE ID</p>
                  <p className="text-2xl font-bold text-gray-900">INV-{expandedSale.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-gray-500 mt-2">DATE</p>
                  <p className="text-sm font-medium text-gray-900">
                    {isClient ? new Date(expandedSale.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Loading...'}
                  </p>
                </div>
              </div>

              {/* Patient and Payment Info */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3">PATIENT INFORMATION</p>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <User size={20} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{expandedSale.patient?.name || 'Walk-in Customer'}</p>
                      <p className="text-sm text-gray-600">{expandedSale.patient?.email || 'customer@example.com'}</p>
                      <p className="text-sm text-gray-600">{expandedSale.patient?.phone || '(555) 890-2341'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3">PAYMENT METHOD</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{expandedSale.paymentMethod || 'Cash'}</p>
                      <p className="text-sm text-gray-600">
                        {expandedSale.paymentMethod === 'CARD' ? 'Ending in •••• 4747' : 'Payment received'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <table className="w-full">
                  <thead className="border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">MEDICINE</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">BATCH NO.</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">QTY</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">UNIT PRICE</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(expandedSale.items || []).map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-900">{item.medicine?.name || item.medicineName || 'Medicine'}</p>
                          <p className="text-xs text-gray-500">Capsules • Generic</p>
                        </td>
                        <td className="px-4 py-4 text-gray-600">{item.batchNumber || 'B-99812'}</td>
                        <td className="px-4 py-4 text-center text-gray-900 font-medium">{item.quantity}</td>
                        <td className="px-4 py-4 text-right text-gray-900">${Number(item.pricePerUnit || 0).toFixed(2)}</td>
                        <td className="px-4 py-4 text-right text-gray-900 font-semibold">
                          ${(Number(item.pricePerUnit || 0) * Number(item.quantity || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pharmacist Notes */}
              <div className="mb-8 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-teal-900 mb-1">Pharmacist's Notes</p>
                    <p className="text-sm text-teal-800">
                      Complete the full course of medication even if symptoms improve. Take with food once daily at the same time every morning.
                    </p>
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-80 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">${Number(expandedSale.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-red-600">-${Number(expandedSale.discount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (8%)</span>
                    <span className="font-medium text-gray-900">${(Number(expandedSale.totalAmount || 0) * 0.08).toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t-2 border-gray-200 flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Grand Total</span>
                    <span className="text-2xl font-bold text-teal-600">${Number(expandedSale.finalAmount || expandedSale.totalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
                <p>MediFlow Pharmacy Portal • Secure Clinical Document • Digital Signature ID: API-987-221</p>
                <p className="mt-2">
                  Prices include all applicable medical service taxes. Please retain this receipt for insurance reimbursement and tax deduction purposes. For questions, contact our billing department.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Sales List View */
          <>
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              <div className="p-4 border-b flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="p-12">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading sales...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <p className="text-red-700 font-medium">Error loading sales</p>
                    <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invoice ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sales.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                            No sales found
                          </td>
                        </tr>
                      ) : (
                        sales.map((s: any) => (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {isClient ? new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Loading...'}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              INV-{s.id.slice(0, 8).toUpperCase()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {s.patient?.name || 'Walk-in'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {s.items?.length ?? 0} items
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              ${Number(s.finalAmount ?? s.totalAmount ?? 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                                {s.paymentMethod || 'Cash'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setExpandedSaleId(s.id)}
                                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                              >
                                View Invoice
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {!isLoading && !error && sales.length > 0 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-200">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page <span className="font-semibold">{page}</span>
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={sales.length < 10}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
