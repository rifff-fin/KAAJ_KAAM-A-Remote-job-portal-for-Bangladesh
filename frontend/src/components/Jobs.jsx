// src/pages/Jobs.jsx
import React, { useEffect, useState } from 'react';
import API from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import ApplyJobModal from './ApplyJobModal';
import { Edit, Trash2 } from 'lucide-react';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Fetch jobs
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
  const handleApply = (job) => {
    if (!user || user.role !== 'seller') {
      alert('Only freelancers can apply');
      return;
    }
    setSelectedJob(job);
  };

  const handleApplySuccess = async () => {
    try {
      // Create or get conversation with client
      const response = await API.post('/chat/conversations', {
        participantId: selectedJob.postedBy._id,
        jobId: selectedJob._id
      });

      const conversationId = response.data._id;

      if (window.openMessagePopup) {
        window.openMessagePopup(conversationId, selectedJob.postedBy);
      } else {
        navigate(`/chat/${conversationId}`);
      }

      setSelectedJob(null);
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  // Edit job
  const handleEditJob = (job) => {
    setEditingJob(job);
    setEditForm({
      description: job.description,
      budget: job.budget,
      deadline: job.deadline?.split('T')[0],
      category: job.category,
      skills: job.skills?.join(', ') || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        description: editForm.description,
        budget: editForm.budget,
        deadline: editForm.deadline,
        category: editForm.category,
        skills: editForm.skills.split(',').map(s => s.trim()).filter(s => s)
      };

      const response = await API.put(`/jobs/${editingJob._id}`, updateData, {
        headers: {
          'x-auth-token': token
        }
      });

      alert('Job updated successfully!');
      
      // Update the job in the list
      setJobs(jobs.map(j => j._id === editingJob._id ? response.data.job : j));
      setShowEditModal(false);
      setEditingJob(null);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update job';
      alert(msg);
    } finally {
      setEditLoading(false);
    }
  };

  // Delete job
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await API.delete(`/jobs/${jobId}`, {
        headers: {
          'x-auth-token': token
        }
      });

      alert('Job deleted successfully');
      setJobs(jobs.filter(j => j._id !== jobId));
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete job';
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl mb-4 shadow-lg">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Available Work</h1>
          <p className="text-gray-600 text-lg">Browse jobs posted by clients and find your next project</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-xl mb-8 border border-gray-100">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Search Jobs
              </label>
              <input
                type="text"
                placeholder="Search by title, skills, or client..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl
                           focus:outline-none focus:border-teal-500
                           focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Filter by Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl
                           focus:outline-none focus:border-teal-500
                           focus:ring-2 focus:ring-teal-500/20 transition-all bg-white cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="web">Web Development</option>
                <option value="design">Graphic Design</option>
                <option value="writing">Content Writing</option>
                <option value="video">Video Editing</option>
                <option value="marketing">Digital Marketing</option>
                <option value="mobile">Mobile App</option>
                <option value="data">Data Entry</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-gray-300
                            border-t-emerald-500 animate-spin" />
            <p className="text-gray-600 mt-4">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4">💼</div>
            <h3 className="text-2xl font-bold text-gray-700">No jobs available</h3>
            <p className="text-gray-500 mt-2">Check back later or create a gig!</p>

            {user?.role === 'buyer' && (
              <Link
                to="/post-job"
                className="mt-6 inline-block bg-blue-600 text-white
                           px-6 py-3 rounded-lg font-semibold
                           hover:bg-blue-700 transition"
              >
                Post a Job
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Jobs Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(showAll ? jobs : jobs.slice(0, 9)).map(job => (
              <div
                key={job._id}
                className="bg-white border border-gray-200 rounded-2xl p-6
                           shadow-md transition-all duration-300
                           hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-800">
                    {job.title}
                  </h3>

                  <span
                    className={`text-xs font-semibold uppercase tracking-wide
                                px-2 py-1 rounded-full
                      ${job.status === 'open' ? 'bg-emerald-100 text-emerald-700' : ''}
                      ${job.status === 'in-progress' ? 'bg-amber-100 text-amber-700' : ''}
                      ${job.status === 'completed' ? 'bg-blue-100 text-blue-700' : ''}
                    `}
                  >
                    {job.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed mb-4
                              line-clamp-3">
                  {job.description}
                </p>

                {/* Meta */}
                <div className="flex flex-col gap-2 text-sm text-gray-700 mb-4">
                  <div><strong className="text-gray-900">Budget:</strong> ৳{job.budget}</div>
                  <div><strong className="text-gray-900">Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}</div>
                  <div><strong className="text-gray-900">Client:</strong> {job.postedBy?.name || 'Anonymous'}</div>
                </div>

                {/* Skills */}
                {job.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="bg-indigo-100 text-indigo-700
                                   text-xs font-medium px-2 py-1 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 space-y-2">
                  {user?.role === 'buyer' && job.postedBy._id === user.id ? (
                    <>
                      <Link
                        to="/client-dashboard"
                        className="block text-center bg-indigo-500
                                   text-white py-3 rounded-lg font-semibold
                                   hover:bg-indigo-600 transition"
                      >
                        View Applications ({job.interests?.length || 0})
                      </Link>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleEditJob(job)}
                          className="flex items-center justify-center gap-2 bg-blue-500
                                     text-white py-2 rounded-lg font-semibold
                                     hover:bg-blue-600 transition"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job._id)}
                          className="flex items-center justify-center gap-2 bg-red-500
                                     text-white py-2 rounded-lg font-semibold
                                     hover:bg-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  ) : user?.role === 'seller' ? (
                    <button
                      onClick={() => handleApply(job)}
                      disabled={selectedJob?._id === job._id}
                      className={`w-full py-3 rounded-lg font-semibold text-white
                        transition
                        ${selectedJob?._id === job._id
                          ? 'bg-emerald-300 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600'
                        }`}
                    >
                      {selectedJob?._id === job._id ? 'Opening form...' : 'Apply Now'}
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Login as freelancer to apply
                    </span>
                  )}
                </div>
              </div>
              ))}
            </div>

            {/* View More Button */}
            {!showAll && jobs.length > 9 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAll(true)}
                  className="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition font-semibold"
                >
                  View More ({jobs.length - 9} more jobs)
                </button>
              </div>
            )}

            {showAll && jobs.length > 9 && (
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

        {/* Apply Modal */}
        {selectedJob && (
          <ApplyJobModal 
            job={selectedJob} 
            onClose={() => setSelectedJob(null)}
            onSuccess={handleApplySuccess}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && editingJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-900">Edit Job</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> You can edit your job once per week. Title cannot be changed.
                  </p>
                </div>

                <form onSubmit={handleUpdateJob} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title (Cannot be changed)</label>
                    <input
                      type="text"
                      value={editingJob.title}
                      disabled
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget (BDT)</label>
                    <input
                      type="number"
                      value={editForm.budget}
                      onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                    <input
                      type="date"
                      value={editForm.deadline}
                      onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="web">Web Development</option>
                      <option value="design">Graphic Design</option>
                      <option value="writing">Content Writing</option>
                      <option value="video">Video Editing</option>
                      <option value="marketing">Digital Marketing</option>
                      <option value="mobile">Mobile App</option>
                      <option value="data">Data Entry</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma-separated)</label>
                    <input
                      type="text"
                      value={editForm.skills}
                      onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                      placeholder="React, Node.js, MongoDB"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editLoading ? 'Updating...' : 'Update Job'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
