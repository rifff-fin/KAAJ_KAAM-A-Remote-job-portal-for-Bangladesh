import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Search, Filter, MousePointerClick, TrendingUp, Star, User } from 'lucide-react';
import API from '../api';
import Toast from './Toast';
import { formatCurrency } from '../utils/formatters';

export default function Gigs() {
  const [gigs, setGigs] = useState([]);
  const [filteredGigs, setFilteredGigs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const categories = [
    'all',
    'Web Development',
    'Mobile Development',
    'Graphic Design',
    'Content Writing',
    'Digital Marketing',
    'Video Editing',
    'Data Entry',
    'Translation',
    'Other'
  ];

  useEffect(() => {
    fetchGigs();
  }, []);

  useEffect(() => {
    filterGigs();
  }, [searchTerm, selectedCategory, gigs]);

  const fetchGigs = async () => {
    try {
      setLoading(true);
      const response = await API.get('/gigs');
      setGigs(response.data);
      setFilteredGigs(response.data);
    } catch (err) {
      console.error('Error fetching gigs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterGigs = () => {
    let filtered = [...gigs];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(gig =>
        gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(gig => gig.category === selectedCategory);
    }

    setFilteredGigs(filtered);
  };

  const handleCreateGig = () => {
    if (!user) {
      setToast({ message: 'Please sign in to create a gig', type: 'error' });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    if (user.role !== 'seller') {
      setToast({ message: 'Only sellers can create gigs. Please sign up as a seller.', type: 'error' });
      return;
    }
    navigate('/create-gig');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Gigs</h1>
              <p className="text-gray-600">Discover talented freelancers and their services</p>
            </div>
            {user?.role === 'seller' && (
              <button
                onClick={handleCreateGig}
                className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium"
              >
                <Briefcase className="w-5 h-5" />
                Create Gig
              </button>
            )}
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search gigs by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[200px]"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredGigs.length}</span> gig{filteredGigs.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Gigs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredGigs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Briefcase className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Gigs Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Be the first to create a gig!'}
            </p>
            {user?.role === 'seller' && (
              <button
                onClick={handleCreateGig}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
              >
                Create Your First Gig
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(showAll ? filteredGigs : filteredGigs.slice(0, 12)).map(gig => (
              <div
                key={gig._id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* Gig Image */}
                {gig.thumbnail || gig.images?.[0] ? (
                  <div className="relative overflow-hidden">
                    <img
                      src={gig.thumbnail || gig.images[0]}
                      alt={gig.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 px-3 py-1 bg-white rounded-full text-sm font-bold text-gray-900 shadow-md">
                      {formatCurrency(gig.basePrice)}
                    </div>
                    {gig.category && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium shadow-md">
                        {gig.category}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-blue-500 to-purple-500 h-48 flex items-center justify-center relative">
                    <Briefcase className="w-12 h-12 text-white opacity-50" />
                    <div className="absolute top-3 right-3 px-3 py-1 bg-white rounded-full text-sm font-bold text-gray-900 shadow-md">
                      {formatCurrency(gig.basePrice)}
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  {/* Seller Info */}
                  <div className="flex items-center gap-2 mb-3">
                    {gig.seller?.profile?.avatar ? (
                      <img
                        src={gig.seller.profile.avatar}
                        alt={gig.seller.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {gig.seller?.name || 'Anonymous'}
                      </p>
                      {gig.seller?.profile?.level && (
                        <p className="text-xs text-gray-500">
                          Level {gig.seller.profile.level}
                        </p>
                      )}
                    </div>
                    {gig.seller?.rating?.average > 0 && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-xs font-medium text-gray-700">
                          {gig.seller.rating.average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Gig Title & Description */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                    {gig.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {gig.description}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <MousePointerClick className="w-4 h-4" />
                      {gig.stats?.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {gig.stats?.orders || 0} orders
                    </span>
                    {gig.deliveryDays && (
                      <span className="text-xs">
                        🚀 {gig.deliveryDays} day{gig.deliveryDays !== 1 ? 's' : ''} delivery
                      </span>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="grid grid-cols-1 gap-3">
                    <Link
                      to={`/gig/${gig._id}`}
                      className="text-center py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
              ))}
            </div>

            {/* View More Button */}
            {!showAll && filteredGigs.length > 12 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAll(true)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-semibold"
                >
                  View More ({filteredGigs.length - 12} more gigs)
                </button>
              </div>
            )}

            {showAll && filteredGigs.length > 12 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => {
                    setShowAll(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-8 py-3 bg-gray-600 text-white rounded-xl hover:shadow-lg transition font-semibold"
                >
                  Show Less
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
