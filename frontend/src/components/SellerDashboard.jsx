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

    API.get('/gigs/my')
      .then(res => setGigs(res.data))
      .catch(console.error);
  }, [user, navigate]);

  if (!user || user.role !== 'seller') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">My Gigs</h1>
          <Link to="/create-gig" className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition text-lg font-medium">
            + Create New Gig
          </Link>
        </div>

        {gigs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">You haven't created any gigs yet.</p>
            <Link to="/create-gig" className="mt-4 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              Create Your First Gig
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gigs.map(gig => (
              <div key={gig._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
                {gig.image ? (
                  <img src={gig.image} alt={gig.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="bg-gray-200 h-48 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800">{gig.title}</h3>
                  <p className="text-gray-600 mt-1">৳{gig.price} • {gig.deliveryTime}</p>
                  <Link
                    to={`/gig/${gig._id}`}
                    className="mt-4 block text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    View Gig
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}