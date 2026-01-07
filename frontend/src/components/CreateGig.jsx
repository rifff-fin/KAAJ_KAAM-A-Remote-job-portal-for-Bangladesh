import React, { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import Toast from './Toast';
import { FileImage, DollarSign, Clock, Tag, FileText, Sparkles } from 'lucide-react';

export default function CreateGig() {
  const [form, setForm] = useState({
    title: '', description: '', category: 'web', price: '', deliveryTime: '', image: null
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [fileName, setFileName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    Object.keys(form).forEach(key => data.append(key, form[key]));
    try {
      await API.post('/gigs', data);
      setToast({ message: 'Gig created successfully!', type: 'success' });
      setTimeout(() => navigate('/seller-dashboard'), 2000);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Error creating gig', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file });
      setFileName(file.name);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Gig</h1>
          <p className="text-gray-600 text-lg">Share your expertise and start earning</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Gig Title */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-blue-500" />
                Gig Title
              </label>
              <p className="text-sm text-gray-500 mb-2">Give your gig a catchy, descriptive title</p>
              <input 
                type="text"
                placeholder="I will create a professional website for your business" 
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} 
                required 
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-blue-500" />
                Description
              </label>
              <p className="text-sm text-gray-500 mb-2">Describe what you'll deliver and what makes your service unique</p>
              <textarea 
                placeholder="Provide a detailed description of your service, including what's included, your experience, and any special features..."
                value={form.description}
                className="w-full p-4 border border-gray-300 rounded-xl h-40 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none text-gray-900 placeholder-gray-400" 
                onChange={e => setForm({ ...form, description: e.target.value })} 
                required 
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <Tag className="w-4 h-4 text-blue-500" />
                Category
              </label>
              <p className="text-sm text-gray-500 mb-2">Select the category that best fits your service</p>
              <select 
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })} 
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 bg-white cursor-pointer"
              >
                <option value="web">Web Development</option>
                <option value="design">Graphic Design</option>
                <option value="writing">Writing</option>
                <option value="video">Video Editing</option>
              </select>
            </div>

            {/* Price and Delivery Time - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Price (BDT)
                </label>
                <p className="text-sm text-gray-500 mb-2">Set your service price</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">৳</span>
                  <input 
                    type="number" 
                    placeholder="5000" 
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })} 
                    required 
                    className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400"
                    min="0"
                  />
                </div>
              </div>

              {/* Delivery Time */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Delivery Time
                </label>
                <p className="text-sm text-gray-500 mb-2">Estimated completion time</p>
                <input 
                  type="text"
                  placeholder="e.g., 3 days" 
                  value={form.deliveryTime}
                  onChange={e => setForm({ ...form, deliveryTime: e.target.value })} 
                  required 
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <FileImage className="w-4 h-4 text-purple-500" />
                Gig Image
              </label>
              <p className="text-sm text-gray-500 mb-2">Upload a high-quality image to showcase your service</p>
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="hidden" 
                  id="image-upload"
                />
                <label 
                  htmlFor="image-upload" 
                  className="flex items-center justify-center gap-3 w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group"
                >
                  <FileImage className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <div className="text-center">
                    <p className="text-gray-700 font-medium group-hover:text-blue-600 transition-colors">
                      {fileName || 'Click to upload image'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Create Gig
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Helper Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Check out our <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Seller Guidelines</a>
          </p>
        </div>
      </div>
    </div>
  );
}