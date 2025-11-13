import React, { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function CreateGig() {
  const [form, setForm] = useState({
    title: '', description: '', category: 'web', price: '', deliveryTime: '', image: null
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));

    try {
      await API.post('/api/gigs', formData);
      alert('Gig created successfully!');
      navigate('/seller-dashboard');
    } catch (err) {
      alert('Error: ' + err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="card">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Create New Gig</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <input placeholder="Gig Title" onChange={e => setForm({...form, title: e.target.value})} required />
            <textarea placeholder="Description" className="h-32" onChange={e => setForm({...form, description: e.target.value})} required />
            <select onChange={e => setForm({...form, category: e.target.value})}>
              <option value="web">Web Development</option>
              <option value="design">Graphic Design</option>
              <option value="writing">Writing</option>
              <option value="video">Video Editing</option>
            </select>
            <input type="number" placeholder="Price ($)" onChange={e => setForm({...form, price: e.target.value})} required />
            <input placeholder="Delivery Time (e.g. 3 days)" onChange={e => setForm({...form, deliveryTime: e.target.value})} required />
            <input type="file" accept="image/*" onChange={e => setForm({...form, image: e.target.files[0]})} />
            <button type="submit" disabled={loading} className="w-full">
              {loading ? 'Uploading...' : 'Create Gig'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}