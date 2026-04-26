'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getOrder, updateOrderStatus, OrderResponse } from '../../lib/api';

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white/80 rounded-2xl shadow-lg border border-white/50 p-6 space-y-4">
        <div className="h-5 bg-gray-200 rounded w-40" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-gray-100 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    SHIPPED: 'bg-blue-100 text-blue-800 border-blue-200',
    DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  };
  return (
    <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${map[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  );
}

export default function OrderDetail({ id }: { id: string }) {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrder(id);
        setOrder(data);
        setTrackingInfo(data.trackingInfo ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleStatusUpdate = async (status: 'SHIPPED' | 'DELIVERED') => {
    try {
      setUpdating(true);
      setError(null);
      const updated = await updateOrderStatus(id, { status, trackingInfo: trackingInfo || undefined });
      setOrder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <SkeletonDetail />;

  if (error && !order) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div>
          <h3 className="text-sm font-semibold text-red-800">Error</h3>
          <p className="mt-0.5 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard/orders" className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Orders
            </Link>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Order Details
          </h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Error inline */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Order Info */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Order Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order ID</p>
            <p className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg">{order.id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Prescription ID</p>
            <p className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg">{order.prescriptionId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pharmacy</p>
            <p className="text-sm text-gray-900">{order.pharmacy?.name ?? order.pharmacyId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Created</p>
            <p className="text-sm text-gray-900">{formatDate(order.createdAt)}</p>
          </div>
          {order.trackingInfo && (
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tracking Info</p>
              <p className="text-sm text-gray-900 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">{order.trackingInfo}</p>
            </div>
          )}
        </div>
      </div>

      {/* Prescription Summary */}
      {order.prescription && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Linked Prescription</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Patient ID</p>
              <p className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg">{order.prescription.patientId.slice(0, 12)}…</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Doctor ID</p>
              <p className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg">{order.prescription.doctorId.slice(0, 12)}…</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Prescription Status</p>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {order.prescription.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Status Update */}
      {(order.status === 'PENDING' || order.status === 'SHIPPED') && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Update Status</h2>
          <div className="space-y-4">
            {(order.status === 'PENDING' || order.status === 'SHIPPED') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Information <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={trackingInfo}
                  onChange={(e) => setTrackingInfo(e.target.value)}
                  placeholder="e.g. TRK-123456789"
                  maxLength={500}
                  className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50"
                />
              </div>
            )}
            <div className="flex gap-3">
              {order.status === 'PENDING' && (
                <button
                  onClick={() => handleStatusUpdate('SHIPPED')}
                  disabled={updating}
                  className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none gap-2"
                >
                  {updating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Mark as Shipped
                </button>
              )}
              {order.status === 'SHIPPED' && (
                <button
                  onClick={() => handleStatusUpdate('DELIVERED')}
                  disabled={updating}
                  className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none gap-2"
                >
                  {updating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Mark as Delivered
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
