'use client';

import React, { useState } from 'react';
import {
  useSetAvailability,
  useBlockDate,
  useUnblockDate,
  useSetMaxAppointments,
  type TimeSlot,
} from '@/hooks/useDoctorQueries';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function DoctorSchedulePage() {
  const [slots, setSlots] = useState<Record<string, TimeSlot[]>>({});
  const [blockDateValue, setBlockDateValue] = useState('');
  const [unblockDateValue, setUnblockDateValue] = useState('');
  const [maxPerDay, setMaxPerDay] = useState(10);

  const setAvailability = useSetAvailability();
  const blockDate = useBlockDate();
  const unblockDate = useUnblockDate();
  const setMaxAppointments = useSetMaxAppointments();

  const addSlot = (day: string) => {
    const daySlots = slots[day] || [];
    setSlots({ ...slots, [day]: [...daySlots, { startTime: '09:00', endTime: '09:30' }] });
  };

  const removeSlot = (day: string, index: number) => {
    const daySlots = [...(slots[day] || [])];
    daySlots.splice(index, 1);
    setSlots({ ...slots, [day]: daySlots });
  };

  const updateSlot = (day: string, index: number, field: keyof TimeSlot, value: string) => {
    const daySlots = [...(slots[day] || [])];
    daySlots[index] = { ...daySlots[index], [field]: value };
    setSlots({ ...slots, [day]: daySlots });
  };

  const handleSaveAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    setAvailability.mutate({ slots });
  };

  const handleBlockDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDateValue) return;
    blockDate.mutate({ date: blockDateValue }, {
      onSuccess: () => setBlockDateValue(''),
    });
  };

  const handleUnblockDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unblockDateValue) return;
    unblockDate.mutate(unblockDateValue, {
      onSuccess: () => setUnblockDateValue(''),
    });
  };

  const handleSetMax = (e: React.FormEvent) => {
    e.preventDefault();
    setMaxAppointments.mutate({ maxPerDay });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>

      {/* Availability Configuration */}
      <form onSubmit={handleSaveAvailability} className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold">Weekly Availability</h2>
        <p className="text-sm text-gray-500">Configure your recurring time slots for each day of the week.</p>

        <div className="space-y-4">
          {DAYS.map((day) => (
            <div key={day} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{day}</span>
                <button
                  type="button"
                  onClick={() => addSlot(day)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  + Add Slot
                </button>
              </div>
              {(slots[day] || []).length === 0 && (
                <p className="text-xs text-gray-400">No slots configured</p>
              )}
              {(slots[day] || []).map((slot, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-1">
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(day, idx, 'startTime', e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(day, idx, 'endTime', e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeSlot(day, idx)}
                    className="text-red-500 text-xs hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {setAvailability.isError && (
          <p className="text-red-600 text-sm">{(setAvailability.error as Error).message}</p>
        )}
        {setAvailability.isSuccess && (
          <p className="text-green-600 text-sm">Availability saved!</p>
        )}
        <button
          type="submit"
          disabled={setAvailability.isPending}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {setAvailability.isPending ? 'Saving...' : 'Save Availability'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Block Date */}
        <form onSubmit={handleBlockDate} className="bg-white p-6 rounded-lg shadow space-y-3">
          <h2 className="text-lg font-semibold">Block a Date</h2>
          <input
            type="date"
            value={blockDateValue}
            onChange={(e) => setBlockDateValue(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
          {blockDate.isError && (
            <p className="text-red-600 text-sm">{(blockDate.error as Error).message}</p>
          )}
          {blockDate.isSuccess && (
            <p className="text-green-600 text-sm">Date blocked!</p>
          )}
          <button
            type="submit"
            disabled={blockDate.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
          >
            {blockDate.isPending ? 'Blocking...' : 'Block Date'}
          </button>
        </form>

        {/* Unblock Date */}
        <form onSubmit={handleUnblockDate} className="bg-white p-6 rounded-lg shadow space-y-3">
          <h2 className="text-lg font-semibold">Unblock a Date</h2>
          <input
            type="date"
            value={unblockDateValue}
            onChange={(e) => setUnblockDateValue(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
          {unblockDate.isError && (
            <p className="text-red-600 text-sm">{(unblockDate.error as Error).message}</p>
          )}
          {unblockDate.isSuccess && (
            <p className="text-green-600 text-sm">Date unblocked!</p>
          )}
          <button
            type="submit"
            disabled={unblockDate.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
          >
            {unblockDate.isPending ? 'Unblocking...' : 'Unblock Date'}
          </button>
        </form>
      </div>

      {/* Max Appointments */}
      <form onSubmit={handleSetMax} className="bg-white p-6 rounded-lg shadow space-y-3">
        <h2 className="text-lg font-semibold">Max Appointments Per Day</h2>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={maxPerDay}
            onChange={(e) => setMaxPerDay(parseInt(e.target.value) || 1)}
            className="border rounded-lg px-3 py-2 w-24"
            min={1}
            required
          />
          <button
            type="submit"
            disabled={setMaxAppointments.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {setMaxAppointments.isPending ? 'Saving...' : 'Set Max'}
          </button>
        </div>
        {setMaxAppointments.isError && (
          <p className="text-red-600 text-sm">{(setMaxAppointments.error as Error).message}</p>
        )}
        {setMaxAppointments.isSuccess && (
          <p className="text-green-600 text-sm">Max appointments updated!</p>
        )}
      </form>
    </div>
  );
}
