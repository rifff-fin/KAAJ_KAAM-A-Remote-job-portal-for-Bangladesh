import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  User, Mail, MapPin, Phone, Globe, DollarSign, Star, 
  Award, TrendingUp, Package, CheckCircle, XCircle, Edit2,
  Camera, Briefcase, Clock, Calendar, MessageSquare, Shield,
  Languages, GraduationCap, Building2, Flag, Ban, Share2,
  BadgeCheck, Zap, ThumbsUp, AlertTriangle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import API from '../api';
import StatCard from './StatCard';
import ReviewCard from './ReviewCard';
import { formatCurrency, formatDate, formatRating } from '../utils/formatters';

export default function Profile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [gigs, setGigs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    if (!stored) return navigate('/login');

    setUser(stored);
    
    const viewingOwnProfile = !userId || userId === stored.id;
    setIsOwnProfile(viewingOwnProfile);
    
    if (viewingOwnProfile) {
      setProfileUser(stored);
      fetchData(stored);
      fetchProfileData();
    } else {
      fetchOtherUserProfile(userId);
    }
  }, [navigate, userId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && profileUser) {
        fetchData(profileUser);
        if (isOwnProfile) {
          fetchProfileData();
        } else {
          fetchOtherUserProfile(profileUser._id || profileUser.id);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [profileUser, isOwnProfile]);

  const fetchProfileData = async () => {
    try {
      const res = await API.get('/profile/me');
      if (res.data.success && res.data.user) {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        setProfileUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchOtherUserProfile = async (otherUserId) => {
    setLoading(true);
    try {
      const res = await API.get(`/profile/${otherUserId}`);
      if (res.data.success && res.data.user) {
        setProfileUser(res.data.user);
        
        // Check if current user is following this profile
        if (user) {
          const isCurrentlyFollowing = user.following?.some(
            id => id === otherUserId || id._id === otherUserId || id.toString() === otherUserId.toString()
          ) || false;
          setIsFollowing(isCurrentlyFollowing);
        }
        
        fetchData(res.data.user);
      }
    } catch (err) {
      console.error('Error fetching other user profile:', err);
      alert('Failed to load profile');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (targetUser) => {
    setLoading(true);
    try {
      const userId = targetUser.id || targetUser._id;
      
      if (targetUser.role === 'seller') {
        const gigsRes = await API.get(`/gigs?sellerId=${userId}`);
        setGigs(gigsRes.data.gigs || gigsRes.data);
      } else {
        const jobsRes = await API.get('/jobs');
        const allJobs = Array.isArray(jobsRes.data) ? jobsRes.data : jobsRes.data.jobs || [];
        setJobs(allJobs.filter(j => j.postedBy?._id === userId || j.postedBy === userId));
      }
      
      try {
        const reviewsRes = await API.get(`/reviews/user/${userId}`);
        setReviews(reviewsRes.data.reviews || []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setReviews([]);
      }

      // Fetch user's posts
      try {
        const postsRes = await API.get(`/feed/user/${userId}`);
        setPosts(postsRes.data.posts || []);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setPosts([]);
      }

      // Check if current user follows this profile
      if (!isOwnProfile && user) {
        const userId = targetUser.id || targetUser._id;
        const isCurrentlyFollowing = user.following?.some(
          id => id === userId || id._id === userId || id.toString() === userId.toString()
        ) || false;
        setIsFollowing(isCurrentlyFollowing);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async () => {
    try {
      const res = await API.post('/chat/conversations', {
        participantId: profileUser._id || profileUser.id
      });
      navigate(`/chat/${res.data._id}`);
    } catch (err) {
      console.error('Error creating conversation:', err);
      alert('Failed to start conversation');
    }
  };

  const handleBlockUser = async () => {
    if (!confirm('Are you sure you want to block this user?')) return;
    try {
      await API.post('/profile/block', { targetUserId: profileUser._id || profileUser.id });
      alert('User blocked successfully');
      navigate('/');
    } catch (err) {
      console.error('Error blocking user:', err);
      alert(err.response?.data?.message || 'Failed to block user');
    }
  };

  const handleFollowToggle = async () => {
    const targetUserId = profileUser._id || profileUser.id;
    const currentUserId = user.id || user._id;
    
    // Optimistic update - update UI immediately
    const wasFollowing = isFollowing;
    setIsFollowing(!isFollowing);
    
    // Update follower count immediately
    const updatedProfileUser = { ...profileUser };
    if (!wasFollowing) {
      // Following
      if (!updatedProfileUser.followers) updatedProfileUser.followers = [];
      updatedProfileUser.followers.push(currentUserId);
    } else {
      // Unfollowing
      if (updatedProfileUser.followers) {
        updatedProfileUser.followers = updatedProfileUser.followers.filter(
          id => id !== currentUserId && id._id !== currentUserId
        );
      }
    }
    setProfileUser(updatedProfileUser);
    
    // Update local user data immediately
    const updatedUser = { ...user };
    if (!wasFollowing) {
      if (!updatedUser.following) updatedUser.following = [];
      updatedUser.following.push(targetUserId);
    } else {
      if (updatedUser.following) {
        updatedUser.following = updatedUser.following.filter(id => id !== targetUserId);
      }
    }
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    try {
      // Make API call in background
      if (wasFollowing) {
        await API.post(`/profile/unfollow/${targetUserId}`);
      } else {
        await API.post(`/profile/follow/${targetUserId}`);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      
      // Don't revert if error is "already following/unfollowing" - state is correct
      const errorMsg = err.response?.data?.message || '';
      if (errorMsg.includes('already following') || errorMsg.includes('not following')) {
        // State is already correct, just return
        return;
      }
      
      // Revert on other errors
      setIsFollowing(wasFollowing);
      setProfileUser(profileUser);
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      
      alert(err.response?.data?.message || 'Failed to update follow status');
    }
  };

  const handleReportUser = async () => {
    if (!reportReason.trim() || reportReason.trim().length < 10) {
      alert('Please provide a detailed reason (at least 10 characters)');
      return;
    }
    try {
      await API.post('/profile/report', {
        targetUserId: profileUser._id || profileUser.id,
        reason: reportReason.trim()
      });
      alert('User reported successfully. Our team will review this report.');
      setShowReportModal(false);
      setReportReason('');
    } catch (err) {
      console.error('Error reporting user:', err);
      alert(err.response?.data?.message || 'Failed to report user');
    }
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${profileUser._id || profileUser.id}`;
    navigator.clipboard.writeText(profileUrl);
    alert('Profile link copied to clipboard!');
    setShowShareModal(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      if (form.avatar) {
        const avatarData = new FormData();
        avatarData.append('avatar', form.avatar);
        
        try {
          const avatarRes = await API.put('/profile/avatar', avatarData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (avatarRes.data.success) {
            console.log('Avatar updated successfully');
          }
        } catch (err) {
          console.error('Avatar upload error:', err);
          alert('Failed to upload avatar: ' + (err.response?.data?.message || err.message));
        }
      }

      const profileData = {
        name: form.name || user.name,
        bio: form.bio !== undefined ? form.bio : user.profile?.bio,
        location: form.location !== undefined ? form.location : user.profile?.location,
        phone: form.phone !== undefined ? form.phone : user.profile?.phone,
        website: form.website !== undefined ? form.website : user.profile?.website
      };

      if (user.role === 'seller') {
        if (form.skills !== undefined) {
          profileData.skills = typeof form.skills === 'string' 
            ? form.skills.split(',').map(s => s.trim()).filter(s => s)
            : form.skills;
        } else if (user.profile?.skills) {
          profileData.skills = user.profile.skills;
        }
        
        if (form.hourlyRate !== undefined) {
          profileData.hourlyRate = parseFloat(form.hourlyRate) || 0;
        } else if (user.profile?.hourlyRate) {
          profileData.hourlyRate = user.profile.hourlyRate;
        }

        if (form.availability) profileData.availability = form.availability;
        if (form.languages) profileData.languages = form.languages;
        if (form.experience) profileData.experience = form.experience;
        if (form.education) profileData.education = form.education;
        if (form.responseTime) profileData.responseTime = form.responseTime;
      } else {
        if (form.companyName !== undefined) profileData.companyName = form.companyName;
        if (form.industry !== undefined) profileData.industry = form.industry;
        if (form.projectPreferences) profileData.projectPreferences = form.projectPreferences;
      }

      const endpoint = user.role === 'seller' ? '/profile/seller' : '/profile/buyer';
      const res = await API.put(endpoint, profileData);
      
      if (res.data.success) {
        const profileRes = await API.get('/profile/me');
        if (profileRes.data.success && profileRes.data.user) {
          const updatedUser = profileRes.data.user;
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          setProfileUser(updatedUser);
        }
        
        setEditMode(false);
        setForm({});
        alert('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setUploading(false);
    }
  };

  const getMemberSince = () => {
    if (!profileUser?.createdAt) return 'N/A';
    const date = new Date(profileUser.createdAt);
    return date.getFullYear();
  };

  const getLastActive = () => {
    if (!profileUser?.lastActive) return 'Recently';
    const now = new Date();
    const lastActive = new Date(profileUser.lastActive);
    const diffMs = now - lastActive;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    if (diffDays < 7) return `Active ${diffDays}d ago`;
    return 'Active weeks ago';
  };

  const getBadgeIcon = (badgeType) => {
    switch (badgeType) {
      case 'top_rated': return <Award className="w-4 h-4" />;
      case 'on_time_delivery': return <CheckCircle className="w-4 h-4" />;
      case 'great_communicator': return <MessageSquare className="w-4 h-4" />;
      case 'payment_verified': return <BadgeCheck className="w-4 h-4" />;
      case 'fast_responder': return <Zap className="w-4 h-4" />;
      case 'repeat_client': return <ThumbsUp className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getBadgeName = (badgeType) => {
    return badgeType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const filteredReviews = reviews.filter(review => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'positive') return review.rating >= 4;
    if (reviewFilter === 'critical') return review.rating < 4;
    return true;
  });

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
          <div className="h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative">
            <div className="absolute inset-0 bg-black opacity-20"></div>
          </div>
          
          <div className="relative px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-20">
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                <div className="relative group">
                  <img
                    src={profileUser?.profile?.avatar || `https://ui-avatars.com/api/?name=${profileUser?.name}&background=3b82f6&color=fff&size=128`}
                    alt={profileUser?.name}
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl"
                  />
                  {editMode && isOwnProfile && (
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
                
                <div className="mb-4 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      <Link to={`/profile/${profileUser?.id || profileUser?._id}`} className="hover:text-blue-600 transition">
                        {profileUser?.name}
                      </Link>
                    </h1>
                    {profileUser?.isVerified && (
                      <BadgeCheck className="w-6 h-6 text-blue-600" title="Verified Email" />
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profileUser?.profile?.location || 'Bangladesh'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Member since {getMemberSince()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {getLastActive()}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-gray-900">
                      {profileUser?.followers?.length || 0} Followers
                    </span>
                    <span className="flex items-center gap-1 font-medium text-gray-900">
                      {profileUser?.following?.length || 0} Following
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {profileUser?.role === 'seller' ? 'Freelancer' : 'Client'}
                    </span>
                  </div>
                  
                  {profileUser?.role === 'seller' && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.round(profileUser.rating?.average || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-gray-900">
                        {formatRating(profileUser.rating?.average || 0)}
                      </span>
                      <span className="text-gray-500">({profileUser.rating?.count || 0} reviews)</span>
                    </div>
                  )}

                  {/* Badges */}
                  {profileUser?.badges && profileUser.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {profileUser.badges.map((badge, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium"
                          title={getBadgeName(badge.type)}
                        >
                          {getBadgeIcon(badge.type)}
                          <span>{getBadgeName(badge.type)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 flex-wrap">
                {isOwnProfile ? (
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md hover:shadow-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleFollowToggle}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl transition shadow-md hover:shadow-lg ${
                        isFollowing
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      onClick={handleStartConversation}
                      className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </button>
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                      title="Share Profile"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                      title="Report User"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleBlockUser}
                      className="flex items-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition"
                      title="Block User"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
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
              
              {user.role === 'seller' ? (
                <>
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                    <select
                      defaultValue={user.profile?.availability || 'available'}
                      onChange={e => setForm({ ...form, availability: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="available">Available Now</option>
                      <option value="unavailable">Busy</option>
                      <option value="part-time">Part-time</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Response Time</label>
                    <input
                      type="text"
                      placeholder="e.g., Within 2 hours"
                      defaultValue={user.profile?.responseTime || ''}
                      onChange={e => setForm({ ...form, responseTime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      placeholder="Your company"
                      defaultValue={user.profile?.companyName || ''}
                      onChange={e => setForm({ ...form, companyName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <input
                      type="text"
                      placeholder="e.g., Technology, Healthcare"
                      defaultValue={user.profile?.industry || ''}
                      onChange={e => setForm({ ...form, industry: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
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
              
              {user.role === 'seller' && (
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
              )}
              
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
              {['overview', 'posts', 'portfolio', 'reviews', 'stats'].map((tab) => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    icon={Package}
                    label="Total Orders"
                    value={profileUser.stats?.totalOrders || 0}
                    color="blue"
                  />
                  <StatCard
                    icon={CheckCircle}
                    label="Completed"
                    value={profileUser.stats?.completedOrders || 0}
                    color="green"
                  />
                  <StatCard
                    icon={DollarSign}
                    label={profileUser.role === 'seller' ? 'Total Earnings' : 'Total Spent'}
                    value={formatCurrency(profileUser.stats?.totalEarnings || 0)}
                    color="purple"
                  />
                  <StatCard
                    icon={Star}
                    label="Average Rating"
                    value={formatRating(profileUser.rating?.average || 0)}
                    color="orange"
                  />
                </div>

                {/* About Section */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">About</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {profileUser.profile?.bio || 'No bio added yet.'}
                  </p>
                </div>

                {/* Skills */}
                {profileUser.role === 'seller' && profileUser.profile?.skills && profileUser.profile.skills.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {profileUser.profile.skills.map((skill, idx) => (
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

                {/* Languages */}
                {profileUser.profile?.languages && profileUser.profile.languages.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Languages className="w-5 h-5" />
                      Languages
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {profileUser.profile.languages.map((lang, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">{lang.name}</span>
                          <span className="text-sm text-gray-600 capitalize">{lang.proficiency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {profileUser.profile?.experience && profileUser.profile.experience.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Experience
                    </h3>
                    <div className="space-y-4">
                      {profileUser.profile.experience.map((exp, idx) => (
                        <div key={idx} className="border-l-4 border-blue-600 pl-4 py-2">
                          <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                          <p className="text-sm text-gray-600">{exp.company} • {exp.type === 'freelance' ? 'Freelance' : 'Company'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {exp.startDate && new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {exp.current ? 'Present' : exp.endDate && new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </p>
                          {exp.description && <p className="text-sm text-gray-700 mt-2">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {profileUser.profile?.education && profileUser.profile.education.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Education
                    </h3>
                    <div className="space-y-3">
                      {profileUser.profile.education.map((edu, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                          <p className="text-sm text-gray-600">{edu.institute}</p>
                          {edu.year && <p className="text-xs text-gray-500 mt-1">{edu.year}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Availability (Seller) */}
                {profileUser.role === 'seller' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Work Availability</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${
                          profileUser.profile?.availability === 'available' ? 'bg-green-500' :
                          profileUser.profile?.availability === 'part-time' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="font-medium text-gray-900 capitalize">
                            {profileUser.profile?.availability === 'available' ? 'Available Now' :
                             profileUser.profile?.availability === 'part-time' ? 'Part-time' :
                             'Busy'}
                          </p>
                        </div>
                      </div>
                      {profileUser.profile?.responseTime && (
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">Response Time</p>
                            <p className="font-medium text-gray-900">{profileUser.profile.responseTime}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hiring History (Client) */}
                {profileUser.role === 'buyer' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Hiring History</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Freelancers Hired</p>
                        <p className="text-2xl font-bold text-gray-900">{profileUser.stats?.totalFreelancersHired || 0}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Repeat Hires</p>
                        <p className="text-2xl font-bold text-gray-900">{profileUser.stats?.repeatHires || 0}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Avg Payment Time</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {profileUser.stats?.avgPaymentTime ? `${Math.round(profileUser.stats.avgPaymentTime / 24)}d` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Company Info (Client) */}
                {profileUser.role === 'buyer' && (profileUser.profile?.companyName || profileUser.profile?.industry) && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Company Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {profileUser.profile.companyName && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Company Name</p>
                          <p className="font-medium text-gray-900">{profileUser.profile.companyName}</p>
                        </div>
                      )}
                      {profileUser.profile.industry && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Industry</p>
                          <p className="font-medium text-gray-900">{profileUser.profile.industry}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {profileUser.profile?.phone && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <Phone className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium text-gray-900">{profileUser.profile.phone}</p>
                        </div>
                      </div>
                    )}
                    {profileUser.profile?.website && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Website</p>
                          <a
                            href={profileUser.profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {profileUser.profile.website}
                          </a>
                        </div>
                      </div>
                    )}
                    {profileUser.profile?.hourlyRate && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Hourly Rate</p>
                          <p className="font-medium text-gray-900">
                            {formatCurrency(profileUser.profile.hourlyRate)}/hr
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Posts ({posts.length})</h3>
                
                {posts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No posts yet</p>
                    {isOwnProfile && (
                      <Link to="/feed" className="text-blue-600 hover:underline mt-2 inline-block">
                        Create your first post
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map(post => (
                      <div key={post._id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          {profileUser?.profile?.avatar ? (
                            <img 
                              src={profileUser.profile.avatar} 
                              alt={profileUser.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600 text-sm font-medium">
                                {profileUser?.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm text-gray-900">{profileUser?.name}</h4>
                              <span className="text-xs text-gray-500">
                                {new Date(post.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{post.body}</p>
                            
                            {post.media && post.media.length > 0 && (
                              <div className={`mt-3 ${post.media.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
                                {post.media.map((item, index) => (
                                  <div key={index}>
                                    {item.type === 'video' ? (
                                      <video src={item.url} controls className="w-full rounded" />
                                    ) : (
                                      <img src={item.url} alt="" className="w-full rounded" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                              <span>{post.upvoteCount || 0} likes</span>
                              <span>{post.commentCount || 0} comments</span>
                              <span>{post.share || 0} shares</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <div>
                {profileUser.role === 'seller' ? (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">My Gigs ({gigs.length})</h3>
                      {isOwnProfile && (
                        <Link
                          to="/create-gig"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Create New Gig
                        </Link>
                      )}
                    </div>
                    
                    {gigs.length === 0 ? (
                      <div className="text-center py-12">
                        <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No gigs yet</p>
                        {isOwnProfile && (
                          <Link
                            to="/create-gig"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            Create Your First Gig
                          </Link>
                        )}
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
                      {isOwnProfile && (
                        <Link
                          to="/post-job"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Post New Job
                        </Link>
                      )}
                    </div>
                    
                    {jobs.length === 0 ? (
                      <div className="text-center py-12">
                        <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No jobs posted yet</p>
                        {isOwnProfile && (
                          <Link
                            to="/post-job"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            Post Your First Job
                          </Link>
                        )}
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
                            {isOwnProfile && (
                              <Link
                                to="/client-dashboard"
                                className="text-blue-600 hover:underline font-medium"
                              >
                                View Applications →
                              </Link>
                            )}
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
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Reviews ({reviews.length})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReviewFilter('all')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        reviewFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setReviewFilter('positive')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        reviewFilter === 'positive' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Positive
                    </button>
                    <button
                      onClick={() => setReviewFilter('critical')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        reviewFilter === 'critical' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Critical
                    </button>
                  </div>
                </div>
                
                {filteredReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No reviews {reviewFilter !== 'all' ? `(${reviewFilter})` : ''} yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReviews.map(review => (
                      <ReviewCard key={review._id} review={review} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-8">
                {profileUser.role === 'seller' && (
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
                )}

                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Performance Metrics</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Rating Breakdown</h4>
                      <div className="space-y-3">
                        {profileUser.role === 'seller' ? (
                          <>
                            {['communication', 'quality', 'timeliness', 'professionalism'].map((metric) => (
                              <div key={metric}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="capitalize text-gray-700">{metric}</span>
                                  <span className="font-medium">
                                    {formatRating(profileUser.rating?.breakdown?.[metric] || 0)}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${((profileUser.rating?.breakdown?.[metric] || 0) / 5) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          <>
                            {['clientBehavior', 'clearInstructions', 'communication', 'paymentOnTime'].map((metric) => (
                              <div key={metric}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="capitalize text-gray-700">
                                    {metric === 'clientBehavior' ? 'Client Behavior' :
                                     metric === 'clearInstructions' ? 'Clear Instructions' :
                                     metric === 'paymentOnTime' ? 'Payment On Time' :
                                     metric}
                                  </span>
                                  <span className="font-medium">
                                    {formatRating(profileUser.rating?.breakdown?.[metric] || 0)}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${((profileUser.rating?.breakdown?.[metric] || 0) / 5) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Order Statistics</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Completion Rate</span>
                          <span className="font-bold text-green-600">
                            {profileUser.stats?.totalOrders > 0
                              ? Math.round((profileUser.stats.completedOrders / profileUser.stats.totalOrders) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Total Orders</span>
                          <span className="font-bold text-blue-600">{profileUser.stats?.totalOrders || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Cancelled Orders</span>
                          <span className="font-bold text-red-600">{profileUser.stats?.cancelledOrders || 0}</span>
                        </div>
                        {profileUser.stats?.avgDeliveryTime && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">Avg Delivery Time</span>
                            <span className="font-bold text-gray-900">
                              {Math.round(profileUser.stats.avgDeliveryTime / 24)}d
                            </span>
                          </div>
                        )}
                        {profileUser.stats?.repeatClients !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">Repeat Clients</span>
                            <span className="font-bold text-purple-600">{profileUser.stats.repeatClients}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Share Profile</h3>
            <p className="text-gray-600 mb-6">Copy the link below to share this profile:</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/profile/${profileUser._id || profileUser.id}`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <button
                onClick={handleShareProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Copy
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              Report User
            </h3>
            <p className="text-gray-600 mb-4">Please provide a detailed reason for reporting this user:</p>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="Describe the issue... (minimum 10 characters)"
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReportUser}
                disabled={reportReason.trim().length < 10}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}