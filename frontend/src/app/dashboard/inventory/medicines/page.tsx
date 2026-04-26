'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import InventoryTable from '../../../../../components/inventory/InventoryTable';
import InventoryFilters from '../../../../../components/inventory/InventoryFilters';
import MedicineForm from '../../../../../components/inventory/MedicineForm';
import { GetInventoryQuery, MedicineResponse } from '../../../../../lib/api';

export default function MedicinesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<GetInventoryQuery>({});
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<MedicineResponse | null>(null);

  const handleBackToDashboard = () => {
    router.push('/dashboard/inventory');
  };

  const handleAddMedicine = () => {
    router.push('/dashboard/inventory/medicines/new');
  };

  const handleEditMedicine = (medicine: MedicineResponse) => {
    setEditingMedicine(medicine);
    setShowMedicineForm(true);
  };

  const handleCloseMedicineForm = () => {
    setShowMedicineForm(false);
    setEditingMedicine(null);
  };

  const handleFiltersChange = (newFilters: GetInventoryQuery) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToDashboard}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Back to dashboard"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medicine Inventory</h1>
            <p className="text-sm text-gray-500">Manage your medicine inventory</p>
          </div>
        </div>
        
        <InventoryFilters 
          onFiltersChange={handleFiltersChange}
          initialFilters={filters}
        />
        
        <InventoryTable
          filters={filters}
          onEdit={handleEditMedicine}
          onAdd={handleAddMedicine}
        />

        {showMedicineForm && (
          <MedicineForm
            medicine={editingMedicine}
            onClose={handleCloseMedicineForm}
          />
        )}
      </div>
    </div>
  );
}
