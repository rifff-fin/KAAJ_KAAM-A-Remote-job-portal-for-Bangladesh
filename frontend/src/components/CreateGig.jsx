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
    const data = new FormData();
    Object.keys(form).forEach(key => data.append(key, form[key]));
    try {
      await API.post('/gigs', data);
      alert('Gig created!');
      navigate('/seller-dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6">Create New Gig</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input placeholder="Title" onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full p-3 border rounded-lg" />
          <textarea placeholder="Description" className="w-full p-3 border rounded-lg h-32" onChange={e => setForm({ ...form, description: e.target.value })} required />
          <select onChange={e => setForm({ ...form, category: e.target.value })} className="w-full p-3 border rounded-lg">
            <option value="web">Web Development</option>
            <option value="design">Graphic Design</option>
            <option value="writing">Writing</option>
            <option value="video">Video Editing</option>
          </select>
          <input type="number" placeholder="Price (BDT)" onChange={e => setForm({ ...form, price: e.target.value })} required className="w-full p-3 border rounded-lg" />
          <input placeholder="Delivery (e.g. 3 days)" onChange={e => setForm({ ...form, deliveryTime: e.target.value })} required className="w-full p-3 border rounded-lg" />
          <input type="file" accept="image/*" onChange={e => setForm({ ...form, image: e.target.files[0] })} className="w-full p-3 border rounded-lg" />
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">
            {loading ? 'Creating...' : 'Create Gig'}
          </button>
        </form>
      </div>
    </div>
  );
}