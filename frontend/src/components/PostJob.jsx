import React, { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function PostJob() {
  const [form, setForm] = useState({
    title: '', description: '', budget: '', deadline: '', category: 'web'
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/jobs', form);
      alert('Job posted!');
      navigate('/');
    } catch (err) {
      alert('Error: ' + err.response?.data?.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="card">
          <h2 className="text-3xl font-bold mb-6">Post a Job</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <input placeholder="Job Title" onChange={e => setForm({...form, title: e.target.value})} required />
            <textarea placeholder="Description" className="h-32" onChange={e => setForm({...form, description: e.target.value})} required />
            <input type="number" placeholder="Budget ($)" onChange={e => setForm({...form, budget: e.target.value})} required />
            <input placeholder="Deadline (e.g. 7 days)" onChange={e => setForm({...form, deadline: e.target.value})} required />
            <select onChange={e => setForm({...form, category: e.target.value})}>
              <option value="web">Web Development</option>
              <option value="design">Design</option>
              <option value="writing">Writing</option>
            </select>
            <button type="submit" className="w-full">Post Job</button>
          </form>
        </div>
      </div>
    </div>
  );
}