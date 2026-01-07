import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function CancelOrderModal({ order, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm(order._id, reason);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-red-900">Cancel Order</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-red-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> Canceling this order cannot be undone. The seller will be notified about the cancellation.
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-600">Order ID:</span>
              <span className="text-sm text-gray-900 font-semibold">{order._id?.slice(-8) || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-600">Status:</span>
              <span className="text-sm text-gray-900 font-semibold capitalize">{order.status}</span>
            </div>
            {order.gigTitle && (
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-600">Gig:</span>
                <span className="text-sm text-gray-900 font-semibold">{order.gigTitle}</span>
              </div>
            )}
          </div>

          {/* Reason Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please let us know why you're canceling this order..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {reason.length} characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Keep Order
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Canceling...' : 'Cancel Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
