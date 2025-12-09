import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Briefcase, TrendingUp, DollarSign, Star, Eye, Edit } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import API from '../api';
import StatCard from './StatCard';
import { formatCurrency } from '../utils/formatters';

export default function SellerDashboard() {
  const [gigs, setGigs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user || user.role !== 'seller') {
      navigate('/');
      return;
    }

    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      // Fetch gigs
      const gigsRes = await API.get('/gigs/my');
      setGigs(gigsRes.data);
      
      // Fetch all jobs for freelancers
      const jobsRes = await API.get('/jobs');
      setJobs(jobsRes.data);
      
      // Calculate stats
      const totalViews = gigsRes.data.reduce((sum, g) => sum + (g.stats?.views || 0), 0);
      const totalOrders = gigsRes.data.reduce((sum, g) => sum + (g.stats?.orders || 0), 0);
      setStats({
        totalGigs: gigsRes.data.length,
        totalJobs: jobsRes.data.length,
        totalViews,
        totalOrders,
        avgRating: user.rating?.average || 0
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Mock data for chart
  const chartData = [
    { name: 'Mon', orders: 4 },
    { name: 'Tue', orders: 3 },
    { name: 'Wed', orders: 7 },
    { name: 'Thu', orders: 5 },
    { name: 'Fri', orders: 8 },
    { name: 'Sat', orders: 6 },
    { name: 'Sun', orders: 9 },
  ];

  if (!user || user.role !== 'seller') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Freelancer Dashboard</h1>
            <p className="text-gray-600">Manage your gigs and browse available jobs</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Link
              to="/create-gig"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Gig
            </Link>
            <Link
              to="/jobs"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition font-medium"
            >
              <Briefcase className="w-5 h-5" />
              Browse Jobs
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatCard
              icon={Briefcase}
              label="My Gigs"
              value={stats.totalGigs}
              color="blue"
            />
            <StatCard
              icon={Briefcase}
              label="Available Jobs"
              value={stats.totalJobs}
              color="green"
            />
            <StatCard
              icon={Eye}
              label="Total Views"
              value={stats.totalViews}
              color="purple"
            />
            <StatCard
              icon={TrendingUp}
              label="Total Orders"
              value={stats.totalOrders}
              color="orange"
            />
            <StatCard
              icon={Star}
              label="Average Rating"
              value={stats.avgRating.toFixed(1)}
              color="indigo"
            />
          </div>
        )}

        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Orders This Week</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* My Gigs Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">My Gigs</h2>
          {gigs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Briefcase className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Gigs Yet</h3>
              <p className="text-gray-600 mb-6">Create your first gig to start earning</p>
              <Link
                to="/create-gig"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Your First Gig
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gigs.map(gig => (
                <div
                  key={gig._id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group"
                >
                  {gig.thumbnail || gig.images?.[0] ? (
                    <div className="relative overflow-hidden">
                      <img
                        src={gig.thumbnail || gig.images[0]}
                        alt={gig.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-900 shadow-md">
                        {formatCurrency(gig.basePrice)}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 h-48 flex items-center justify-center">
                      <Briefcase className="w-12 h-12 text-white" />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {gig.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {gig.stats?.views || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {gig.stats?.orders || 0} orders
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link
                        to={`/gig/${gig._id}`}
                        className="flex-1 text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        View
                      </Link>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Jobs Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Available Jobs</h2>
            <Link
              to="/jobs"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
          {jobs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Briefcase className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Jobs Available</h3>
              <p className="text-gray-600">Check back later for new opportunities</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.slice(0, 6).map(job => (
                <div
                  key={job._id}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {job.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {job.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(job.budget)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      job.status === 'open' ? 'bg-green-100 text-green-700' :
                      job.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  
                  <Link
                    to="/jobs"
                    className="block text-center py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}