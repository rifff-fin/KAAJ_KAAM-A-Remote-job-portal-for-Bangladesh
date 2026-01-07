import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmationModal({ title, message, onConfirm, onCancel, isDangerous = false }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className={`${isDangerous ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'} border-b px-6 py-4 flex items-center justify-between rounded-t-2xl`}>
          <div className="flex items-center gap-3">
            {isDangerous && <AlertTriangle className="w-6 h-6 text-red-600" />}
            <h2 className={`text-xl font-bold ${isDangerous ? 'text-red-900' : 'text-blue-900'}`}>
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className={`p-2 ${isDangerous ? 'hover:bg-red-100' : 'hover:bg-blue-100'} rounded-lg transition`}
          >
            <X className={`w-5 h-5 ${isDangerous ? 'text-red-600' : 'text-blue-600'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 ${isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg font-medium transition`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
