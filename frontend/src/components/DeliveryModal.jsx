import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, FileText } from 'lucide-react';
import API from '../api';

function DeliveryModal({ order, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    description: '',
    notes: '',
    link: '',
    files: []
  });
  const [loading, setLoading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFormData({ ...formData, files: selectedFiles });
    
    // Create preview URLs
    const previews = selectedFiles.map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      type: file.type
    }));
    setPreviewFiles(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('description', formData.description);
      data.append('notes', formData.notes);
      data.append('link', formData.link);
      
      formData.files.forEach(file => {
        data.append('files', file);
      });

      const token = localStorage.getItem('token');
      await API.post(`/orders/${order._id}/deliver`, data, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Order delivered successfully! The client will be notified to review your work.');
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to deliver order';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Deliver Order</h2>
              <p className="text-sm text-gray-600 mt-1">{order.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Work Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={5}
              placeholder="Describe what you have completed, key deliverables, etc..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">Provide a detailed overview of your completed work</p>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Any additional information, instructions, or comments for the client..."
            />
          </div>

          {/* Link to Work */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <LinkIcon className="w-4 h-4 inline mr-1" />
              Link to Work (Optional)
            </label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/your-work"
            />
            <p className="text-xs text-gray-500 mt-1">Share a link to your completed work (GitHub, Google Drive, etc.)</p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Upload className="w-4 h-4 inline mr-1" />
              Upload Files (Optional)
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              accept="image/*,.pdf,.doc,.docx,.zip,.rar"
            />
            <p className="text-xs text-gray-500 mt-1">Upload relevant files, documents, or images</p>
            
            {/* File Previews */}
            {previewFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {previewFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700 flex-1">{file.name}</span>
                    <span className="text-xs text-gray-500">{file.size}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> After delivery, the client will be asked to review your work and can optionally leave a tip. 
              Your payment (90% of order amount) will be released after successful review.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.description}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Delivering...' : 'Deliver Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeliveryModal;
