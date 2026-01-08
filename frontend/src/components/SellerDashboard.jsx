import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Briefcase, TrendingUp, DollarSign, Star, MousePointerClick, Edit, Trash2, Package, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import API from '../api';
import StatCard from './StatCard';
import ApplyJobModal from './ApplyJobModal';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function SellerDashboard() {
  const [gigs, setGigs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGig, setEditingGig] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
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
      
      // Fetch orders
      const ordersRes = await API.get('/orders', { params: { role: 'seller' } });
      const sellerOrders = ordersRes.data.orders || [];
      setOrders(sellerOrders);
      
      // Calculate stats
      const totalViews = gigsRes.data.reduce((sum, g) => sum + (g.stats?.views || 0), 0);
      const totalOrders = gigsRes.data.reduce((sum, g) => sum + (g.stats?.orders || 0), 0);
      setStats({
        totalGigs: gigsRes.data.length,
        totalJobs: jobsRes.data.length,
        totalViews,
        totalOrders,
        avgRating: user.rating?.average || 0,
        pendingOrders: sellerOrders.filter(o => o.status === 'pending').length,
        activeOrders: sellerOrders.filter(o => o.status === 'active').length,
        completedOrders: sellerOrders.filter(o => o.status === 'completed').length
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyJob = (job) => {
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const handleEditGig = (gig) => {
    setEditingGig(gig);
    setEditForm({
      description: gig.description,
      price: gig.basePrice,
      deliveryTime: gig.deliveryDays,
      image: null
    });
    setShowEditModal(true);
  };

  const handleUpdateGig = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      const data = new FormData();
      if (editForm.description) data.append('description', editForm.description);
      if (editForm.price) data.append('price', editForm.price);
      if (editForm.deliveryTime) data.append('deliveryTime', editForm.deliveryTime);
      if (editForm.image) data.append('image', editForm.image);

      const token = localStorage.getItem('token');
      const response = await API.put(`/gigs/${editingGig._id}`, data, {
        headers: {
          'x-auth-token': token
        }
      });

      alert('Gig updated successfully!');
      setShowEditModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update gig';
      alert(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteGig = async (gigId) => {
    if (!window.confirm('Are you sure you want to delete this gig? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await API.delete(`/gigs/${gigId}`, {
        headers: {
          'x-auth-token': token
        }
      });

      alert('Gig deleted successfully');
      fetchData(); // Refresh data
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete gig';
      alert(msg);
    }
  };

  const filteredOrders = orderFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === orderFilter);

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
                        <MousePointerClick className="w-4 h-4" />
                        {gig.stats?.views || 0} clicks
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {gig.stats?.orders || 0} orders
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link
                        to={`/gig/${gig._id}`}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-center text-sm font-medium"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleEditGig(gig)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm font-medium flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGig(gig._id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
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
                  
                  <button
                    onClick={() => handleApplyJob(job)}
                    className="w-full text-center py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Apply Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Orders Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">My Orders</h2>
          
          {/* Order Filter Tabs */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex flex-wrap border-b border-gray-200">
              {[
                { key: 'all', label: 'All', icon: Package },
                { key: 'pending', label: 'Pending', icon: Clock },
                { key: 'active', label: 'Active', icon: TrendingUp },
                { key: 'completed', label: 'Completed', icon: CheckCircle },
                { key: 'cancelled', label: 'Cancelled', icon: XCircle }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setOrderFilter(key)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
                    orderFilter === key
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {key !== 'all' && stats && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                      orderFilter === key ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {key === 'pending' ? stats.pendingOrders :
                       key === 'active' ? stats.activeOrders :
                       key === 'completed' ? stats.completedOrders :
                       orders.filter(o => o.status === key).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Orders List */}
            <div className="p-6">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No {orderFilter !== 'all' ? orderFilter : ''} orders
                  </h3>
                  <p className="text-gray-600">
                    {orderFilter === 'all' 
                      ? 'You have no orders yet. Start by creating gigs!'
                      : `You have no ${orderFilter} orders at the moment.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <div
                      key={order._id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">
                            {order.gig?.title || order.job?.title || 'Order'}
                          </h4>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span>Client: {order.buyer?.name}</span>
                            <span>Amount: {formatCurrency(order.totalAmount)}</span>
                            <span>Due: {formatDate(order.dueDate)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'active' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'completed' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {order.status}
                          </span>
                          <Link
                            to="/orders"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Apply Job Modal */}
        {showApplyModal && selectedJob && (
          <ApplyJobModal
            job={selectedJob}
            onClose={() => {
              setShowApplyModal(false);
              setSelectedJob(null);
            }}
            onSuccess={fetchData}
          />
        )}

        {/* Edit Gig Modal */}
        {showEditModal && editingGig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Gig</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleUpdateGig} className="p-6 space-y-6">
                {/* Title (Disabled) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (Cannot be changed)
                  </label>
                  <input
                    type="text"
                    value={editingGig.title}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Category (Disabled) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category (Cannot be changed)
                  </label>
                  <input
                    type="text"
                    value={editingGig.category}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={5}
                    placeholder="Describe your gig..."
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Price (BDT)
                  </label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter price"
                    min="1"
                  />
                </div>

                {/* Delivery Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Time (Days)
                  </label>
                  <input
                    type="number"
                    value={editForm.deliveryTime}
                    onChange={(e) => setEditForm({ ...editForm, deliveryTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter delivery time"
                    min="1"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditForm({ ...editForm, image: e.target.files[0] })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50"
                  >
                    {editLoading ? 'Updating...' : 'Update Gig'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}