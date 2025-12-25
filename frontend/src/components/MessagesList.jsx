// frontend/src/components/MessagesList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { socket } from '../socket';
import { MessageSquare, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesList() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showAll, setShowAll] = useState(false);
  const fetchingRef = React.useRef(false);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user || !user.id) {
      console.log('No user found in MessagesList, redirecting to login');
      navigate('/login');
      return;
    }
    
    fetchConversations();

    // Listen for online status updates and new messages
    socket.connect();
    
    const handleUserOnline = ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    };
    
    const handleUserOffline = ({ userId }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    };

    const handleNewMessage = (data) => {
      // Refresh conversations to update order and last message
      fetchConversations();
    };

    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('receive_message', handleNewMessage);

    return () => {
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('receive_message', handleNewMessage);
    };
  }, []);

  const fetchConversations = async () => {
    if (fetchingRef.current) {
      console.log('Already fetching, skipping...');
      return;
    }
    
    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);
      console.log('Fetching conversations...');
      const response = await API.get('/chat/conversations?limit=50');
      console.log('Conversations response:', response.data);
      setConversations(response.data.conversations || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load conversations';
      setError(errorMessage);
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        console.log('Unauthorized - redirecting to login');
        navigate('/login');
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // Remove duplicates and filter conversations
  const uniqueConversations = conversations.reduce((acc, conv) => {
    if (!conv.participants || conv.participants.length === 0) return acc;
    
    const otherUser = conv.participants.find(p => p._id !== user?.id);
    if (!otherUser) return acc;
    
    // Check if we already have a conversation with this user
    const existingIndex = acc.findIndex(c => {
      const existingOtherUser = c.participants.find(p => p._id !== user?.id);
      return existingOtherUser?._id === otherUser._id;
    });
    
    if (existingIndex === -1) {
      // No duplicate, add it
      acc.push(conv);
    } else {
      // Keep the one with the most recent update
      if (new Date(conv.updatedAt) > new Date(acc[existingIndex].updatedAt)) {
        acc[existingIndex] = conv;
      }
    }
    
    return acc;
  }, []);

  const filteredConversations = uniqueConversations.filter(conv => {
    const otherUser = conv.participants.find(p => p._id !== user?.id);
    return otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Show only first 5 unless "show all" is clicked
  const displayedConversations = showAll ? filteredConversations : filteredConversations.slice(0, 5);
  const hasMore = filteredConversations.length > 5;

  const handleConversationClick = (conversationId) => {
    navigate(`/chat/${conversationId}`);
  };

  const isUserActive = (updatedAt) => {
    if (!updatedAt) return false;
    const lastActivity = new Date(updatedAt);
    const now = new Date();
    const diffInMinutes = (now - lastActivity) / (1000 * 60);
    return diffInMinutes <= 1;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Conversations</h3>
          <p className="text-gray-600 mb-2">{error}</p>
          <p className="text-xs text-gray-500 mb-6">
            User ID: {user?.id || 'Not found'}<br/>
            Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={fetchConversations}
              className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition"
            >
              Re-login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <button
              onClick={() => navigate('/gigs')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium transition-all hover:bg-blue-600 hover:shadow-md active:scale-95"
            >
              <MessageSquare size={20} />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 max-w-5xl mx-auto w-full">
        <div className="bg-white min-h-[calc(100vh-180px)]">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-180px)] px-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <MessageSquare size={40} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No conversations found' : 'No conversations yet'}
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                  {searchTerm 
                    ? 'Try searching with a different name'
                    : 'Start a conversation by browsing gigs or jobs and connecting with other users'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => navigate('/gigs')}
                    className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium transition-all hover:bg-blue-600 hover:shadow-md active:scale-95"
                  >
                    Browse Gigs
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {displayedConversations.map(conv => {
                const otherUser = conv.participants.find(p => p._id !== user?.id);
                if (!otherUser) return null;
                
                const unreadCount = (conv.unreadCount && conv.unreadCount[user?.id]) || 0;
                const isUnread = unreadCount > 0;

                return (
                  <div
                    key={conv._id}
                    onClick={() => handleConversationClick(conv._id)}
                    className={`flex items-center gap-4 px-4 sm:px-6 lg:px-8 py-4 cursor-pointer transition-all hover:bg-gray-50 active:bg-gray-100 ${
                      isUnread ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <Link to={`/profile/${otherUser?._id}`}>
                        <img
                          src={
                            otherUser?.profile?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name || 'User')}&background=3B82F6&color=fff&bold=true`
                          }
                          alt={otherUser?.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm hover:opacity-80 transition"
                        />
                      </Link>
                      {/* Online/Active indicator */}
                      {(onlineUsers.has(otherUser._id) || isUserActive(conv.updatedAt)) && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
                      )}
                      {/* Unread count badge */}
                      {isUnread && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Link
                            to={`/profile/${otherUser?._id}`}
                            className={`text-base font-semibold truncate hover:text-blue-600 transition ${
                              isUnread ? 'text-gray-900' : 'text-gray-800'
                            }`}
                          >
                            {otherUser?.name}
                          </Link>
                          {(onlineUsers.has(otherUser._id) || isUserActive(conv.updatedAt)) && (
                            <span className="text-xs text-green-600 font-medium flex-shrink-0">
                              Active now
                            </span>
                          )}
                        </div>
                        {!isUserActive(conv.updatedAt) && (
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {conv.updatedAt && formatDistanceToNow(new Date(conv.updatedAt), {
                              addSuffix: true
                            })}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${
                        isUnread ? 'text-gray-700 font-medium' : 'text-gray-600'
                      }`}>
                        {conv.lastMessage?.text || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                );
                })}
              </div>
              
              {/* Show More Button */}
              {hasMore && !showAll && (
                <div className="p-6 text-center border-t border-gray-100">
                  <button
                    onClick={() => setShowAll(true)}
                    className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
                  >
                    Show All ({filteredConversations.length} conversations)
                  </button>
                </div>
              )}
              
              {showAll && hasMore && (
                <div className="p-6 text-center border-t border-gray-100">
                  <button
                    onClick={() => setShowAll(false)}
                    className="px-6 py-2.5 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition"
                  >
                    Show Less
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}