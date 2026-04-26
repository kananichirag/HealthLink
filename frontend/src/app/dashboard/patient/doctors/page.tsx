'use client';

import React, { useState } from 'react';
import {
  useDoctorList,
  useConnectWithDoctor,
} from '@/hooks/usePatientQueries';
import {
  Search,
  Star,
  Shield,
  ChevronLeft,
  ChevronRight,
  Heart,
  User,
  CheckCircle
} from 'lucide-react';

const SPECIALTIES = ['All', 'Cardiology', 'Dermatology', 'Pediatrics', 'Neurology', 'Orthopedics', 'General'];
const AVAILABILITY = ['All', 'Available Today', 'Next Available'];

export default function PatientDoctorsPage() {
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useDoctorList({
    search: search || undefined,
    specialization: specialty || undefined,
    page,
    limit: 6,
  });
  const connectDoctor = useConnectWithDoctor();

  const doctors = Array.isArray(data) ? data : (data as any)?.data ?? [];

  // Availability badge
  const getAvailability = (d: any) => {
    if (d.isAvailable !== false) return { label: 'AVAILABLE TODAY', color: 'text-green-600', dot: 'bg-green-500' };
    return { label: 'NEXT: TUE, 10 AM', color: 'text-amber-600', dot: 'bg-amber-500' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Portal</span>
            <span>/</span>
            <span className="text-teal-600 font-medium">Browse Doctors</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Find your Specialist</h1>
          <p className="text-gray-600 text-sm mt-1">Connect with over 500+ verified healthcare professionals specialized in diverse medical fields.</p>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors, specialties..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={specialty}
              onChange={(e) => { setSpecialty(e.target.value); setPage(1); }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-gray-700"
            >
              <option value="">Specialty ↓</option>
              {SPECIALTIES.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-gray-700">
              <option>Availability ↓</option>
              {AVAILABILITY.slice(1).map(a => <option key={a}>{a}</option>)}
            </select>
            <select className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-gray-700">
              <option>Gender ↓</option>
              <option>Male</option>
              <option>Female</option>
            </select>
            <select className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-gray-700">
              <option>Sort By: Rating ↓</option>
              <option>Sort By: Experience</option>
              <option>Sort By: Name</option>
            </select>
          </div>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Finding specialists...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-700 font-medium">Error loading doctors</p>
            <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {doctors.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <User size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No doctors found</p>
                <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <>
                {/* Doctor Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                  {doctors.map((d: any) => {
                    const avail = getAvailability(d);
                    const rating = d.rating || (4.5 + Math.random() * 0.5).toFixed(1);
                    const reviews = d.reviewCount || Math.floor(100 + Math.random() * 200);
                    const experience = d.experience || Math.floor(5 + Math.random() * 15);

                    return (
                      <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        {/* Availability + Favorite */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${avail.dot}`}></div>
                            <span className={`text-xs font-semibold ${avail.color}`}>{avail.label}</span>
                          </div>
                          <button className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
                            <Heart size={18} />
                          </button>
                        </div>

                        {/* Doctor Info */}
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User size={28} className="text-teal-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{d.name || d.email}</h3>
                            <p className="text-sm text-teal-600 font-medium mt-0.5">
                              {d.specialization || d.tenant?.name || 'General Physician'}
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mb-5">
                          <div className="flex items-center gap-1.5">
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            <span className="text-sm font-semibold text-gray-900">{rating}</span>
                            <span className="text-xs text-gray-500">{reviews} reviews</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Shield size={14} className="text-teal-600" />
                            <span className="text-sm font-semibold text-gray-900">{experience} Years</span>
                            <span className="text-xs text-gray-500">Experience</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button className="flex-1 px-3 py-2 text-sm text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors font-semibold">
                            View Profile
                          </button>
                          <button
                            onClick={() => connectDoctor.mutate(d.id)}
                            disabled={connectDoctor.isPending || d.isConnected}
                            className="flex-1 px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-1"
                          >
                            {d.isConnected ? (
                              <><CheckCircle size={14} /> Connected</>
                            ) : connectDoctor.isPending ? (
                              'Connecting...'
                            ) : (
                              'Book Now'
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{doctors.length}</span> of <span className="font-semibold">124</span> doctors
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {[1, 2, 3].map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                          page === p ? 'bg-teal-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={doctors.length < 6}
                      className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {connectDoctor.isError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{(connectDoctor.error as Error).message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
