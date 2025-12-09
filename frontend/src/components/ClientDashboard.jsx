import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Briefcase, Users, CheckCircle, Clock, MessageSquare, UserCheck, UserX, Eye, TrendingUp } from 'lucide-react';
import API from '../api';
import StatCard from './StatCard';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function ClientDashboard() {
  const [jobs, setJobs] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user || user.role !== 'buyer') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      // Fetch client's jobs
      const jobsRes = await API.get('/jobs/my');
      setJobs(jobsRes.data);
      
      // Fetch all gigs for clients to browse
      const gigsRes = await API.get('/gigs');
      setGigs(gigsRes.data);
      
      // Calculate stats
      const openJobs = jobsRes.data.filter(j => j.status === 'open').length;
      const inProgress = jobsRes.data.filter(j => j.status === 'in-progress').length;
      const completed = jobsRes.data.filter(j => j.status === 'completed').length;
      const totalApplicants = jobsRes.data.reduce((sum, j) => sum + (j.interests?.length || 0), 0);
      
      setStats({
        totalJobs: jobsRes.data.length,
        totalGigs: gigsRes.data.length,
        openJobs,
        inProgress,
        completed,
        totalApplicants
      });
    } catch (err) {
      console.error(err);
    }
  };

  const hire = async (jobId, freelancerId) => {
    try {
      await API.post(`/jobs/${jobId}/hire`, { freelancerId });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to hire');
    }
  };

  const unhire = async (jobId) => {
    try {
      await API.post(`/jobs/${jobId}/unhire`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unhire');
    }
  };

  const openChat = (freelancerId) => {
    window.location.href = `/chat?with=${freelancerId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Client Dashboard</h1>
            <p className="text-gray-600">Browse gigs and manage your job postings</p>
          </div>
          <Link
            to="/post-job"
            className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Post New Job
          </Link>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <StatCard
              icon={Briefcase}
              label="Available Gigs"
              value={stats.totalGigs}
              color="blue"
            />
            <StatCard
              icon={Briefcase}
              label="My Jobs"
              value={stats.totalJobs}
              color="purple"
            />
            <StatCard
              icon={Clock}
              label="Open Jobs"
              value={stats.openJobs}
              color="green"
            />
            <StatCard
              icon={Users}
              label="In Progress"
              value={stats.inProgress}
              color="orange"
            />
            <StatCard
              icon={CheckCircle}
              label="Completed"
              value={stats.completed}
              color="teal"
            />
            <StatCard
              icon={Users}
              label="Total Applicants"
              value={stats.totalApplicants}
              color="indigo"
            />
          </div>
        )}

        {/* Available Gigs Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Available Gigs</h2>
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
          {gigs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Briefcase className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Gigs Available</h3>
              <p className="text-gray-600">Check back later for new services</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gigs.slice(0, 6).map(gig => (
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
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {gig.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {gig.stats?.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {gig.stats?.orders || 0}
                      </span>
                    </div>
                    
                    <Link
                      to={`/gig/${gig._id}`}
                      className="block text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Jobs Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">My Job Posts</h2>
          {jobs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Briefcase className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Jobs Posted Yet</h3>
            <p className="text-gray-600 mb-6">Post your first job to find talented freelancers</p>
            <Link
              to="/post-job"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Post Your First Job
            </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {jobs.map(job => (
              <div key={job._id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                
                {/* Job Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          Budget: {formatCurrency(job.budget)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Deadline: {formatDate(job.deadline)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {job.interests?.length || 0} Applicants
                        </span>
                      </div>
                    </div>
                    
                    <span className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                      job.status === 'open' ? 'bg-green-100 text-green-700' :
                      job.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      job.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>

                {/* Applicants */}
                <div className="p-6">
                  {job.interests?.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No applicants yet</p>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg text-gray-900 mb-4">
                        Applicants ({job.interests?.length || 0})
                      </h4>
                      
                      {job.interests?.map(interest => (
                        <div
                          key={interest.freelancer._id}
                          className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                        >
                          <div className="flex items-center gap-4">
                            {interest.freelancer.profile?.avatar ? (
                              <img
                                src={interest.freelancer.profile.avatar}
                                alt={interest.freelancer.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                {interest.freelancer.name?.charAt(0) || 'U'}
                              </div>
                            )}
                            
                            <div>
                              <p className="font-semibold text-gray-900">
                                {interest.freelancer.profile?.name || interest.freelancer.name || 'Freelancer'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {interest.freelancer.profile?.skills?.join(', ') || 'No skills listed'}
                              </p>
                              {interest.freelancer.rating?.average > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-yellow-500">★</span>
                                  <span className="text-sm font-medium text-gray-700">
                                    {interest.freelancer.rating.average.toFixed(1)}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    ({interest.freelancer.rating.count} reviews)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openChat(interest.freelancer._id)}
                              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Message
                            </button>

                            {!job.hiredFreelancer && (
                              <button
                                onClick={() => hire(job._id, interest.freelancer._id)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                              >
                                <UserCheck className="w-4 h-4" />
                                Hire
                              </button>
                            )}

                            {job.hiredFreelancer === interest.freelancer._id && (
                              <button
                                onClick={() => unhire(job._id)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                              >
                                <UserX className="w-4 h-4" />
                                Unhire
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}