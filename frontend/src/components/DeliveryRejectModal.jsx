// frontend/src/components/DeliveryRejectModal.jsx
import React, { useState } from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import API from '../api';

export default function DeliveryRejectModal({ order, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [redeliveryDays, setRedeliveryDays] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    if (redeliveryDays < 1 || redeliveryDays > 30) {
      setError('Redelivery days must be between 1 and 30');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await API.post(`/orders/${order._id}/delivery/reject`, {
        reason: reason.trim(),
        redeliveryDays: parseInt(redeliveryDays)
      });
      
      alert(`Delivery rejected. Seller has ${redeliveryDays} days to redeliver.`);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reject delivery');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 p-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <FiAlertCircle className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Reject Delivery</h2>
              <p className="text-sm text-gray-600">Order #{order._id.slice(-6)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-red-100 rounded-lg"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <FiAlertCircle className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Rejecting this delivery will send it back to the seller for revision. 
              Please provide a clear reason so they can improve their work.
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              placeholder="Please explain what needs to be improved or changed..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {reason.length} characters
            </p>
          </div>

          {/* Redelivery Days */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Redelivery Deadline (Days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={redeliveryDays}
              onChange={(e) => setRedeliveryDays(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Seller will have {redeliveryDays} days to make revisions and redeliver
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Rejecting...' : 'Reject Delivery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
