'use client';

import React from 'react';
import { Zap, Clock, Lightbulb } from 'lucide-react';

export default function DoctorSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 text-sm mt-1">Manage your account preferences and configurations</p>
          </div>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Main Coming Soon Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-blue-100 rounded-full flex items-center justify-center">
                <Zap size={40} className="text-teal-600" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Coming Soon</h2>

            {/* Description */}
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              We're working on bringing you powerful settings and preferences to customize your experience. Stay tuned!
            </p>

            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 mt-12">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-center mb-3">
                  <Clock size={24} className="text-teal-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Schedule Settings</h3>
                <p className="text-sm text-gray-600">Configure your availability and working hours</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-center mb-3">
                  <Lightbulb size={24} className="text-teal-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Preferences</h3>
                <p className="text-sm text-gray-600">Customize notifications and communication</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-center mb-3">
                  <Zap size={24} className="text-teal-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">Advanced Options</h3>
                <p className="text-sm text-gray-600">Fine-tune your account settings</p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.history.back()}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.href = '/dashboard/doctor'}
                className="px-6 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Back to Dashboard
              </button>
            </div>

            {/* Footer Note */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                We're continuously improving MediFlow. Check back soon for exciting new features!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
