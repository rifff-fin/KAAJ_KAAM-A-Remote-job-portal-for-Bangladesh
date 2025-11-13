import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'buyer';

  React.useEffect(() => {
    setForm(prev => ({ ...prev, role: initialRole }));
  }, [initialRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/api/auth/signup', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Join KAAJ KAAM today</p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setForm({ ...form, role: 'buyer' })}
            className={`flex-1 p-4 rounded-lg border ${form.role === 'buyer' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
          >
            <strong>Hire Talent</strong>
            <p className="text-sm text-gray-600">Post jobs & find freelancers</p>
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, role: 'seller' })}
            className={`flex-1 p-4 rounded-lg border ${form.role === 'seller' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
          >
            <strong>Work as Freelancer</strong>
            <p className="text-sm text-gray-600">Offer services & earn</p>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="text" placeholder="Full Name" className="input-field" onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input type="email" placeholder="Email Address" className="input-field" onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input type="password" placeholder="Password" className="input-field" onChange={e => setForm({ ...form, password: e.target.value })} required />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-medium hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}