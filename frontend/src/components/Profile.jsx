import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Mail, MapPin, Phone, Globe, DollarSign, Star, 
  Award, TrendingUp, Package, CheckCircle, XCircle, Edit2,
  Camera, Briefcase, Clock, Calendar
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import API from '../api';
import StatCard from './StatCard';
import ReviewCard from './ReviewCard';
import { formatCurrency, formatDate, formatRating } from '../utils/formatters';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    if (!stored) return navigate('/login');

    setUser(stored);
    fetchData(stored);
  }, [navigate]);

  const fetchData = async (stored) => {
    setLoading(true);
    try {
      // Fetch gigs or jobs
      if (stored.role === 'seller') {
        const gigsRes = await API.get(`/gigs?sellerId=${stored.id}`);
        setGigs(gigsRes.data.gigs || gigsRes.data);
        
        // Fetch reviews
        try {
          const reviewsRes = await API.get(`/reviews/user/${stored.id}`);
          setReviews(reviewsRes.data.reviews || []);
        } catch (err) {
          console.error('Error fetching reviews:', err);
        }
      } else {
        const jobsRes = await API.get('/jobs');
        const allJobs = Array.isArray(jobsRes.data) ? jobsRes.data : jobsRes.data.jobs || [];
        setJobs(allJobs.filter(j => j.postedBy?._id === stored.id || j.postedBy === stored.id));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUploading(true);
    const data = new FormData();
    data.append('name', form.name || user.name);
    data.append('bio', form.bio || user.profile?.bio || '');
    data.append('skills', form.skills || user.profile?.skills?.join(', ') || '');
    data.append('location', form.location || user.profile?.location || '');
    data.append('phone', form.phone || user.profile?.phone || '');
    data.append('website', form.website || user.profile?.website || '');
    data.append('hourlyRate', form.hourlyRate || user.profile?.hourlyRate || 0);
    if (form.avatar) data.append('avatar', form.avatar);

    try {
      const res = await API.put('/auth/profile', data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
      setEditMode(false);
      setForm({});
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setUploading(false);
    }
  };

  // Mock earnings data for chart
  const earningsData = [
    { month: 'Jan', earnings: 12000 },
    { month: 'Feb', earnings: 19000 },
    { month: 'Mar', earnings: 15000 },
    { month: 'Apr', earnings: 22000 },
    { month: 'May', earnings: 28000 },
    { month: 'Jun', earnings: 25000 },
  ];

  if (!user) return null;
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading profile...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative">
            <div className="absolute inset-0 bg-black opacity-20"></div>
          </div>
          
          {/* Profile Info */}
          <div className="relative px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-20">
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                {/* Avatar */}
                <div className="relative group">
                  <img
                    src={user.profile?.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=3b82f6&color=fff&size=128`}
                    alt={user.name}
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl"
                  />
                  {editMode && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-2xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => setForm({ ...form, avatar: e.target.files[0] })}
                      />
                    </label>
                  )}
                </div>
                
                {/* Name and Info */}
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-gray-600">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </span>
                    {user.profile?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {user.profile.location}
                      </span>
                    )}
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {user.role === 'seller' ? 'Freelancer' : 'Client'}
                    </span>
                  </div>
                  
                  {/* Rating */}
                  {user.role === 'seller' && user.rating?.average > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.round(user.rating.average)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-gray-900">
                        {formatRating(user.rating.average)}
                      </span>
                      <span className="text-gray-500">({user.rating.count} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Edit Button */}
              <button
                onClick={() => setEditMode(!editMode)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md hover:shadow-lg"
              >
                <Edit2 className="w-4 h-4" />
                {editMode ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {editMode && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>
            <form onSubmit={handleUpdate} className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  defaultValue={user.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="City, Country"
                  defaultValue={user.profile?.location || ''}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  placeholder="+880 1XXX-XXXXXX"
                  defaultValue={user.profile?.phone || ''}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  defaultValue={user.profile?.website || ''}
                  onChange={e => setForm({ ...form, website: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {user.role === 'seller' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (৳)</label>
                  <input
                    type="number"
                    placeholder="500"
                    defaultValue={user.profile?.hourlyRate || ''}
                    onChange={e => setForm({ ...form, hourlyRate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  placeholder="Tell us about yourself..."
                  defaultValue={user.profile?.bio || ''}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma separated)</label>
                <input
                  type="text"
                  placeholder="React, Node.js, MongoDB"
                  defaultValue={user.profile?.skills?.join(', ') || ''}
                  onChange={e => setForm({ ...form, skills: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {['overview', 'portfolio', 'reviews', 'stats'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-medium capitalize whitespace-nowrap border-b-2 transition ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                {user.role === 'seller' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      icon={Package}
                      label="Total Orders"
                      value={user.stats?.totalOrders || 0}
                      color="blue"
                    />
                    <StatCard
                      icon={CheckCircle}
                      label="Completed"
                      value={user.stats?.completedOrders || 0}
                      color="green"
                    />
                    <StatCard
                      icon={DollarSign}
                      label="Total Earnings"
                      value={formatCurrency(user.stats?.totalEarnings || 0)}
                      color="purple"
                    />
                    <StatCard
                      icon={Star}
                      label="Average Rating"
                      value={formatRating(user.rating?.average || 0)}
                      color="orange"
                    />
                  </div>
                )}

                {/* About Section */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">About</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {user.profile?.bio || 'No bio added yet.'}
                  </p>
                </div>

                {/* Skills */}
                {user.profile?.skills && user.profile.skills.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.profile.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {user.profile?.phone && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <Phone className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium text-gray-900">{user.profile.phone}</p>
                        </div>
                      </div>
                    )}
                    {user.profile?.website && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Website</p>
                          <a
                            href={user.profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {user.profile.website}
                          </a>
                        </div>
                      </div>
                    )}
                    {user.profile?.hourlyRate && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Hourly Rate</p>
                          <p className="font-medium text-gray-900">
                            {formatCurrency(user.profile.hourlyRate)}/hr
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <div>
                {user.role === 'seller' ? (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">My Gigs ({gigs.length})</h3>
                      <Link
                        to="/create-gig"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Create New Gig
                      </Link>
                    </div>
                    
                    {gigs.length === 0 ? (
                      <div className="text-center py-12">
                        <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No gigs yet</p>
                        <Link
                          to="/create-gig"
                          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Create Your First Gig
                        </Link>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gigs.map(gig => (
                          <div key={gig._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition">
                            {gig.image ? (
                              <img src={gig.image} alt={gig.title} className="w-full h-48 object-cover" />
                            ) : (
                              <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <Briefcase className="w-12 h-12 text-white" />
                              </div>
                            )}
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900 mb-2">{gig.title}</h4>
                              <p className="text-blue-600 font-bold mb-3">{formatCurrency(gig.price)}</p>
                              <Link
                                to={`/gig/${gig._id}`}
                                className="block text-center py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium"
                              >
                                View Details
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">Posted Jobs ({jobs.length})</h3>
                      <Link
                        to="/post-job"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Post New Job
                      </Link>
                    </div>
                    
                    {jobs.length === 0 ? (
                      <div className="text-center py-12">
                        <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No jobs posted yet</p>
                        <Link
                          to="/post-job"
                          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Post Your First Job
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {jobs.map(job => (
                          <div key={job._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="text-lg font-semibold text-gray-900">{job.title}</h4>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                job.status === 'open' ? 'bg-green-100 text-green-700' :
                                job.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {formatCurrency(job.budget)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(job.deadline)}
                              </span>
                            </div>
                            <Link
                              to="/client-dashboard"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              View Applications →
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Reviews ({reviews.length})
                </h3>
                
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <ReviewCard key={review._id} review={review} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && user.role === 'seller' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Earnings Overview</h3>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={earningsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="earnings" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Performance Metrics</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Rating Breakdown</h4>
                      <div className="space-y-3">
                        {['communication', 'quality', 'timeliness', 'professionalism'].map((metric) => (
                          <div key={metric}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize text-gray-700">{metric}</span>
                              <span className="font-medium">
                                {formatRating(user.rating?.breakdown?.[metric] || 0)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${((user.rating?.breakdown?.[metric] || 0) / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Order Statistics</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Completion Rate</span>
                          <span className="font-bold text-green-600">
                            {user.stats?.totalOrders > 0
                              ? Math.round((user.stats.completedOrders / user.stats.totalOrders) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Total Orders</span>
                          <span className="font-bold text-blue-600">{user.stats?.totalOrders || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Cancelled Orders</span>
                          <span className="font-bold text-red-600">{user.stats?.cancelledOrders || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}