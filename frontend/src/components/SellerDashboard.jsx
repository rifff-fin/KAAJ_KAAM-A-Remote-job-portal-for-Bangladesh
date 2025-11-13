import React, { useEffect, useState } from 'react';
import API from '../api';
import { Link, useNavigate } from 'react-router-dom';

export default function SellerDashboard() {
  const [gigs, setGigs] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user || user.role !== 'seller') {
      navigate('/');
      return;
    }
    const fetchGigs = async () => {
      const res = await API.get('/api/gigs/my');
      setGigs(res.data);
    };
    fetchGigs();
  }, [user, navigate]);

  if (!user || user.role !== 'seller') return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Gigs</h1>
          <Link to="/create-gig" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
            + Create Gig
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map(gig => (
            <div key={gig._id} className="card">
              {gig.image && <img src={gig.image} alt={gig.title} className="w-full h-48 object-cover rounded-md mb-4" />}
              <h3 className="text-xl font-bold text-gray-800">{gig.title}</h3>
              <p className="text-gray-600 mt-1">${gig.price} • {gig.deliveryTime}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}