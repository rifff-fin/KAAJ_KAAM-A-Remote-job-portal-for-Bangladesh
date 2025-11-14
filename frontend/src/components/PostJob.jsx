// src/pages/PostJob.jsx
import React, { useState, useEffect } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import './PostJob.css';

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
    <div className="postjob-page">
      <div className="postjob-box">
        <h1>Post a New Job</h1>
        <p className="subtitle">Hire top freelancers for your project</p>

        <form onSubmit={handleSubmit} className="postjob-form">
          <div className="input-group">
            <label>Job Title</label>
            <input
              type="text"
              placeholder="e.g. Build a React Dashboard"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea
              placeholder="Describe your project in detail..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows="5"
              required
            />
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Budget (BDT)</label>
              <input
                type="number"
                placeholder="5000"
                value={form.budget}
                onChange={e => setForm({ ...form, budget: e.target.value })}
                min="100"
                required
              />
            </div>

            <div className="input-group">
              <label>Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Category</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
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

          <div className="input-group">
            <label>Skills Required (comma separated)</label>
            <input
              type="text"
              placeholder="React, Node.js, MongoDB"
              value={form.skills}
              onChange={e => setForm({ ...form, skills: e.target.value })}
            />
            <small>e.g. JavaScript, Figma, SEO</small>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Posting Job...' : 'Post Job'}
          </button>
        </form>
      </div>
    </div>
  );
}