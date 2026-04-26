'use client';

import React, { useState, useEffect } from 'react';
import { createMedicine, updateMedicine, getMedicines, CreateMedicinePayload, UpdateMedicinePayload, MedicineResponse } from '../../lib/api';

interface MedicineFormProps {
  medicine?: MedicineResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (medicine: MedicineResponse) => void;
  onError: (error: string) => void;
}

export default function MedicineForm({
  medicine,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: MedicineFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    supplier: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingBatchNumber, setCheckingBatchNumber] = useState(false);

  const isEditMode = !!medicine;

  useEffect(() => {
    if (isOpen) {
      if (medicine) {
        // Edit mode - populate form with medicine data
        // Convert ISO date to YYYY-MM-DD format for date input
        const expiryDate = medicine.expiryDate.split('T')[0];
        setFormData({
          name: medicine.name,
          batchNumber: medicine.batchNumber,
          expiryDate: expiryDate,
          quantity: medicine.quantity.toString(),
          supplier: medicine.supplier,
        });
      } else {
        // Create mode - reset form
        setFormData({
          name: '',
          batchNumber: '',
          expiryDate: '',
          quantity: '',
          supplier: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, medicine]);

  const validateBatchNumber = (batchNumber: string): string | null => {
    if (!batchNumber.trim()) {
      return 'Batch number is required';
    }
    if (batchNumber.length > 50) {
      return 'Batch number must be less than 50 characters';
    }
    // Alphanumeric with hyphens and underscores only
    if (!/^[A-Za-z0-9-_]+$/.test(batchNumber)) {
      return 'Batch number must be alphanumeric with hyphens and underscores only';
    }
    return null;
  };

  const checkBatchNumberUniqueness = async (batchNumber: string): Promise<boolean> => {
    // Skip uniqueness check in edit mode if batch number hasn't changed
    if (isEditMode && medicine && batchNumber === medicine.batchNumber) {
      return true;
    }

    try {
      setCheckingBatchNumber(true);
      // Search for medicines with this batch number
      const response = await getMedicines({ search: batchNumber, limit: 100 });
      
      // Check if any medicine has this exact batch number
      const exists = response.data.some(med => med.batchNumber === batchNumber);
      
      return !exists;
    } catch (error) {
      console.error('Error checking batch number uniqueness:', error);
      // If check fails, allow submission (backend will validate)
      return true;
    } finally {
      setCheckingBatchNumber(false);
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length > 255) {
      newErrors.name = 'Name must be less than 255 characters';
    }

    // Batch number validation
    const batchError = validateBatchNumber(formData.batchNumber);
    if (batchError) {
      newErrors.batchNumber = batchError;
    } else {
      // Check uniqueness
      const isUnique = await checkBatchNumberUniqueness(formData.batchNumber);
      if (!isUnique) {
        newErrors.batchNumber = 'Batch number already exists';
      }
    }

    // Expiry date validation
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      // Parse the date string as local date (YYYY-MM-DD format)
      const [year, month, day] = formData.expiryDate.split('-').map(Number);
      const expiryDate = new Date(year, month - 1, day);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expiryDate <= today) {
        newErrors.expiryDate = 'Expiry date must be in the future';
      }
    }

    // Quantity validation
    const quantity = parseInt(formData.quantity);
    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(quantity) || quantity < 0) {
      newErrors.quantity = 'Quantity must be a non-negative number';
    } else if (!Number.isInteger(quantity)) {
      newErrors.quantity = 'Quantity must be a whole number';
    }

    // Supplier validation
    if (!formData.supplier.trim()) {
      newErrors.supplier = 'Supplier is required';
    } else if (formData.supplier.trim().length > 255) {
      newErrors.supplier = 'Supplier must be less than 255 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        batchNumber: formData.batchNumber.trim(),
        expiryDate: formData.expiryDate,
        quantity: parseInt(formData.quantity),
        supplier: formData.supplier.trim(),
      };

      let result: MedicineResponse;

      if (isEditMode && medicine) {
        // Update existing medicine
        const updatePayload: UpdateMedicinePayload = payload;
        result = await updateMedicine(medicine.id, updatePayload);
      } else {
        // Create new medicine
        const createPayload: CreateMedicinePayload = payload;
        result = await createMedicine(createPayload);
      }

      onSuccess(result);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {isEditMode ? '✏️ Edit Medicine' : '💊 Add New Medicine'}
              </h3>
              <p className="text-gray-600 mt-1">
                {isEditMode ? 'Update medicine information' : 'Enter medicine details to add to inventory'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Medicine Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                    placeholder="Enter medicine name"
                    disabled={loading}
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Batch Number Field */}
              <div>
                <label htmlFor="batchNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                  Batch Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="batchNumber"
                    value={formData.batchNumber}
                    onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.batchNumber ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                    placeholder="e.g., BATCH-2024-001"
                    disabled={loading || checkingBatchNumber}
                  />
                  {checkingBatchNumber && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                {errors.batchNumber && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.batchNumber}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Alphanumeric with hyphens and underscores only
                </p>
              </div>

              {/* Supplier Field */}
              <div>
                <label htmlFor="supplier" className="block text-sm font-semibold text-gray-700 mb-2">
                  Supplier *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.supplier ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                    placeholder="Enter supplier name"
                    disabled={loading}
                  />
                </div>
                {errors.supplier && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.supplier}
                  </p>
                )}
              </div>

              {/* Quantity Field */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <input
                    type="number"
                    id="quantity"
                    step="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.quantity ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                    placeholder="0"
                    disabled={loading}
                  />
                </div>
                {errors.quantity && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.quantity}
                  </p>
                )}
                {formData.quantity && parseInt(formData.quantity) >= 0 && parseInt(formData.quantity) < 10 && !errors.quantity && (
                  <p className="mt-1 text-xs text-yellow-600 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Low stock warning (below 10 units)
                  </p>
                )}
              </div>

              {/* Expiry Date Field */}
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="date"
                    id="expiryDate"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.expiryDate ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                    disabled={loading}
                  />
                </div>
                {errors.expiryDate && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.expiryDate}
                  </p>
                )}
                {formData.expiryDate && !errors.expiryDate && (() => {
                  const expiryDate = new Date(formData.expiryDate);
                  const today = new Date();
                  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (daysUntilExpiry <= 30) {
                    return (
                      <p className="mt-1 text-xs text-yellow-600 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Expiring soon ({daysUntilExpiry} days remaining)
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || checkingBatchNumber}
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:transform-none transition-all duration-200"
              >
                {(loading || checkingBatchNumber) && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {isEditMode ? '💾 Update Medicine' : '✨ Add Medicine'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
