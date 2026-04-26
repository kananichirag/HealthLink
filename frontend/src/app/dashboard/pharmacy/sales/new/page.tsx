'use client';

import React, { useReducer, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  useMedicines,
  useCreateSale,
  usePrescriptionCheckout,
  type CreateSaleInput,
} from '@/hooks/usePharmacyQueries';

// ── Types ──

interface BillItem {
  medicineId: string;
  name: string;
  batchNumber: string;
  quantity: number;
  pricePerUnit: number;
  available: boolean;
}

type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE';
type DiscountType = 'FLAT' | 'PERCENTAGE';

interface BillState {
  items: BillItem[];
  discount: number;
  discountType: DiscountType;
  taxRate: number;
  paymentMethod: PaymentMethod;
  prescriptionId: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
}

type BillAction =
  | { type: 'ADD_ITEM'; item: BillItem }
  | { type: 'REMOVE_ITEM'; medicineId: string }
  | { type: 'UPDATE_QUANTITY'; medicineId: string; quantity: number }
  | { type: 'SET_DISCOUNT'; discount: number; discountType: DiscountType }
  | { type: 'SET_TAX_RATE'; taxRate: number }
  | { type: 'SET_PAYMENT_METHOD'; method: PaymentMethod }
  | { type: 'LOAD_PRESCRIPTION'; items: BillItem[]; prescriptionId: string }
  | { type: 'RESET' };

// ── Reducer ──

function computeTotals(items: BillItem[], discount: number, discountType: DiscountType, taxRate: number) {
  const subtotal = items.reduce((sum, i) => sum + i.pricePerUnit * i.quantity, 0);
  const discountAmount = discountType === 'PERCENTAGE'
    ? subtotal * (discount / 100)
    : discount;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * (taxRate / 100);
  const finalAmount = taxableAmount + taxAmount;
  return { subtotal, discountAmount, taxAmount, finalAmount };
}

const initialState: BillState = {
  items: [],
  discount: 0,
  discountType: 'FLAT',
  taxRate: 0,
  paymentMethod: 'CASH',
  prescriptionId: null,
  subtotal: 0,
  discountAmount: 0,
  taxAmount: 0,
  finalAmount: 0,
};

function billReducer(state: BillState, action: BillAction): BillState {
  let nextItems = state.items;
  let nextDiscount = state.discount;
  let nextDiscountType = state.discountType;
  let nextTaxRate = state.taxRate;
  let nextPrescriptionId = state.prescriptionId;
  let nextPaymentMethod = state.paymentMethod;

  switch (action.type) {
    case 'ADD_ITEM': {
      const exists = state.items.find((i) => i.medicineId === action.item.medicineId);
      if (exists) {
        nextItems = state.items.map((i) =>
          i.medicineId === action.item.medicineId
            ? { ...i, quantity: i.quantity + action.item.quantity }
            : i,
        );
      } else {
        nextItems = [...state.items, action.item];
      }
      break;
    }
    case 'REMOVE_ITEM':
      nextItems = state.items.filter((i) => i.medicineId !== action.medicineId);
      break;
    case 'UPDATE_QUANTITY':
      nextItems = state.items.map((i) =>
        i.medicineId === action.medicineId ? { ...i, quantity: Math.max(1, action.quantity) } : i,
      );
      break;
    case 'SET_DISCOUNT':
      nextDiscount = action.discount;
      nextDiscountType = action.discountType;
      break;
    case 'SET_TAX_RATE':
      nextTaxRate = action.taxRate;
      break;
    case 'SET_PAYMENT_METHOD':
      nextPaymentMethod = action.method;
      break;
    case 'LOAD_PRESCRIPTION':
      nextItems = action.items;
      nextPrescriptionId = action.prescriptionId;
      break;
    case 'RESET':
      return initialState;
  }

  const totals = computeTotals(nextItems, nextDiscount, nextDiscountType, nextTaxRate);
  return {
    items: nextItems,
    discount: nextDiscount,
    discountType: nextDiscountType,
    taxRate: nextTaxRate,
    paymentMethod: nextPaymentMethod,
    prescriptionId: nextPrescriptionId,
    ...totals,
  };
}

// ── Debounce hook ──

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Component ──

export default function NewBillPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(billReducer, initialState);

  // Medicine search with debounce
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 200);
  const { data: medicineData, isFetching: searchLoading } = useMedicines(
    debouncedSearch ? { search: debouncedSearch, limit: 10 } : undefined,
  );
  const searchResults = debouncedSearch
    ? (Array.isArray(medicineData) ? medicineData : (medicineData as any)?.data ?? [])
    : [];

  // Prescription checkout
  const [prescriptionIdInput, setPrescriptionIdInput] = useState('');
  const prescriptionCheckout = usePrescriptionCheckout();

  // Sale submission with optimistic update
  const createSale = useCreateSale();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [optimisticSuccess, setOptimisticSuccess] = useState(false);

  const handleAddMedicine = (med: any) => {
    dispatch({
      type: 'ADD_ITEM',
      item: {
        medicineId: med.id,
        name: med.name,
        batchNumber: med.batchNumber || '',
        quantity: 1,
        pricePerUnit: Number(med.unitPrice) || 0,
        available: true,
      },
    });
    setSearchInput('');
  };

  const handlePrescriptionCheckout = () => {
    if (!prescriptionIdInput.trim()) return;
    prescriptionCheckout.mutate(prescriptionIdInput.trim(), {
      onSuccess: (data: any) => {
        const items: BillItem[] = (data.items || []).map((item: any) => ({
          medicineId: item.medicineId || item.id,
          name: item.medicineName || item.name || '',
          batchNumber: item.batchNumber || '',
          quantity: item.quantity || 1,
          pricePerUnit: Number(item.unitPrice || item.pricePerUnit) || 0,
          available: item.available !== false,
        }));
        dispatch({ type: 'LOAD_PRESCRIPTION', items, prescriptionId: prescriptionIdInput.trim() });
        setPrescriptionIdInput('');
      },
    });
  };

  const handleSubmit = () => {
    if (state.items.length === 0) return;
    setSubmitError(null);

    const saleInput: CreateSaleInput = {
      items: state.items
        .filter((i) => i.available)
        .map((i) => ({
          medicineId: i.medicineId,
          quantity: i.quantity,
          pricePerUnit: i.pricePerUnit,
        })),
      discount: state.discount || undefined,
      discountType: state.discount ? state.discountType : undefined,
      taxRate: state.taxRate || undefined,
      paymentMethod: state.paymentMethod,
      prescriptionId: state.prescriptionId || undefined,
    };

    // Optimistic: show success immediately
    setOptimisticSuccess(true);

    createSale.mutate(saleInput, {
      onSuccess: () => {
        // Invalidate caches
        queryClient.invalidateQueries({ queryKey: ['pharmacy', 'sales'] });
        queryClient.invalidateQueries({ queryKey: ['pharmacy', 'inventory'] });
        setTimeout(() => router.push('/dashboard/pharmacy/sales'), 1000);
      },
      onError: (err: any) => {
        // Rollback optimistic state
        setOptimisticSuccess(false);
        setSubmitError(err?.message || 'Failed to create sale. Please try again.');
      },
    });
  };

  const unavailableItems = state.items.filter((i) => !i.available);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">New Bill</h1>
        <button
          onClick={() => router.push('/dashboard/pharmacy/sales')}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>

      {optimisticSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          Sale created successfully! Redirecting...
        </div>
      )}

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {submitError}
        </div>
      )}

      {/* Prescription Checkout */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Prescription Checkout</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={prescriptionIdInput}
            onChange={(e) => setPrescriptionIdInput(e.target.value)}
            placeholder="Enter Prescription ID"
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button
            onClick={handlePrescriptionCheckout}
            disabled={prescriptionCheckout.isPending || !prescriptionIdInput.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          >
            {prescriptionCheckout.isPending ? 'Loading...' : 'Load Prescription'}
          </button>
        </div>
        {prescriptionCheckout.isError && (
          <p className="mt-2 text-red-600 text-sm">
            {(prescriptionCheckout.error as Error).message}
          </p>
        )}
      </div>

      {/* Medicine Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Add Medicines</h2>
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search medicine by name or batch..."
            className="w-full border rounded-lg px-3 py-2"
          />
          {searchLoading && (
            <span className="absolute right-3 top-2.5 text-sm text-gray-400">Searching...</span>
          )}
          {searchResults.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((med: any) => (
                <li key={med.id}>
                  <button
                    type="button"
                    onClick={() => handleAddMedicine(med)}
                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 flex justify-between items-center"
                  >
                    <span>
                      <span className="font-medium">{med.name}</span>
                      <span className="text-gray-500 text-sm ml-2">({med.batchNumber})</span>
                    </span>
                    <span className="text-sm text-gray-600">
                      ₹{Number(med.unitPrice || 0).toFixed(2)} · Qty: {med.quantity}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Unavailable medicines warning */}
      {unavailableItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Unavailable medicines:</p>
          <ul className="list-disc list-inside mt-1 text-sm">
            {unavailableItems.map((i) => (
              <li key={i.medicineId}>{i.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Bill Items Table */}
      {state.items.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Medicine</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Batch</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Price</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Qty</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {state.items.map((item) => (
                <tr key={item.medicineId} className={!item.available ? 'opacity-50 bg-yellow-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 font-medium">
                    {item.name}
                    {!item.available && <span className="ml-2 text-xs text-yellow-700">(unavailable)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.batchNumber || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">₹{item.pricePerUnit.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        dispatch({
                          type: 'UPDATE_QUANTITY',
                          medicineId: item.medicineId,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-20 border rounded px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    ₹{(item.pricePerUnit * item.quantity).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => dispatch({ type: 'REMOVE_ITEM', medicineId: item.medicineId })}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bill Summary & Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Discount & Tax */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold">Discount & Tax</h2>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={state.discount}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_DISCOUNT',
                    discount: parseFloat(e.target.value) || 0,
                    discountType: state.discountType,
                  })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={state.discountType}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_DISCOUNT',
                    discount: state.discount,
                    discountType: e.target.value as DiscountType,
                  })
                }
                className="border rounded-lg px-3 py-2"
              >
                <option value="FLAT">Flat (₹)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={state.taxRate}
              onChange={(e) =>
                dispatch({ type: 'SET_TAX_RATE', taxRate: parseFloat(e.target.value) || 0 })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <div className="flex gap-2">
              {(['CASH', 'CARD', 'ONLINE'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => dispatch({ type: 'SET_PAYMENT_METHOD', method })}
                  className={`px-4 py-2 rounded-lg border transition ${
                    state.paymentMethod === method
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white p-4 rounded-lg shadow space-y-3">
          <h2 className="text-lg font-semibold">Bill Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₹{state.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                Discount {state.discountType === 'PERCENTAGE' ? `(${state.discount}%)` : ''}
              </span>
              <span className="font-medium text-red-600">-₹{state.discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">GST ({state.taxRate}%)</span>
              <span className="font-medium">₹{state.taxAmount.toFixed(2)}</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{state.finalAmount.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={state.items.filter((i) => i.available).length === 0 || createSale.isPending || optimisticSuccess}
            className="w-full mt-4 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition font-medium"
          >
            {createSale.isPending ? 'Processing...' : optimisticSuccess ? 'Sale Created!' : 'Submit Bill'}
          </button>
          {state.items.length > 0 && (
            <button
              onClick={() => dispatch({ type: 'RESET' })}
              className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50 transition text-sm"
            >
              Clear Bill
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
