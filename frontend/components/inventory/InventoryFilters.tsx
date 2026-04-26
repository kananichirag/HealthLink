'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GetInventoryQuery } from '../../lib/api';

interface InventoryFiltersProps {
  onFiltersChange: (filters: GetInventoryQuery) => void;
  initialFilters?: GetInventoryQuery;
}

export default function InventoryFilters({ onFiltersChange, initialFilters = {} }: InventoryFiltersProps) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [stockStatus, setStockStatus] = useState<'LOW' | 'NORMAL' | ''>(initialFilters.stockStatus || '');
  const [expiryStatus, setExpiryStatus] = useState<'EXPIRED' | 'EXPIRING' | 'NORMAL' | ''>(initialFilters.expiryStatus || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const filters: GetInventoryQuery = {};
    if (debouncedSearch) filters.search = debouncedSearch;
    if (stockStatus) filters.stockStatus = stockStatus;
    if (expiryStatus) filters.expiryStatus = expiryStatus;
    onFiltersChange(filters);
  }, [debouncedSearch, stockStatus, expiryStatus, onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setStockStatus('');
    setExpiryStatus('');
    setDebouncedSearch('');
  }, []);

  const hasActiveFilters = search || stockStatus || expiryStatus;

  const selectClass = "block w-full pl-3 pr-8 py-2.5 text-sm border border-gray-200 text-gray-900 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer";

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-5">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <label htmlFor="inv-search" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="inv-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, batch number, or supplier..."
              className="block w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Stock Status */}
        <div className="w-full lg:w-44">
          <label htmlFor="inv-stock" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Stock Status
          </label>
          <div className="relative">
            <select
              id="inv-stock"
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value as 'LOW' | 'NORMAL' | '')}
              className={selectClass}
            >
              <option value="">All Levels</option>
              <option value="LOW">Low Stock</option>
              <option value="NORMAL">Normal</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Expiry Status */}
        <div className="w-full lg:w-44">
          <label htmlFor="inv-expiry" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Expiry Status
          </label>
          <div className="relative">
            <select
              id="inv-expiry"
              value={expiryStatus}
              onChange={(e) => setExpiryStatus(e.target.value as 'EXPIRED' | 'EXPIRING' | 'NORMAL' | '')}
              className={selectClass}
            >
              <option value="">All Status</option>
              <option value="EXPIRED">Expired</option>
              <option value="EXPIRING">Expiring Soon</option>
              <option value="NORMAL">Normal</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-400">Active:</span>
          {search && (
            <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
              Search: {search}
              <button onClick={() => setSearch('')} className="w-4 h-4 rounded-full hover:bg-indigo-200 flex items-center justify-center transition-colors">
                <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          )}
          {stockStatus && (
            <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
              {stockStatus === 'LOW' ? 'Low Stock' : 'Normal Stock'}
              <button onClick={() => setStockStatus('')} className="w-4 h-4 rounded-full hover:bg-orange-200 flex items-center justify-center transition-colors">
                <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          )}
          {expiryStatus && (
            <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
              {expiryStatus === 'EXPIRED' ? 'Expired' : expiryStatus === 'EXPIRING' ? 'Expiring Soon' : 'Normal'}
              <button onClick={() => setExpiryStatus('')} className="w-4 h-4 rounded-full hover:bg-yellow-200 flex items-center justify-center transition-colors">
                <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
