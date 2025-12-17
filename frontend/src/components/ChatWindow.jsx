// frontend/src/components/ChatWindow.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import API from '../api';
import { FiSend, FiPaperclip, FiX } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

export default function ChatWindow() {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  /* Fetch conversation */
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [convRes, msgRes] = await Promise.all([
          API.get(`/chat/conversations/${conversationId}`),
          API.get(`/chat/conversations/${conversationId}/messages?limit=50`)
        ]);

        setConversation(convRes.data);
        setMessages(msgRes.data.messages);

        await API.put(`/chat/conversations/${conversationId}/read`);
      } catch {
        alert('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [conversationId, user, navigate]);

  /* Socket */
  useEffect(() => {
    if (!conversationId || !user) return;

    socket.connect();
    socket.emit('join_conversation', conversationId);

    socket.on('receive_message', msg =>
      setMessages(prev => [...prev, msg])
    );
    socket.on('user_online', () => setOtherUserOnline(true));
    socket.on('user_offline', () => setOtherUserOnline(false));
    socket.on('user_typing', () => setIsTyping(true));
    socket.on('user_stop_typing', () => setIsTyping(false));

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.removeAllListeners();
    };
  }, [conversationId, user]);

  /* Scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* Typing */
  const handleTyping = (e) => {
    setMessageText(e.target.value);
    socket.emit('typing', conversationId);

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(
      () => socket.emit('stop_typing', conversationId),
      1000
    );
  };

  /* Send */
  const sendMessage = () => {
    if (!messageText.trim()) return;

    socket.emit('send_message', {
      conversationId,
      text: messageText,
      attachments: [],
      sender: {
        _id: user.id,
        name: user.name,
        profile: { avatar: user.profile?.avatar }
      }
    });

    setMessages(prev => [...prev, {
      _id: Date.now(),
      sender: { _id: user.id, name: user.name, profile: { avatar: user.profile?.avatar } },
      text: messageText,
      createdAt: new Date()
    }]);

    setMessageText('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-gray-500 text-lg">Loading conversation...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p>Conversation not found</p>
      </div>
    );
  }

  const otherUser = conversation.participants.find(p => p._id !== user.id);

  return (
    <div className="flex flex-col h-screen bg-gray-100">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12">
            <img
              src={otherUser?.profile?.avatar || `https://ui-avatars.com/api/?name=${otherUser?.name}`}
              className="w-full h-full rounded-full object-cover"
            />
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white
              ${otherUserOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{otherUser?.name}</h3>
            <p className="text-xs text-gray-500">
              {otherUserOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/messages')}
          className="p-2 rounded hover:bg-gray-100 text-gray-600"
        >
          <FiX size={22} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400">
            No messages yet. Start the conversation!
          </div>
        )}

        {messages.map((msg, i) => {
          const mine = msg.sender._id === user.id;
          return (
            <div
              key={i}
              className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}
            >
              {!mine && (
                <img
                  src={msg.sender.profile?.avatar || `https://ui-avatars.com/api/?name=${msg.sender.name}`}
                  className="w-8 h-8 rounded-full mr-2"
                />
              )}
              <div className={`max-w-[60%] ${mine ? 'text-right' : ''}`}>
                <p className={`px-4 py-2 text-sm rounded-xl
                  ${mine
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : 'bg-white border rounded-bl-sm'}`}
                >
                  {msg.text}
                </p>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-white border rounded-xl flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-5 py-4">
        <div className="flex items-center gap-2">
          <input
            value={messageText}
            onChange={handleTyping}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            disabled={sending}
          />
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <FiPaperclip />
          </button>
          <button
            onClick={sendMessage}
            disabled={!messageText.trim()}
            className="w-10 h-10 rounded-full bg-blue-500 text-white
                       flex items-center justify-center
                       hover:bg-blue-600 disabled:bg-gray-300"
          >
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
}
