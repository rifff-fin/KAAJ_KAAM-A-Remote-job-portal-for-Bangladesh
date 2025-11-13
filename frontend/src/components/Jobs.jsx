import React, { useEffect, useState } from 'react';
import API from '../api';
import { Link } from 'react-router-dom';

export default function Jobs() {
  const [gigs, setGigs] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGigs = async () => {
      setLoading(true);
      try {
        const res = await API.get('/api/gigs', {
          params: { search, category: category !== 'all' ? category : undefined }
        });
        setGigs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, [search, category]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Browse Gigs</h1>

        {/* Search & Filter */}
        <div className="card mb-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search gigs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full"
            >
              <option value="all">All Categories</option>
              <option value="web">Web Development</option>
              <option value="design">Graphic Design</option>
              <option value="writing">Writing</option>
              <option value="video">Video Editing</option>
            </select>
          </div>
        </div>

        {/* Gig List */}
        {loading ? (
          <p className="text-center text-gray-600">Loading gigs...</p>
        ) : gigs.length === 0 ? (
          <p className="text-center text-gray-600">No gigs found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map(gig => (
              <div key={gig._id} className="card hover:shadow-lg transition">
                {gig.image ? (
                  <img src={gig.image} alt={gig.title} className="w-full h-48 object-cover rounded-t-md" />
                ) : (
                  <div className="bg-gray-200 h-48 rounded-t-md flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-800">{gig.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{gig.description}</p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-lg font-bold text-blue-600">${gig.price}</span>
                    <span className="text-sm text-gray-500">{gig.deliveryTime}</span>
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    by <strong>{gig.seller?.name || 'Unknown'}</strong>
                  </div>
                  <Link
                    to={`/gig/${gig._id}`}
                    className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full text-center"
                  >
                    View Details
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