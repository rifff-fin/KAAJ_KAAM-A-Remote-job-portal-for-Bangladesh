// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import './Profile.css';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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
      if (stored.role === 'seller') {
        const [gigsRes] = await Promise.all([
          API.get(`/gigs?userId=${stored.id}`)
        ]);
        setGigs(gigsRes.data);
      } else {
        const jobsRes = await API.get('/jobs');
        setJobs(jobsRes.data.filter(j => j.postedBy?._id === stored.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUploading(true);
    const data = new FormData();
    data.append('name', form.name || user.name);
    data.append('bio', form.bio || '');
    data.append('skills', form.skills || '');
    if (form.avatar) data.append('avatar', form.avatar);

    try {
      const res = await API.put('/auth/profile', data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
      setEditMode(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;
  if (loading) return <div className="profile-loading">Loading...</div>;

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* Header */}
        <div className="profile-header">
          <div className="avatar-wrapper">
            <img
              src={user.profile?.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=3b82f6&color=fff`}
              alt={user.name}
              className="profile-avatar-img"
            />
            {editMode && (
              <label className="avatar-upload">
                Change
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setForm({ ...form, avatar: e.target.files[0] })}
                />
              </label>
            )}
          </div>
          <div className="profile-info">
            <h1>{user.name}</h1>
            <p className="role">{user.role === 'seller' ? 'Freelancer' : 'Client'}</p>
            <p className="email">{user.email}</p>
          </div>
          <button onClick={() => setEditMode(!editMode)} className="btn-edit">
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Edit Form */}
        {editMode && (
          <form onSubmit={handleUpdate} className="edit-form">
            <input
              type="text"
              placeholder="Display Name"
              defaultValue={user.profile?.name || user.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <textarea
              placeholder="Bio (optional)"
              defaultValue={user.profile?.bio || ''}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              rows="3"
            />
            <input
              type="text"
              placeholder="Skills (comma separated)"
              defaultValue={user.profile?.skills?.join(', ') || ''}
              onChange={e => setForm({ ...form, skills: e.target.value })}
            />
            <div className="form-actions">
              <button type="submit" disabled={uploading} className="btn-save">
                {uploading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Seller: Gigs */}
        {user.role === 'seller' && (
          <div className="section">
            <h2>My Gigs ({gigs.length})</h2>
            {gigs.length === 0 ? (
              <p className="empty">No gigs yet. <Link to="/create-gig">Create one!</Link></p>
            ) : (
              <div className="grid">
                {gigs.map(gig => (
                  <div key={gig._id} className="card">
                    <img src={gig.image || '/placeholder.png'} alt="" />
                    <h3>{gig.title}</h3>
                    <p>৳{gig.price}</p>
                    <Link to={`/gig/${gig._id}`}>View</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Buyer: Jobs */}
        {user.role === 'buyer' && (
          <div className="section">
            <h2>Jobs Posted ({jobs.length})</h2>
            {jobs.length === 0 ? (
              <p className="empty">No jobs posted. <Link to="/post-job">Post one!</Link></p>
            ) : (
              <div className="list">
                {jobs.map(job => (
                  <div key={job._id} className="job-item">
                    <h4>{job.title}</h4>
                    <p>Budget: ৳{job.budget} • {job.status}</p>
                    <Link to="/client-dashboard">View Applications</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Common Links */}
        <div className="section">
          <h2>Settings</h2>
          <div className="links">
            <Link to="/chat">Messages</Link>
            <button onClick={() => alert('Coming soon')}>Notifications</button>
            <button onClick={() => alert('Coming soon')}>Payment Methods</button>
          </div>
        </div>
      </div>
    </div>
  );
}