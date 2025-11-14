// src/pages/Jobs.jsx
import React, { useEffect, useState } from 'react';
import API from '../api';
import { Link, useNavigate } from 'react-router-dom';
import './Jobs.css';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Fetch jobs with filters
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const params = {};
        if (search) params.search = search;
        if (category !== 'all') params.category = category;

        const res = await API.get('/jobs', { params });
        setJobs(res.data);
      } catch (err) {
        console.error('Fetch jobs error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [search, category]);

  // Apply to job
  const handleApply = async (jobId, clientId) => {
    if (!user || user.role !== 'seller') {
      alert('Only freelancers can apply');
      return;
    }

    setApplying(jobId);
    const message = prompt('Write your proposal (cover letter):');
    if (!message?.trim()) {
      setApplying(null);
      return;
    }

    try {
      await API.post(`/jobs/${jobId}/interest`, { message });
      alert('Applied successfully! Opening chat...');
      navigate(`/chat?with=${clientId}`);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to apply');
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">Available Work</h1>
          <p className="text-gray-600 mt-2">Browse jobs posted by clients</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search by title, skills, or client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="jobs-search"
            />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="jobs-select"
            >
              <option value="all">All Categories</option>
              <option value="web">Web Development</option>
              <option value="design">Graphic Design</option>
              <option value="writing">Content Writing</option>
              <option value="video">Video Editing</option>
              <option value="marketing">Digital Marketing</option>
              <option value="mobile">Mobile App</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20">
            <div className="jobs-spinner"></div>
            <p className="text-gray-600 mt-4">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4">Briefcase</div>
            <h3 className="text-2xl font-bold text-gray-700">No jobs available</h3>
            <p className="text-gray-500 mt-2">Check back later or create a gig!</p>
            {user?.role === 'buyer' && (
              <Link
                to="/post-job"
                className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Post a Job
              </Link>
            )}
          </div>
        ) : (
          /* Jobs Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map(job => (
              <div key={job._id} className="jobs-card">
                <div className="jobs-header">
                  <h3 className="jobs-title">{job.title}</h3>
                  <span className={`jobs-status ${job.status}`}>
                    {job.status}
                  </span>
                </div>

                <p className="jobs-description">{job.description}</p>

                <div className="jobs-meta">
                  <div><strong>Budget:</strong> ৳{job.budget}</div>
                  <div><strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}</div>
                  <div><strong>Client:</strong> {job.postedBy?.name || 'Anonymous'}</div>
                </div>

                {job.skills?.length > 0 && (
                  <div className="jobs-skills">
                    {job.skills.map((skill, i) => (
                      <span key={i} className="jobs-skill">{skill}</span>
                    ))}
                  </div>
                )}

                <div className="jobs-actions">
                  {user?.role === 'seller' ? (
                    <button
                      onClick={() => handleApply(job._id, job.postedBy._id)}
                      disabled={applying === job._id}
                      className={`jobs-apply ${applying === job._id ? 'applying' : ''}`}
                    >
                      {applying === job._id ? 'Applying...' : 'Apply Now'}
                    </button>
                  ) : user?.role === 'buyer' && job.postedBy._id === user.id ? (
                    <Link to="/client-dashboard" className="jobs-view-apps">
                      View Applications ({job.interests?.length || 0})
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-500">Login as freelancer to apply</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}