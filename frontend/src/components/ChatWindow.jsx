// frontend/src/components/ChatWindow.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../socket';
import API from '../api';
import { FiSend, FiPaperclip, FiX } from 'react-icons/fi';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import VideoCallModal from './VideoCallModal';

export default function ChatWindow() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Handle incoming call from navigation state
  useEffect(() => {
    if (location.state?.incomingCall) {
      const callData = location.state.incomingCall;
      setIncomingCall(callData);
      setCallType(callData.callType);
      setShowCallModal(true);
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  /* Fetch conversation */
  useEffect(() => {
    if (!user || !user.id) {
      console.error('No user found, redirecting to login');
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching conversation:', conversationId);
        console.log('Current user:', user);

        const [convRes, msgRes] = await Promise.all([
          API.get(`/chat/conversations/${conversationId}`),
          API.get(`/chat/conversations/${conversationId}/messages?limit=50`)
        ]);

        console.log('Conversation data:', convRes.data);
        console.log('Messages data:', msgRes.data);

        setConversation(convRes.data);
        setMessages(msgRes.data.messages || []);

        await API.put(`/chat/conversations/${conversationId}/read`);
      } catch (err) {
        console.error('Error loading conversation:', err);
        console.error('Error response:', err.response);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load conversation';
        alert('Failed to load conversation: ' + errorMessage);
        
        // If unauthorized, redirect to login
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [conversationId, navigate]);

  /* Socket */
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    socket.connect();
    socket.emit('join_conversation', conversationId);

    const handleReceiveMessage = (msg) => {
      // Only add message if it's for this conversation
      if (msg.conversationId === conversationId) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_online', () => setOtherUserOnline(true));
    socket.on('user_offline', () => setOtherUserOnline(false));
    socket.on('user_typing', () => setIsTyping(true));
    socket.on('user_stop_typing', () => setIsTyping(false));
    socket.on('call:incoming', handleIncomingCall);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_online');
      socket.off('user_offline');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('call:incoming');
    };
  }, [conversationId, user?.id]);

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

  const handleIncomingCall = (data) => {
    console.log('Incoming call received:', data);
    setIncomingCall(data);
    setCallType(data.callType);
    setShowCallModal(true);
  };

  const initiateCall = (type) => {
    console.log('Initiating call:', type);
    setCallType(type);
    setShowCallModal(true);
    setIncomingCall(null);
  };

  /* Send */
  const sendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      await API.post(`/chat/conversations/${conversationId}/messages`, {
        text: messageText,
        attachments: []
      });

      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    }
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
        <div className="text-center">
          <p className="text-gray-600 mb-4">Conversation not found</p>
          <p className="text-xs text-gray-500 mb-4">
            Conversation ID: {conversationId}<br/>
            User ID: {user?.id || 'Not found'}
          </p>
          <button
            onClick={() => navigate('/messages')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  const otherUser = conversation.participants?.find(p => {
    console.log('Checking participant:', p._id, 'against user:', user.id);
    return p._id && p._id.toString() !== user.id?.toString();
  });

  console.log('Other user found:', otherUser);

  if (!otherUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Invalid conversation - could not find other participant</p>
          <p className="text-xs text-gray-500 mb-4">
            Participants: {conversation.participants?.map(p => p._id).join(', ')}<br/>
            Your ID: {user?.id}
          </p>
          <button
            onClick={() => navigate('/messages')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => navigate(`/profile/${otherUser?._id}`)}
            className="relative w-12 h-12 flex-shrink-0 hover:opacity-80 transition"
            title="View profile"
          >
            <img
              src={otherUser?.profile?.avatar || `https://ui-avatars.com/api/?name=${otherUser?.name}`}
              className="w-full h-full rounded-full object-cover"
              alt={otherUser?.name}
            />
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white
              ${otherUserOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          </button>
          <div className="flex-1 min-w-0">
            <button
              onClick={() => navigate(`/profile/${otherUser?._id}`)}
              className="font-semibold text-gray-800 hover:text-blue-600 transition truncate block text-left"
              title="View profile"
            >
              {otherUser?.name}
            </button>
            <p className="text-xs text-gray-500">
              {otherUserOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => initiateCall('audio')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
            title="Voice Call"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={() => initiateCall('video')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
            title="Video Call"
          >
            <Video size={20} />
          </button>
          <button
            onClick={() => navigate('/messages')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
          >
            <FiX size={22} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400">
            No messages yet. Start the conversation!
          </div>
        )}

        {messages.map((msg, i) => {
          const mine = msg.sender?._id?.toString() === user.id?.toString();
          
          // Render call message
          if (msg.messageType === 'call') {
            const isInitiator = msg.callInfo?.initiatedBy?.toString() === user.id?.toString();
            const callDuration = msg.callInfo?.duration || 0;
            const formatCallDuration = (seconds) => {
              const mins = Math.floor(seconds / 60);
              const secs = seconds % 60;
              return `${mins}:${secs.toString().padStart(2, '0')}`;
            };
            
            return (
              <div key={msg._id || i} className="flex justify-center my-3">
                <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2 text-sm text-gray-600">
                  {msg.callInfo?.status === 'completed' ? (
                    isInitiator ? (
                      <PhoneOutgoing size={16} className="text-green-600" />
                    ) : (
                      <PhoneIncoming size={16} className="text-blue-600" />
                    )
                  ) : (
                    <PhoneMissed size={16} className="text-red-500" />
                  )}
                  {msg.callInfo?.callType === 'video' ? (
                    <Video size={16} className="text-gray-500" />
                  ) : (
                    <Phone size={16} className="text-gray-500" />
                  )}
                  <span>
                    {msg.callInfo?.status === 'completed' 
                      ? `${msg.callInfo?.callType === 'video' ? 'Video' : 'Voice'} call · ${formatCallDuration(callDuration)}`
                      : msg.callInfo?.status === 'declined'
                      ? `${isInitiator ? 'Declined' : 'Missed'} call`
                      : 'Call ended'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {msg.createdAt && formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          }
          
          // Render text message
          return (
            <div
              key={msg._id || i}
              className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}
            >
              {!mine && (
                <img
                  src={msg.sender?.profile?.avatar || `https://ui-avatars.com/api/?name=${msg.sender?.name || 'User'}`}
                  alt={msg.sender?.name || 'User'}
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
                  {msg.createdAt && formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
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

      {/* Video/Audio Call Modal */}
      {showCallModal && (
        <VideoCallModal
          conversationId={conversationId}
          otherUser={otherUser}
          isIncoming={!!incomingCall}
          incomingOffer={incomingCall?.offer}
          callType={callType}
          onClose={() => {
            setShowCallModal(false);
            setIncomingCall(null);
            setCallType(null);
          }}
        />
      )}
    </div>
  );
}
