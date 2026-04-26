'use client';

import React, { useState, useEffect } from 'react';
import { useInventory, useInventoryAlerts } from '@/hooks/usePharmacyQueries';
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  Pill,
  Clock,
  User,
  TrendingUp,
  Calendar
} from 'lucide-react';

export default function PharmacyDashboardPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: inventoryData } = useInventory({ page: 1, limit: 100 });
  const inventory = Array.isArray(inventoryData) ? inventoryData : (inventoryData as any)?.data ?? [];

  const { data: alertsData } = useInventoryAlerts();
  const alerts = alertsData as any;
  const lowStockAlerts = Array.isArray(alerts?.lowStock) ? alerts.lowStock : [];
  const nearExpiryAlerts = Array.isArray(alerts?.nearExpiry) ? alerts.nearExpiry : [];

  // Calculate stats
  const totalMedicines = inventory.length;
  const lowStockCount = lowStockAlerts.length;
  const expiringCount = nearExpiryAlerts.length;
  const pendingPrescriptions = 12; // Mock data

  // Mock recent prescriptions data
  const recentPrescriptions = [
    { id: 'RX001', patient: 'John Doe', doctor: 'Dr. Smith', date: new Date(), items: 3, status: 'PENDING' },
    { id: 'RX002', patient: 'Jane Smith', doctor: 'Dr. Johnson', date: new Date(), items: 2, status: 'PROCESSING' },
    { id: 'RX003', patient: 'Bob Wilson', doctor: 'Dr. Brown', date: new Date(), items: 4, status: 'COMPLETED' },
    { id: 'RX004', patient: 'Alice Davis', doctor: 'Dr. Lee', date: new Date(), items: 1, status: 'PENDING' },
  ];

  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    PROCESSING: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    COMPLETED: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Pharmacy Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">Overview of pharmacy operations and inventory</p>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Pending Prescriptions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock size={24} className="text-amber-600" />
              </div>
              <span className="text-xs text-gray-500 font-medium">TODAY</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{pendingPrescriptions}</h3>
            <p className="text-sm text-gray-600">Pending Prescriptions</p>
          </div>

          {/* Today's Sales */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign size={24} className="text-green-600" />
              </div>
              <span className="text-xs text-gray-500 font-medium">TODAY</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">$2,450</h3>
            <p className="text-sm text-gray-600">Today's Sales</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp size={14} className="text-green-600" />
              <span className="text-xs text-green-600 font-medium">+12% from yesterday</span>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <span className="text-xs text-red-500 font-medium">URGENT</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{lowStockCount}</h3>
            <p className="text-sm text-gray-600">Low Stock Alerts</p>
          </div>

          {/* Total Medicines */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Pill size={24} className="text-teal-600" />
              </div>
              <span className="text-xs text-gray-500 font-medium">TOTAL</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalMedicines}</h3>
            <p className="text-sm text-gray-600">Total Medicines</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Prescriptions Queue */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Recent Prescriptions Queue</h2>
              <p className="text-sm text-gray-600 mt-1">Latest prescription orders requiring attention</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rx ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Doctor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentPrescriptions.map((rx) => {
                    const config = statusConfig[rx.status];
                    return (
                      <tr key={rx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">{rx.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                              <User size={14} className="text-teal-600" />
                            </div>
                            <span className="text-sm text-gray-900">{rx.patient}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{rx.doctor}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {isClient ? rx.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Loading...'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{rx.items} items</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
                            <span className={`text-xs font-medium ${config.text}`}>{rx.status}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inventory Alerts */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Inventory Alerts</h2>
              <p className="text-sm text-gray-600 mt-1">Critical stock notifications</p>
            </div>
            <div className="p-6 space-y-4">
              {/* Low Stock Section */}
              {lowStockAlerts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} className="text-red-600" />
                    <h3 className="text-sm font-semibold text-red-800">Low Stock ({lowStockAlerts.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {lowStockAlerts.slice(0, 3).map((alert: any, i: number) => (
                      <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-900">
                          {alert.name || alert.medicine?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          Only {alert.quantity ?? alert.stock ?? '?'} units remaining
                        </p>
                      </div>
                    ))}
                    {lowStockAlerts.length > 3 && (
                      <p className="text-xs text-red-600 text-center py-2">
                        +{lowStockAlerts.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Expiring Soon Section */}
              {nearExpiryAlerts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={16} className="text-amber-600" />
                    <h3 className="text-sm font-semibold text-amber-800">Expiring Soon ({expiringCount})</h3>
                  </div>
                  <div className="space-y-2">
                    {nearExpiryAlerts.slice(0, 3).map((alert: any, i: number) => (
                      <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-amber-900">
                          {alert.name || alert.medicine?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Expires: {alert.expiryDate ? new Date(alert.expiryDate).toLocaleDateString() : '?'}
                        </p>
                      </div>
                    ))}
                    {nearExpiryAlerts.length > 3 && (
                      <p className="text-xs text-amber-600 text-center py-2">
                        +{nearExpiryAlerts.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>
              )}

              {lowStockAlerts.length === 0 && nearExpiryAlerts.length === 0 && (
                <div className="text-center py-8">
                  <Package size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No alerts at this time</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sales Overview Section */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Sales Overview</h2>
              <p className="text-sm text-gray-600 mt-1">Revenue trends and performance metrics</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Last 7 days</span>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <TrendingUp size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Sales Chart</p>
              <p className="text-sm text-gray-400 mt-1">Chart visualization coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
