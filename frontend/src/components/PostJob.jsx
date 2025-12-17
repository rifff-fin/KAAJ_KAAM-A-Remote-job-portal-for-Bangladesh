import React, { useState, useEffect } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Block non-buyers
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'buyer') {
      alert('Only clients can post jobs');
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.budget || !form.deadline) {
      alert('All fields are required');
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
      alert('Job posted successfully!');
      navigate('/client-dashboard');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex justify-center py-10 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-1">Post a New Job</h1>
        <p className="text-center text-gray-500 mb-8">Hire top freelancers for your project</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Job Title */}
          <div className="flex flex-col">
            <label className="font-semibold text-gray-700 mb-2">Job Title</label>
            <input
              type="text"
              placeholder="e.g. Build a React Dashboard"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col">
            <label className="font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              rows={5}
              placeholder="Describe your project in detail..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 resize-y"
              required
            />
          </div>

          {/* Budget & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="font-semibold text-gray-700 mb-2">Budget (BDT)</label>
              <input
                type="number"
                placeholder="5000"
                value={form.budget}
                onChange={e => setForm({ ...form, budget: e.target.value })}
                min="100"
                className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold text-gray-700 mb-2">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col">
            <label className="font-semibold text-gray-700 mb-2">Category</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
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

          {/* Skills */}
          <div className="flex flex-col">
            <label className="font-semibold text-gray-700 mb-2">Skills Required (comma separated)</label>
            <input
              type="text"
              placeholder="React, Node.js, MongoDB"
              value={form.skills}
              onChange={e => setForm({ ...form, skills: e.target.value })}
              className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
            />
            <small className="text-gray-500 mt-1">e.g. JavaScript, Figma, SEO</small>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`mt-4 bg-blue-600 text-white font-semibold p-3 rounded-lg transition-all ${
              loading ? 'bg-blue-300 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {loading ? 'Posting Job...' : 'Post Job'}
          </button>
        </form>
      </div>
    </div>
  );
}
