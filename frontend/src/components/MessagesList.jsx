// frontend/src/components/MessagesList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { FiMessageSquare, FiSearch } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesList() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchConversations();
  }, [user, navigate]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await API.get('/chat/conversations?limit=50');
      setConversations(response.data.conversations || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.participants.find(p => p._id !== user.id);
    return otherUser?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleConversationClick = (conversationId) => {
    navigate(`/chat/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-gray-500 text-base">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
        <button
          onClick={() => navigate('/gigs')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium transition-all hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg"
        >
          <FiMessageSquare size={20} />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 px-5 py-3 bg-gray-100 border-b border-gray-200">
        <FiSearch size={18} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto flex flex-col scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <FiMessageSquare size={48} className="text-gray-300" />
            <p className="text-base font-medium">No conversations yet</p>
            <small className="text-xs text-gray-300">
              Start a conversation by browsing gigs or jobs
            </small>
          </div>
        ) : (
          filteredConversations.map(conv => {
            const otherUser = conv.participants.find(p => p._id !== user.id);
            const isUnread = conv.unreadCount?.get?.(user.id) > 0;

            return (
              <div
                key={conv._id}
                onClick={() => handleConversationClick(conv._id)}
                className={`relative flex items-center gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer transition
                  ${isUnread ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <img
                  src={
                    otherUser?.profile?.avatar ||
                    `https://ui-avatars.com/api/?name=${otherUser?.name}`
                  }
                  alt={otherUser?.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0 md:w-10 md:h-10"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-800 truncate">
                      {otherUser?.name}
                    </h4>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                      {formatDistanceToNow(new Date(conv.updatedAt), {
                        addSuffix: true
                      })}
                    </span>
                  </div>
                  <p
                    className={`text-sm truncate ${
                      isUnread
                        ? 'text-gray-800 font-medium'
                        : 'text-gray-500'
                    }`}
                  >
                    {conv.lastMessage?.text || 'No messages yet'}
                  </p>
                </div>

                {isUnread && (
                  <span className="absolute right-4 w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
