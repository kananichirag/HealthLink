'use client';

import React from 'react';
import { NotificationResponse, markNotificationRead } from '../../lib/api';

interface NotificationPanelProps {
  notifications: NotificationResponse[];
  onMarkRead: (id: string) => void;
  onClose: () => void;
}

const typeIcon: Record<string, string> = {
  LOW_STOCK: '⚠️',
  EXPIRY_WARNING: '🕐',
  ORDER_UPDATE: '📦',
  PAYMENT_UPDATE: '💳',
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationPanel({ notifications, onMarkRead, onClose }: NotificationPanelProps) {
  const handleClick = async (notification: NotificationResponse) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
        onMarkRead(notification.id);
      } catch {
        // silently fail
      }
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/60 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-2xl mb-2">🔔</p>
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left px-4 py-3 hover:bg-indigo-50/50 transition-colors ${!n.isRead ? 'bg-indigo-50/30' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">{typeIcon[n.type] ?? '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
