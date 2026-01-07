import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import API from '../api';
import Toast from './Toast';

export default function ApplyJobModal({ job, onClose, onSuccess }) {
  const [proposal, setProposal] = useState('');
  const [proposedBudget, setProposedBudget] = useState(job?.budget || '');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!proposal.trim()) {
      setToast({ message: 'Please write a proposal', type: 'error' });
      return;
    }

    if (!proposedBudget || proposedBudget <= 0) {
      setToast({ message: 'Please enter a valid budget', type: 'error' });
      return;
    }

    if (!deliveryDays || deliveryDays <= 0) {
      setToast({ message: 'Please enter valid delivery days', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await API.post(`/jobs/${job._id}/interest`, {
        message: proposal,
        proposedBudget: parseFloat(proposedBudget),
        deliveryDays: parseInt(deliveryDays)
      });
      
      setToast({ message: 'Application submitted successfully!', type: 'success' });
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting application:', err);
      setToast({ message: err.response?.data?.message || 'Failed to submit application', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Apply for Job</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Job Details */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{job?.title}</h3>
          <p className="text-gray-600 mb-2">{job?.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            <span className="font-medium">Budget: ${job?.budget}</span>
            <span className="font-medium">Deadline: {new Date(job?.deadline).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Proposal */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Cover Letter / Proposal *
            </label>
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="Explain why you're the best fit for this job..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {proposal.length} characters
            </p>
          </div>

          {/* Proposed Budget */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Your Proposed Budget ($) *
            </label>
            <input
              type="number"
              value={proposedBudget}
              onChange={(e) => setProposedBudget(e.target.value)}
              placeholder="Enter your budget"
              min="1"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Client's budget: ${job?.budget}
            </p>
          </div>

          {/* Delivery Days */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Delivery Time (days) *
            </label>
            <input
              type="number"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
              placeholder="Number of days to complete"
              min="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}