// frontend/src/components/ChatWindow.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import API from '../api';
import { FiSend, FiPaperclip, FiX } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import './ChatWindow.css';

export default function ChatWindow() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Fetch conversation and messages
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [convRes, messagesRes] = await Promise.all([
          API.get(`/chat/conversations/${conversationId}`),
          API.get(`/chat/conversations/${conversationId}/messages?limit=50`)
        ]);

        setConversation(convRes.data);
        setMessages(messagesRes.data.messages);

        // Mark as read
        await API.put(`/chat/conversations/${conversationId}/read`);
      } catch (err) {
        console.error('Error fetching data:', err);
        alert('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [conversationId, user, navigate]);

  // Socket.IO setup
  useEffect(() => {
    if (!conversationId || !user) return;

    socket.connect();
    socket.emit('join_conversation', conversationId);

    const handleMessage = (data) => {
      setMessages(prev => [...prev, data]);
    };

    const handleUserOnline = () => {
      setOtherUserOnline(true);
    };

    const handleUserOffline = () => {
      setOtherUserOnline(false);
    };

    const handleUserTyping = () => {
      setIsTyping(true);
    };

    const handleUserStopTyping = () => {
      setIsTyping(false);
    };

    socket.on('receive_message', handleMessage);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('receive_message', handleMessage);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [conversationId, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing
  const handleTyping = (e) => {
    setMessageText(e.target.value);

    socket.emit('typing', conversationId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', conversationId);
    }, 1000);
  };

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim()) return;

    // No need to set sending state, as the socket event is fast
    // setSending(true); 

    try {
      socket.emit('send_message', {
        conversationId,
        text: messageText,
        attachments: [],
        sender: {
          _id: user.id,
          name: user.name,
          profile: {
            avatar: user.profile?.avatar
          }
        }
      });

      // Optimistically update the UI
      setMessages(prev => [...prev, {
        _id: new Date().toISOString(), // Temporary ID
        conversationId,
        sender: {
          _id: user.id,
          name: user.name,
          profile: {
            avatar: user.profile?.avatar
          }
        },
        text: messageText,
        attachments: [],
        createdAt: new Date().toISOString()
      }]);

      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
      // Optionally, remove the optimistically added message
    } finally {
      // setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="chat-window loading">
        <div className="spinner">Loading conversation...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="chat-window error">
        <p>Conversation not found</p>
      </div>
    );
  }

  const otherUser = conversation.participants.find(
    p => p._id !== user.id
  );

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="header-info">
          <div className="user-avatar">
            <img
              src={otherUser?.profile?.avatar || `https://ui-avatars.com/api/?name=${otherUser?.name}`}
              alt={otherUser?.name}
            />
            <span className={`status-indicator ${otherUserOnline ? 'online' : 'offline'}`}></span>
          </div>
          <div>
            <h3>{otherUser?.name}</h3>
            <p className="status">
              {otherUserOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <button className="close-btn" onClick={() => navigate('/messages')}>
          <FiX size={24} />
        </button>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg._id || idx}
              className={`message ${msg.sender._id === user.id ? 'sent' : 'received'}`}
            >
              {msg.sender._id !== user.id && (
                <img
                  src={msg.sender.profile?.avatar || `https://ui-avatars.com/api/?name=${msg.sender.name}`}
                  alt={msg.sender.name}
                  className="message-avatar"
                />
              )}
              <div className="message-content">
                <p className="message-text">{msg.text}</p>
                <span className="message-time">
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="message received typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="input-wrapper">
          <input
            type="text"
            value={messageText}
            onChange={handleTyping}
            onKeyPress={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="message-input"
            disabled={sending}
          />
          <button className="attach-btn" title="Attach file">
            <FiPaperclip size={20} />
          </button>
          <button
            onClick={sendMessage}
            disabled={!messageText.trim() || sending}
            className="send-btn"
          >
            <FiSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
