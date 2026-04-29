'use client';

import React, { useState } from 'react';
import {
  useDoctorConnections,
  useAcceptConnection,
  useRejectConnection,
} from '@/hooks/usePharmacyQueries';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
};

export default function PharmacyDoctorConnectionsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  const { data: pendingConnections, isLoading: loadingPending, error: errorPending } = 
    useDoctorConnections('PENDING');
  const { data: allConnections, isLoading: loadingAll, error: errorAll } = 
    useDoctorConnections();

  const acceptMutation = useAcceptConnection();
  const rejectMutation = useRejectConnection();

  const handleAccept = (id: string) => {
    if (!confirm('Accept this connection request?')) return;
    acceptMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    if (!confirm('Reject this connection request?')) return;
    rejectMutation.mutate(id);
  };

  const connections = activeTab === 'pending' ? pendingConnections : allConnections;
  const isLoading = activeTab === 'pending' ? loadingPending : loadingAll;
  const error = activeTab === 'pending' ? errorPending : errorAll;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Doctor Connections</h1>

      <div className="bg-white rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'pending'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending Requests
              {pendingConnections && pendingConnections.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  {pendingConnections.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              All Connections
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading && <p className="p-6 text-gray-500">Loading connections...</p>}
        {error && <p className="p-6 text-red-600">Error: {(error as Error).message}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Doctor Name</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Date</th>
                  {activeTab === 'pending' && (
                    <th className="px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {!connections || connections.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'pending' ? 5 : 4} className="px-4 py-6 text-center text-gray-500">
                      {activeTab === 'pending' 
                        ? 'No pending connection requests' 
                        : 'No connections found'}
                    </td>
                  </tr>
                ) : (
                  connections.map((connection) => (
                    <tr key={connection.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {connection.doctor?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {connection.doctor?.email || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[connection.status] || 'bg-gray-100'}`}>
                          {connection.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(connection.createdAt).toLocaleDateString()}
                      </td>
                      {activeTab === 'pending' && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(connection.id)}
                              disabled={acceptMutation.isPending}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition"
                            >
                              {acceptMutation.isPending ? 'Accepting...' : 'Accept'}
                            </button>
                            <button
                              onClick={() => handleReject(connection.id)}
                              disabled={rejectMutation.isPending}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition"
                            >
                              {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {(acceptMutation.isError || rejectMutation.isError) && (
          <p className="px-4 pb-4 text-red-600 text-sm">
            {acceptMutation.isError && `Accept failed: ${(acceptMutation.error as Error).message}`}
            {rejectMutation.isError && `Reject failed: ${(rejectMutation.error as Error).message}`}
          </p>
        )}
      </div>
    </div>
  );
}
