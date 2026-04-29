'use client';

import React, { useState } from 'react';

interface BillItem {
  medicineName: string;
  medicineId: string;
  prescribedQuantity: number;
  availableQuantity: number;
  pricePerUnit: number;
  available: boolean;
}

interface PrescriptionCheckoutResponse {
  prescriptionId: string;
  items: BillItem[];
  totalAmount: number;
}

interface CreateSaleInput {
  items: Array<{
    medicineId: string;
    quantity: number;
    pricePerUnit: number;
  }>;
  discount?: number;
  discountType?: 'FLAT' | 'PERCENTAGE';
  taxRate?: number;
  paymentMethod: 'CASH' | 'CARD' | 'ONLINE';
  patientId?: string;
  prescriptionId?: string;
}

interface CheckoutSummaryModalProps {
  checkoutData: PrescriptionCheckoutResponse;
  onConfirm: (saleData: CreateSaleInput) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

export default function CheckoutSummaryModal({
  checkoutData,
  onConfirm,
  onClose,
  isSubmitting,
}: CheckoutSummaryModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'ONLINE'>('CASH');

  const handleConfirm = () => {
    const saleData: CreateSaleInput = {
      items: checkoutData.items.map((item) => ({
        medicineId: item.medicineId,
        quantity: item.prescribedQuantity,
        pricePerUnit: item.pricePerUnit,
      })),
      paymentMethod,
      prescriptionId: checkoutData.prescriptionId,
    };
    onConfirm(saleData);
  };

  const allAvailable = checkoutData.items.every((item) => item.available);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Checkout Summary</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Medicine</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right">Prescribed Qty</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right">Available Qty</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right">Price/Unit</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {checkoutData.items.map((item, index) => {
                  const subtotal = item.prescribedQuantity * item.pricePerUnit;
                  return (
                    <tr key={index} className={!item.available ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3 font-medium">{item.medicineName}</td>
                      <td className="px-4 py-3 text-right">{item.prescribedQuantity}</td>
                      <td className="px-4 py-3 text-right">{item.availableQuantity}</td>
                      <td className="px-4 py-3 text-right">${item.pricePerUnit.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium">${subtotal.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        {item.available ? (
                          <span className="inline-flex items-center text-green-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-900">Total:</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    ${checkoutData.totalAmount.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Availability Warning */}
          {!allAvailable && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Insufficient Stock</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Some medicines are not available in the prescribed quantity. Please adjust the order or restock before completing the sale.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="CASH"
                  checked={paymentMethod === 'CASH'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'CASH')}
                  className="mr-2"
                  disabled={isSubmitting}
                />
                <span className="text-sm">Cash</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="CARD"
                  checked={paymentMethod === 'CARD'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'CARD')}
                  className="mr-2"
                  disabled={isSubmitting}
                />
                <span className="text-sm">Card</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="ONLINE"
                  checked={paymentMethod === 'ONLINE'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'ONLINE')}
                  className="mr-2"
                  disabled={isSubmitting}
                />
                <span className="text-sm">Online</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || !allAvailable}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? 'Processing...' : 'Confirm Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}
