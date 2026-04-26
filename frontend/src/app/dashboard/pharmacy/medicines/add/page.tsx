'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAddMedicine, type AddMedicineInput } from '@/hooks/usePharmacyQueries';
import { 
  ArrowLeft,
  Package,
  AlertCircle,
  CheckCircle,
  Pill
} from 'lucide-react';
import Link from 'next/link';

export default function AddMedicinePage() {
  const router = useRouter();
  const addMedicine = useAddMedicine();

  const [form, setForm] = useState<AddMedicineInput>({
    name: '',
    category: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 0,
    supplier: '',
    unitPrice: 0,
  });

  const [reorderLevel, setReorderLevel] = useState(10);
  const [unitCost, setUnitCost] = useState(0);
  const [storageInstructions, setStorageInstructions] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.batchNumber || !form.expiryDate || !form.quantity) {
      return;
    }

    addMedicine.mutate(form, {
      onSuccess: () => {
        router.push('/dashboard/pharmacy/medicines');
      },
    });
  };

  const handleReset = () => {
    setForm({
      name: '',
      category: '',
      batchNumber: '',
      expiryDate: '',
      quantity: 0,
      supplier: '',
      unitPrice: 0,
    });
    setReorderLevel(10);
    setUnitCost(0);
    setStorageInstructions('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/pharmacy/medicines"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span>Inventory</span>
                <span>/</span>
                <span className="text-teal-600 font-medium">Add New Medicine</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Medicine</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Main Form Card */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add New Medicine</h2>
                  <p className="text-sm text-gray-600 mt-1">Fill in the details to register a new pharmaceutical item in the inventory.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/pharmacy/medicines')}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={addMedicine.isPending}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {addMedicine.isPending ? 'Saving...' : 'Save Medicine'}
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Basic Information Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Pill size={16} className="text-teal-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
                  <span className="ml-auto text-xs text-red-600 font-medium">* Required Fields</span>
                </div>

                <div className="space-y-6">
                  {/* Medicine Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Medicine Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g., Amoxicillin 500mg Capsules"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Batch Number and Expiry Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Batch Number <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.batchNumber}
                        onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                        placeholder="BAT-2024-001"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Expiry Date <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="date"
                        value={form.expiryDate}
                        onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Current Quantity and Reorder Level */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Current Quantity <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={form.quantity}
                          onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          min={0}
                          required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">units</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Reorder Level
                      </label>
                      <input
                        type="number"
                        value={reorderLevel}
                        onChange={(e) => setReorderLevel(parseInt(e.target.value) || 0)}
                        placeholder="Min. stock threshold"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        min={0}
                      />
                    </div>
                  </div>

                  {/* Supplier and Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Supplier
                      </label>
                      <select
                        value={form.supplier}
                        onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Select Supplier</option>
                        <option value="PharmaCorp Ltd.">PharmaCorp Ltd.</option>
                        <option value="Global Meds">Global Meds</option>
                        <option value="Nexus Pharma">Nexus Pharma</option>
                        <option value="PharmaLink">PharmaLink</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Category
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        <option value="">Select Category</option>
                        <option value="Antibiotics">Antibiotics</option>
                        <option value="Pain Relief">Pain Relief</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Diabetology">Diabetology</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                  </div>

                  {/* Unit Price and Unit Cost */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Unit Price (Selling)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
                        <input
                          type="number"
                          value={form.unitPrice}
                          onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          step="0.01"
                          min={0}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Unit Cost (Buying)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
                        <input
                          type="number"
                          value={unitCost}
                          onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          step="0.01"
                          min={0}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Storage Instructions */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Storage Instructions
                    </label>
                    <textarea
                      value={storageInstructions}
                      onChange={(e) => setStorageInstructions(e.target.value)}
                      placeholder="e.g., Store in a cool, dry place below 25°C. Keep away from direct sunlight."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
              {addMedicine.isError && (
                <div className="mb-6 flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Error adding medicine</p>
                    <p className="text-sm text-red-700 mt-1">{(addMedicine.error as Error).message}</p>
                  </div>
                </div>
              )}

              {addMedicine.isSuccess && (
                <div className="mb-6 flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Success!</p>
                    <p className="text-sm text-green-700 mt-1">Medicine added successfully to inventory</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={addMedicine.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Package size={18} />
                  {addMedicine.isPending ? 'Saving...' : 'Confirm & Save Medicine'}
                </button>
              </div>
            </form>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Inventory Sync */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-teal-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Inventory Sync</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Once saved, this medicine will be immediately available for prescription and sales tracking.
              </p>
            </div>

            {/* Barcode Auto-Gen */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-blue-900">Barcode Auto-Gen</h3>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                System will automatically generate a unique internal QR code for seamless inventory tracking.
              </p>
            </div>

            {/* FDA Compliance */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-900">FDA Compliance</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Validation checks are performed against local health authority inventory requirements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
