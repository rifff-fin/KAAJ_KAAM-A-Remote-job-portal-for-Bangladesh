// frontend/src/components/MessagesList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { FiMessageSquare, FiSearch } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import './MessagesList.css';

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
      setConversations(response.data.conversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.participants.find(p => p._id !== user.id);
    return otherUser?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleConversationClick = (conversationId) => {
    navigate(`/chat/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="messages-list loading">
        <div className="spinner">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="messages-list">
      <div className="messages-header">
        <h2>Messages</h2>
        <button className="new-chat-btn" onClick={() => navigate('/gigs')}>
          <FiMessageSquare size={20} />
          New Chat
        </button>
      </div>

      <div className="search-box">
        <FiSearch size={18} />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="conversations-container">
        {filteredConversations.length === 0 ? (
          <div className="empty-state">
            <FiMessageSquare size={48} />
            <p>No conversations yet</p>
            <small>Start a conversation by browsing gigs or jobs</small>
          </div>
        ) : (
          filteredConversations.map(conv => {
            const otherUser = conv.participants.find(p => p._id !== user.id);
            const isUnread = conv.unreadCount?.get(user.id) > 0;

            return (
              <div
                key={conv._id}
                className={`conversation-item ${isUnread ? 'unread' : ''}`}
                onClick={() => handleConversationClick(conv._id)}
              >
                <img
                  src={otherUser?.profile?.avatar || `https://ui-avatars.com/api/?name=${otherUser?.name}`}
                  alt={otherUser?.name}
                  className="conversation-avatar"
                />

                <div className="conversation-info">
                  <div className="conversation-header">
                    <h4>{otherUser?.name}</h4>
                    <span className="timestamp">
                      {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="last-message">
                    {conv.lastMessage?.text || 'No messages yet'}
                  </p>
                </div>

                {isUnread && <div className="unread-badge"></div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
