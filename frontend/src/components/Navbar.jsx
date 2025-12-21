import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Briefcase, Menu, X, MessageSquare, Phone, Video } from 'lucide-react';
import { socket } from '../socket';
import API from '../api';
import { AUTH_CHANGE_EVENT, getUser, clearAuthData } from '../utils/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [time, setTime] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentConversations, setRecentConversations] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const messagesRef = useRef(null);

  // Load user and listen for auth changes
  useEffect(() => {
    const loadUser = () => {
      const stored = getUser();
      setUser(stored);
    };
    
    loadUser();
    window.addEventListener(AUTH_CHANGE_EVENT, loadUser);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, loadUser);
  }, []);

  // Live BD Time
  useEffect(() => {
    const update = () => {
      const bd = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setTime(bd);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch unread messages count and notifications
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await API.get('/chat/unread-count');
        setUnreadCount(response.data.unreadCount || 0);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    const fetchRecentConversations = async () => {
      try {
        const response = await API.get('/chat/conversations?limit=5');
        setRecentConversations(response.data.conversations || []);
      } catch (err) {
        console.error('Error fetching conversations:', err);
      }
    };

    const fetchNotifications = async () => {
      try {
        const response = await API.get('/notifications?limit=10');
        setNotifications(response.data.notifications || []);
        setNotificationCount(response.data.unreadCount || 0);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchUnreadCount();
    fetchRecentConversations();
    fetchNotifications();

    // Listen for new messages and calls
    socket.connect();
    socket.on('receive_message', () => {
      fetchUnreadCount();
      fetchRecentConversations();
    });

    socket.on('call:incoming', (data) => {
      console.log('Incoming call received in Navbar:', data);
      setIncomingCall(data);
    });

    socket.on('new_notification', () => {
      fetchNotifications();
    });

    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchNotifications();
    }, 30000); // Refresh every 30s
    
    return () => {
      socket.off('receive_message');
      socket.off('call:incoming');
      socket.off('new_notification');
      clearInterval(interval);
    };
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target)) {
        setMessagesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logout = () => {
    clearAuthData();
    setUser(null);
    navigate('/login');
  };

  // Helper to get avatar URL
  const getAvatarUrl = (avatar, name) => {
    if (avatar) {
      if (avatar.startsWith('http')) return avatar;
      return `${API.defaults.baseURL}${avatar}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || user?.name || 'User')}&background=3B82F6&color=fff&bold=true`;
  };

  const handleAcceptCall = async (call) => {
    setIncomingCall(null);
    
    try {
      // Fetch conversation details to get other user info
      const response = await API.get(`/chat/conversations/${call.conversationId}`);
      const otherUser = response.data.participants.find(p => p._id !== user?.id);
      
      // Open chat window with call acceptance
      if (window.openMessagePopup) {
        window.openMessagePopup(call.conversationId, otherUser, call);
      } else {
        // Navigate to chat with call data in state
        navigate(`/chat/${call.conversationId}`, { state: { incomingCall: call } });
      }
    } catch (err) {
      console.error('Error accepting call:', err);
      alert('Failed to accept call. Please try again.');
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      socket.emit('call:reject', { 
        conversationId: incomingCall.conversationId, 
        to: incomingCall.from 
      });
      setIncomingCall(null);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Briefcase className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              KAAJ KAAM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Home
            </Link>
            <Link to="/gigs" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Gigs
            </Link>

            {user?.role === 'seller' && (
              <>
                <Link to="/jobs" className="text-gray-700 hover:text-blue-600 font-medium transition">
                  Find Work
                </Link>
                <Link to="/seller-dashboard" className="text-gray-700 hover:text-blue-600 font-medium transition">
                  My Dashboard
                </Link>
              </>
            )}

            {user?.role === 'buyer' && (
              <>
                <Link to="/post-job" className="text-gray-700 hover:text-blue-600 font-medium transition">
                  Post Job
                </Link>
                <Link to="/client-dashboard" className="text-gray-700 hover:text-blue-600 font-medium transition">
                  My Dashboard
                </Link>
              </>
            )}

            {user && (
              <Link to="/orders" className="text-gray-700 hover:text-blue-600 font-medium transition">
                Orders
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            
            {/* BD Time */}
            {user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">{time} BD</span>
              </div>
            )}

            {user ? (
              <>
                {/* Messages */}
                <div className="relative" ref={messagesRef}>
                  <button
                    onClick={() => setMessagesOpen(!messagesOpen)}
                    className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <MessageSquare className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {messagesOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Messages</h3>
                        <Link
                          to="/messages"
                          onClick={() => setMessagesOpen(false)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View All
                        </Link>
                      </div>
                      {recentConversations.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No conversations yet</p>
                        </div>
                      ) : (
                        recentConversations.map(conv => {
                          const otherUser = conv.participants.find(p => p._id !== user.id);
                          if (!otherUser) return null;
                          const hasUnread = (conv.unreadCount && conv.unreadCount[user.id]) > 0;
                          return (
                            <div
                              key={conv._id}
                              onClick={() => {
                                if (window.openMessagePopup) window.openMessagePopup(conv._id, otherUser);
                                setMessagesOpen(false);
                              }}
                              className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition ${hasUnread ? 'bg-blue-50' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative flex-shrink-0">
                                  <img
                                    src={getAvatarUrl(otherUser?.profile?.avatar, otherUser?.name)}
                                    alt={otherUser?.name}
                                    onError={(e) => e.currentTarget.src = `https://i.pravatar.cc/40?u=${otherUser?._id}`}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                  {hasUnread && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-gray-900 truncate">
                                    {otherUser?.name}
                                  </p>
                                  <p className="text-xs text-gray-600 truncate">
                                    {conv.lastMessage?.text || 'No messages yet'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Bell className="w-5 h-5" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {notificationCount > 0 && (
                          <button
                            onClick={async () => {
                              try {
                                await API.put('/notifications/read/all');
                                setNotificationCount(0);
                                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                              } catch (err) {
                                console.error('Error marking all as read:', err);
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                          <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No notifications</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif._id}
                            onClick={async () => {
                              if (!notif.isRead) {
                                try {
                                  await API.put(`/notifications/${notif._id}/read`);
                                  setNotifications(prev => prev.map(n => 
                                    n._id === notif._id ? { ...n, isRead: true } : n
                                  ));
                                  setNotificationCount(prev => Math.max(0, prev - 1));
                                } catch (err) {
                                  console.error('Error marking as read:', err);
                                }
                              }
                              setNotificationsOpen(false);
                              // Navigate based on notification type
                              if (notif.relatedModel === 'Order') {
                                navigate('/orders');
                              } else if (notif.relatedModel === 'Conversation') {
                                navigate('/messages');
                              } else if (notif.relatedModel === 'Job') {
                                navigate('/jobs');
                              }
                            }}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition border-b border-gray-100 last:border-0 ${!notif.isRead ? 'bg-blue-50' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              {!notif.isRead && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900 mb-1">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-600 mb-1">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(notif.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition"
                  >
                    <img
                      src={getAvatarUrl(user?.profile?.avatar)}
                      alt={user?.name}
                      onError={(e) => e.currentTarget.src = `https://i.pravatar.cc/40?u=${user?.id}`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="hidden md:block text-sm font-medium text-gray-700">
                      {user?.name}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {user?.role === 'seller' ? 'Freelancer' : 'Client'}
                        </span>
                      </div>
                      
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      
                      <Link
                        to="/messages"
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Messages</span>
                      </Link>
                      
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-sm hover:shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-2">
            <Link
              to="/"
              className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
              onClick={() => setMobileOpen(false)}
            >
              Home
            </Link>
            
            <Link
              to="/gigs"
              className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
              onClick={() => setMobileOpen(false)}
            >
              Gigs
            </Link>

            {user?.role === 'seller' && (
              <>
                <Link
                  to="/jobs"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  onClick={() => setMobileOpen(false)}
                >
                  Find Work
                </Link>
                <Link
                  to="/seller-dashboard"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  onClick={() => setMobileOpen(false)}
                >
                  My Gigs
                </Link>
              </>
            )}

            {user?.role === 'buyer' && (
              <>
                <Link
                  to="/post-job"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  onClick={() => setMobileOpen(false)}
                >
                  Post Job
                </Link>
                <Link
                  to="/client-dashboard"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  onClick={() => setMobileOpen(false)}
                >
                  My Jobs
                </Link>
              </>
            )}

            {user && (
              <>
                <Link
                  to="/orders"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  onClick={() => setMobileOpen(false)}
                >
                  Orders
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  onClick={() => setMobileOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Logout
                </button>
              </>
            )}

            {!user && (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="block px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Incoming Call Notification */}
      {incomingCall && (
        <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 z-50 animate-slide-in-right">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
              {incomingCall.callType === 'video' ? (
                <Video className="text-blue-600" size={24} />
              ) : (
                <Phone className="text-blue-600" size={24} />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Incoming {incomingCall.callType} call</h4>
              <p className="text-sm text-gray-600">From conversation</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRejectCall}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition"
            >
              Decline
            </button>
            <button
              onClick={() => handleAcceptCall(incomingCall)}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
