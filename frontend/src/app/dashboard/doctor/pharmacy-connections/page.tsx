'use client';

import React from 'react';
import {
  usePharmacyConnections,
  useAvailablePharmacies,
  useRequestConnection,
  useTerminateConnection,
} from '@/hooks/useDoctorQueries';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
};

export default function PharmacyConnectionsPage() {
  const { data: connectionsData, isLoading: loadingConnections, error: connectionsError } = usePharmacyConnections();
  const { data: pharmaciesData, isLoading: loadingPharmacies } = useAvailablePharmacies();

  const connections = Array.isArray(connectionsData) ? connectionsData : [];
  const pharmacies = Array.isArray(pharmaciesData) ? pharmaciesData : [];

  const requestConnection = useRequestConnection();
  const terminateConnection = useTerminateConnection();

  const connectedPharmacyIds = new Set(connections.map((c: any) => c.pharmacyId));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pharmacy Connections</h1>

      {/* Current Connections */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-800">My Connections</h2>
        </div>
        {loadingConnections && <p className="p-6 text-gray-500">Loading connections...</p>}
        {connectionsError && <p className="p-6 text-red-600">Error: {(connectionsError as Error).message}</p>}
        {!loadingConnections && !connectionsError && (
          <div className="divide-y">
            {connections.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No connections yet</p>
            ) : (
              connections.map((c: any) => (
                <div key={c.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.pharmacy?.name || c.pharmacyId}</p>
                    {c.pharmacy?.email && <p className="text-sm text-gray-500">{c.pharmacy.email}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status] || 'bg-gray-100'}`}>
                      {c.status}
                    </span>
                    {c.status !== 'INACTIVE' && (
                      <button
                        onClick={() => terminateConnection.mutate(c.id)}
                        disabled={terminateConnection.isPending}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Terminate
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Available Pharmacies */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-800">Available Pharmacies</h2>
        </div>
        {loadingPharmacies && <p className="p-6 text-gray-500">Loading pharmacies...</p>}
        {!loadingPharmacies && (
          <div className="divide-y">
            {pharmacies.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No pharmacies available</p>
            ) : (
              pharmacies.map((p: any) => (
                <div key={p.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {p.email && <p className="text-sm text-gray-500">{p.email}</p>}
                  </div>
                  {connectedPharmacyIds.has(p.id) ? (
                    <span className="text-sm text-gray-400">Already connected</span>
                  ) : (
                    <button
                      onClick={() => requestConnection.mutate(p.id)}
                      disabled={requestConnection.isPending}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                    >
                      Connect
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        {requestConnection.isError && (
          <p className="p-4 text-red-600 text-sm">{(requestConnection.error as Error).message}</p>
        )}
      </div>
    </div>
  );
}
