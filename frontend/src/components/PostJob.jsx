import React, { useState, useEffect } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import Toast from './Toast';
import { Briefcase, FileText, DollarSign, Calendar, Tag, Sparkles, Users } from 'lucide-react';

export default function PostJob() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    category: 'web',
    skills: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Block non-buyers
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'buyer') {
      setToast({ message: 'Only clients can post jobs', type: 'error' });
      const timer = setTimeout(() => navigate('/'), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.budget || !form.deadline) {
      setToast({ message: 'All fields are required', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        budget: Number(form.budget),
        skills: form.skills
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      };

      await API.post('/jobs', payload);
      setToast({ message: 'Job posted successfully!', type: 'success' });
      setTimeout(() => navigate('/client-dashboard'), 2000);
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.msg || 'Failed to post job', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-4 shadow-lg">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Post a New Job</h1>
          <p className="text-gray-600 text-lg">Hire top freelancers for your project</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Job Title */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-green-500" />
                Job Title
              </label>
              <p className="text-sm text-gray-500 mb-2">Give your job a clear, descriptive title</p>
              <input
                type="text"
                placeholder="e.g., Build a React Dashboard with Admin Panel"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-green-500" />
                Job Description
              </label>
              <p className="text-sm text-gray-500 mb-2">Provide detailed requirements and expectations for this project</p>
              <textarea
                rows={6}
                placeholder="Describe your project in detail: scope, deliverables, technical requirements, timeline expectations..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none resize-none text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <Tag className="w-4 h-4 text-green-500" />
                Category
              </label>
              <p className="text-sm text-gray-500 mb-2">Select the category that best matches your project</p>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900 bg-white cursor-pointer"
              >
                <option value="web">Web Development</option>
                <option value="design">Graphic Design</option>
                <option value="writing">Content Writing</option>
                <option value="video">Video Editing</option>
                <option value="marketing">Digital Marketing</option>
                <option value="mobile">Mobile App</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Budget and Deadline - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Budget (BDT)
                </label>
                <p className="text-sm text-gray-500 mb-2">Set your project budget</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">৳</span>
                  <input
                    type="number"
                    placeholder="5000"
                    value={form.budget}
                    onChange={e => setForm({ ...form, budget: e.target.value })}
                    min="100"
                    className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  Deadline
                </label>
                <p className="text-sm text-gray-500 mb-2">When do you need this done?</p>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900"
                  required
                />
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <Users className="w-4 h-4 text-purple-500" />
                Skills Required
              </label>
              <p className="text-sm text-gray-500 mb-2">List the skills needed for this project (comma separated)</p>
              <input
                type="text"
                placeholder="React, Node.js, MongoDB, REST API"
                value={form.skills}
                onChange={e => setForm({ ...form, skills: e.target.value })}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 mt-1">Examples: JavaScript, Figma, SEO, Content Writing</p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 focus:ring-4 focus:ring-green-300 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Posting Job...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Post Job
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Helper Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Check out our <a href="#" className="text-green-600 hover:text-green-700 font-medium">Posting Guidelines</a>
          </p>
        </div>
      </div>
    </div>
  );
}