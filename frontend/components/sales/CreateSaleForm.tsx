'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createSale,
  getMedicines,
  type CreateSalePayload,
  type SaleItemPayload,
  type MedicineResponse,
  type SalePaymentMethod,
  type DiscountType,
} from '../../lib/api';

interface SaleItem extends SaleItemPayload {
  id: string;
  medicineName: string;
  availableStock: number;
  batchNumber: string;
  expiryDate: string;
}

export default function CreateSaleForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<MedicineResponse[]>([]);
  const [loadingMedicines, setLoadingMedicines] = useState(true);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [prescriptionId, setPrescriptionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>('CASH');
  const [discountType, setDiscountType] = useState<DiscountType>('FLAT');
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);

  // Load available medicines
  useEffect(() => {
    const loadMedicines = async () => {
      try {
        setLoadingMedicines(true);
        const response = await getMedicines({ limit: 1000 }); // Get all medicines
        // Filter to only non-expired, in-stock medicines
        const availableMedicines = response.data.filter(
          (medicine) => medicine.expiryStatus !== 'EXPIRED' && medicine.quantity > 0
        );
        setMedicines(availableMedicines);
      } catch (err) {
        setError('Failed to load medicines');
      } finally {
        setLoadingMedicines(false);
      }
    };

    loadMedicines();
  }, []);

  // Calculate financial totals
  const calculateTotals = () => {
    const subtotal = saleItems.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0);
    
    const discountAmount = discountType === 'PERCENTAGE' 
      ? subtotal * (discount / 100)
      : discount;
    
    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount = discountedSubtotal * (taxRate / 100);
    const finalAmount = discountedSubtotal + taxAmount;

    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
    };
  };

  const addSaleItem = () => {
    const newItem: SaleItem = {
      id: Date.now().toString(),
      medicineId: '',
      medicineName: '',
      quantity: 1,
      pricePerUnit: 0,
      availableStock: 0,
      batchNumber: '',
      expiryDate: '',
    };
    setSaleItems([...saleItems, newItem]);
  };

  const removeSaleItem = (id: string) => {
    setSaleItems(saleItems.filter(item => item.id !== id));
  };

  const updateSaleItem = (id: string, field: keyof SaleItem, value: any) => {
    setSaleItems(saleItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // If medicine is selected, auto-populate fields
        if (field === 'medicineId' && value) {
          const selectedMedicine = medicines.find(m => m.id === value);
          if (selectedMedicine) {
            updatedItem.medicineName = selectedMedicine.name;
            updatedItem.availableStock = selectedMedicine.quantity;
            updatedItem.batchNumber = selectedMedicine.batchNumber;
            updatedItem.expiryDate = selectedMedicine.expiryDate;
            updatedItem.pricePerUnit = 10; // Default price - user can modify
          }
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const validateForm = (): string | null => {
    if (!customerName.trim()) {
      return 'Customer name is required';
    }

    if (saleItems.length === 0) {
      return 'At least one item is required';
    }

    for (const item of saleItems) {
      if (!item.medicineId) {
        return 'Please select a medicine for all items';
      }
      if (item.quantity <= 0) {
        return 'Quantity must be greater than 0';
      }
      if (item.quantity > item.availableStock) {
        return `Insufficient stock for ${item.medicineName}. Available: ${item.availableStock}`;
      }
      if (item.pricePerUnit <= 0) {
        return 'Price per unit must be greater than 0';
      }
    }

    const totals = calculateTotals();
    if (parseFloat(totals.discountAmount) > parseFloat(totals.subtotal)) {
      return 'Discount cannot exceed subtotal';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: CreateSalePayload = {
        customerName: customerName.trim(),
        prescriptionId: prescriptionId.trim() || undefined,
        paymentMethod,
        discountType,
        discount,
        taxRate,
        items: saleItems.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
        })),
      };

      const sale = await createSale(payload);
      
      // Success - redirect to sale detail page
      router.push(`/dashboard/sales/${sale.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (loadingMedicines) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Sale</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <label htmlFor="prescriptionId" className="block text-sm font-medium text-gray-700 mb-2">
                  Prescription ID (Optional)
                </label>
                <input
                  type="text"
                  id="prescriptionId"
                  value={prescriptionId}
                  onChange={(e) => setPrescriptionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                  placeholder="Enter prescription ID"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <div className="flex space-x-4">
                {(['CASH', 'CARD', 'ONLINE'] as SalePaymentMethod[]).map((method) => (
                  <label key={method} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) => setPaymentMethod(e.target.value as SalePaymentMethod)}
                      className="mr-2"
                    />
                    <span className="text-gray-900 font-medium">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sale Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Sale Items</h3>
                <button
                  type="button"
                  onClick={addSaleItem}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
                >
                  Add Item
                </button>
              </div>

              {saleItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No items added. Click "Add Item" to start.
                </div>
              ) : (
                <div className="space-y-4">
                  {saleItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Medicine *
                          </label>
                          <select
                            value={item.medicineId}
                            onChange={(e) => updateSaleItem(item.id, 'medicineId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                            required
                          >
                            <option value="">Select medicine</option>
                            {medicines.map((medicine) => (
                              <option key={medicine.id} value={medicine.id}>
                                {medicine.name} (Stock: {medicine.quantity})
                              </option>
                            ))}
                          </select>
                          {item.medicineId && (
                            <div className="mt-1 text-xs text-gray-500">
                              Batch: {item.batchNumber} | Expires: {new Date(item.expiryDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={item.availableStock}
                            value={item.quantity}
                            onChange={(e) => updateSaleItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                            required
                          />
                          {item.availableStock > 0 && (
                            <div className="mt-1 text-xs text-gray-500">
                              Available: {item.availableStock}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price per Unit *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.pricePerUnit}
                            onChange={(e) => updateSaleItem(item.id, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total
                          </label>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-semibold">
                            ${(item.pricePerUnit * item.quantity).toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeSaleItem(item.id)}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors group relative"
                            title="Remove item"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              Remove item
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Billing Summary */}
            {saleItems.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Summary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Type
                    </label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                    >
                      <option value="FLAT">Flat Amount</option>
                      <option value="PERCENTAGE">Percentage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount {discountType === 'PERCENTAGE' ? '(%)' : '($)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={discountType === 'PERCENTAGE' ? 100 : undefined}
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-gray-900">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-semibold">${totals.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-900">
                    <span className="font-medium">Discount:</span>
                    <span className="font-semibold">-${totals.discountAmount}</span>
                  </div>
                  <div className="flex justify-between text-gray-900">
                    <span className="font-medium">Tax:</span>
                    <span className="font-semibold">${totals.taxAmount}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 text-gray-900">
                    <span>Final Amount:</span>
                    <span>${totals.finalAmount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || saleItems.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Sale...' : 'Create Sale'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}