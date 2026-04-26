'use client';

import React, { useState, useCallback } from 'react';
import InventoryDashboard from '../../../../components/inventory/InventoryDashboard';
import InventoryTable from '../../../../components/inventory/InventoryTable';
import InventoryFilters from '../../../../components/inventory/InventoryFilters';
import MedicineForm from '../../../../components/inventory/MedicineForm';
import { GetInventoryQuery, MedicineResponse } from '../../../../lib/api';

type Toast = { id: number; type: 'success' | 'error'; message: string };

export default function InventoryPage() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'list'>('dashboard');
  const [filters, setFilters] = useState<GetInventoryQuery>({});
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<MedicineResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const handleViewInventory = () => {
    setCurrentView('list');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setFilters({});
  };

  const handleAddMedicine = () => {
    setEditingMedicine(null);
    setShowMedicineForm(true);
  };

  const handleEditMedicine = (medicine: MedicineResponse) => {
    setEditingMedicine(medicine);
    setShowMedicineForm(true);
  };

  const handleCloseMedicineForm = () => {
    setShowMedicineForm(false);
    setEditingMedicine(null);
  };

  const handleFormSuccess = useCallback((medicine: MedicineResponse) => {
    setShowMedicineForm(false);
    setEditingMedicine(null);
    setRefreshKey((k) => k + 1);
    addToast('success', editingMedicine ? `"${medicine.name}" updated successfully.` : `"${medicine.name}" added to inventory.`);
  }, [editingMedicine]);

  const handleFormError = useCallback((error: string) => {
    addToast('error', error);
  }, []);

  const handleViewLowStock = () => {
    setFilters({ stockStatus: 'LOW' });
    setCurrentView('list');
  };

  const handleViewExpiring = () => {
    setFilters({ expiryStatus: 'EXPIRING' });
    setCurrentView('list');
  };

  const handleFiltersChange = useCallback((newFilters: GetInventoryQuery) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium pointer-events-auto transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.message}
          </div>
        ))}
      </div>

      {currentView === 'list' ? (
        <>
          {/* List view header */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDashboard}
              className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
              title="Back to dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Inventory List
              </h1>
              <p className="text-sm text-gray-500">Manage your medicine inventory</p>
            </div>
          </div>

          <InventoryFilters onFiltersChange={handleFiltersChange} initialFilters={filters} />

          <InventoryTable
            key={refreshKey}
            filters={filters}
            onEdit={handleEditMedicine}
            onAdd={handleAddMedicine}
          />
        </>
      ) : (
        <InventoryDashboard
          onViewInventory={handleViewInventory}
          onAddMedicine={handleAddMedicine}
          onViewLowStock={handleViewLowStock}
          onViewExpiring={handleViewExpiring}
          refreshKey={refreshKey}
        />
      )}

      {/* Medicine Form Modal */}
      <MedicineForm
        medicine={editingMedicine}
        isOpen={showMedicineForm}
        onClose={handleCloseMedicineForm}
        onSuccess={handleFormSuccess}
        onError={handleFormError}
      />
    </div>
  );
}
