import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { socket } from '../socket';
import API from '../api';
import { formatDistanceToNow } from 'date-fns';

export default function MessagePopup({ conversationId, otherUser, onClose, onMinimize, isMinimized }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/chat/conversations/${conversationId}/messages?limit=50`);
        setMessages(response.data.messages);
        await API.put(`/chat/conversations/${conversationId}/read`);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !user) return;

    socket.connect();
    socket.emit('join_conversation', conversationId);

    const handleMessage = (data) => {
      setMessages(prev => [...prev, data]);
      API.put(`/chat/conversations/${conversationId}/read`).catch(console.error);
    };

    const handleUserOnline = () => setOtherUserOnline(true);
    const handleUserOffline = () => setOtherUserOnline(false);
    const handleUserTyping = () => setIsTyping(true);
    const handleUserStopTyping = () => setIsTyping(false);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const sendMessage = async () => {
    if (!messageText.trim()) return;

    setSending(true);
    try {
      await API.post(`/chat/conversations/${conversationId}/messages`, {
        text: messageText,
        attachments: []
      });

      socket.emit('send_message', {
        conversationId,
        text: messageText,
        attachments: []
      });

      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-t-xl shadow-2xl w-80 z-50">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl cursor-pointer" onClick={onMinimize}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={otherUser?.profile?.avatar || `https://i.pravatar.cc/40?u=${otherUser?.name}`}
                alt={otherUser?.name}
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${otherUserOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            </div>
            <div>
              <h3 className="font-semibold text-sm">{otherUser?.name}</h3>
              <p className="text-xs opacity-90">{otherUserOnline ? 'Online' : 'Offline'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); onMinimize(); }} className="hover:bg-white/20 p-1 rounded">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="hover:bg-white/20 p-1 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-2xl w-96 h-[600px] flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={otherUser?.profile?.avatar || `https://i.pravatar.cc/40?u=${otherUser?.name}`}
              alt={otherUser?.name}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${otherUserOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">{otherUser?.name}</h3>
            <p className="text-xs opacity-90">{otherUserOnline ? 'Online' : 'Offline'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onMinimize} className="hover:bg-white/20 p-1 rounded transition">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={msg._id || idx}
                className={`flex mb-3 ${msg.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender._id !== user.id && (
                  <img
                    src={msg.sender.profile?.avatar || `https://i.pravatar.cc/32?u=${msg.sender.name}`}
                    alt={msg.sender.name}
                    className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
                  />
                )}
                <div className={`max-w-[70%] ${msg.sender._id === user.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'} rounded-2xl px-4 py-2 shadow-sm`}>
                  <p className="text-sm break-words">{msg.text}</p>
                  <span className={`text-xs mt-1 block ${msg.sender._id === user.id ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200 rounded-b-xl">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={messageText}
            onChange={handleTyping}
            onKeyPress={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!messageText.trim() || sending}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}