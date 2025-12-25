// frontend/src/components/ChatWindow.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { socket } from '../socket';
import API from '../api';
import { FiSend, FiPaperclip, FiX } from 'react-icons/fi';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, User, Mail, MapPin, Star, Briefcase, X, Info, FileText, Presentation, FileSpreadsheet, Table, Archive, Download, Image, Video as VideoIcon, File, Calendar, MessageSquare, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import VideoCallModal from './VideoCallModal';
import ScheduleMeetingModal from './ScheduleMeetingModal';
import MeetingInviteCard from './MeetingInviteCard';

export default function ChatWindow() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [showScheduleMeeting, setShowScheduleMeeting] = useState(false);
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' or 'meetings'
  const [meetings, setMeetings] = useState([]);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const processedCallsRef = useRef(new Set());

  const user = JSON.parse(localStorage.getItem('user') || 'null');

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

  /* Fetch conversation and meetings */
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

        const [convRes, msgRes, meetingsRes] = await Promise.all([
          API.get(`/chat/conversations/${conversationId}`),
          API.get(`/chat/conversations/${conversationId}/messages?limit=50`),
          API.get(`/meetings/conversations/${conversationId}/meetings`)
        ]);

        console.log('Conversation data:', convRes.data);
        console.log('Messages data:', msgRes.data);
        console.log('Meetings data:', meetingsRes.data);

        setConversation(convRes.data);
        setMessages(msgRes.data.messages || []);
        setMeetings(meetingsRes.data.meetings || meetingsRes.data || []);

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

    const handleMeetingInvite = (data) => {
      console.log('Meeting invite received:', data);
      if (data.meeting) {
        setMeetings(prev => [...prev, data.meeting]);
      }
    };

    const handleMeetingUpdate = (data) => {
      console.log('Meeting update received:', data);
      setMeetings(prev => prev.map(m => m._id === data._id ? data : m));
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_online', () => setOtherUserOnline(true));
    socket.on('user_offline', () => setOtherUserOnline(false));
    socket.on('user_typing', () => setIsTyping(true));
    socket.on('user_stop_typing', () => setIsTyping(false));
    socket.on('call:incoming', handleIncomingCall);
    socket.on('meeting:invite', handleMeetingInvite);
    socket.on('meeting:accepted', handleMeetingUpdate);
    socket.on('meeting:declined', handleMeetingUpdate);
    socket.on('meeting:cancelled', handleMeetingUpdate);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_online');
      socket.off('user_offline');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('call:incoming');
      socket.off('meeting:invite');
      socket.off('meeting:accepted');
      socket.off('meeting:declined');
      socket.off('meeting:cancelled');
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
    const callId = `${data.from}_${data.conversationId}_${Date.now()}`;
    
    // Prevent duplicate calls
    if (processedCallsRef.current.has(callId)) {
      console.log('Call already processed, ignoring');
      return;
    }
    
    console.log('Incoming call received:', data);
    processedCallsRef.current.add(callId);
    
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
    if (!messageText.trim() && attachments.length === 0) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('text', messageText.trim() || '');
      
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await API.post(`/chat/conversations/${conversationId}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Message sent successfully:', response.data);
      setMessageText('');
      setAttachments([]);
    } catch (err) {
      console.error('Error sending message:', err);
      console.error('Error details:', err.response?.data);
      alert(`Failed to send message: ${err.response?.data?.message || err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files].slice(0, 5)); // Max 5 files
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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

  // Helper function to get file icon
  const getFileIcon = (fileType, size = 20) => {
    const iconProps = { size, className: "flex-shrink-0" };
    
    switch (fileType) {
      case 'pdf':
        return <FileText {...iconProps} className="text-red-500" />;
      case 'doc':
        return <FileText {...iconProps} className="text-blue-600" />;
      case 'ppt':
        return <Presentation {...iconProps} className="text-orange-500" />;
      case 'xls':
        return <FileSpreadsheet {...iconProps} className="text-green-600" />;
      case 'txt':
        return <FileText {...iconProps} className="text-gray-600" />;
      case 'csv':
        return <Table {...iconProps} className="text-green-500" />;
      case 'zip':
        return <Archive {...iconProps} className="text-purple-500" />;
      case 'image':
        return <Image {...iconProps} className="text-blue-500" />;
      case 'video':
        return <VideoIcon {...iconProps} className="text-pink-500" />;
      default:
        return <File {...iconProps} className="text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get all media and documents from messages
  const allAttachments = messages.reduce((acc, msg) => {
    if (msg.attachments && msg.attachments.length > 0) {
      return [...acc, ...msg.attachments.map(att => ({ ...att, messageId: msg._id, timestamp: msg.createdAt }))];
    }
    return acc;
  }, []);

  const mediaItems = allAttachments.filter(att => att.type === 'image' || att.type === 'video');
  const documentItems = allAttachments.filter(att => att.type !== 'image' && att.type !== 'video');

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
    <div className="flex h-screen bg-gray-100">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">

      {/* Header */}
      <div className="flex flex-col bg-white border-b shadow-sm">
        {/* Top Row - User Info & Actions */}
        <div className="flex items-center justify-between px-5 py-4">
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
              onClick={() => setShowScheduleMeeting(true)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
              title="Schedule Meeting"
            >
              <Calendar size={20} />
            </button>
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
              onClick={() => setShowContactInfo(!showContactInfo)}
              className={`p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition ${showContactInfo ? 'bg-gray-100' : ''}`}
              title="Contact Info"
            >
              <Info size={20} />
            </button>
            <button
              onClick={() => setShowMediaPanel(!showMediaPanel)}
              className={`p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition ${showMediaPanel ? 'bg-gray-100' : ''}`}
              title="Media & Documents"
            >
              <Image size={20} />
            </button>
            <button
              onClick={() => navigate('/messages')}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
            >
              <FiX size={22} />
            </button>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="flex border-t border-gray-100">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-3 text-sm font-medium transition relative ${
              activeTab === 'messages'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare size={16} className="inline mr-2" />
            Messages
            {activeTab === 'messages' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`flex-1 py-3 text-sm font-medium transition relative ${
              activeTab === 'meetings'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar size={16} className="inline mr-2" />
            Meetings
            {meetings.filter(m => ['pending', 'accepted'].includes(m.status)).length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {meetings.filter(m => ['pending', 'accepted'].includes(m.status)).length}
              </span>
            )}
            {activeTab === 'meetings' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content Area - Messages or Meetings */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {activeTab === 'messages' ? (
          <>
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
                <button
                  onClick={() => navigate(`/profile/${msg.sender?._id}`)}
                  className="hover:opacity-80 transition"
                >
                  <img
                    src={msg.sender?.profile?.avatar || `https://ui-avatars.com/api/?name=${msg.sender?.name || 'User'}`}
                    alt={msg.sender?.name || 'User'}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                </button>
              )}
              <div className={`max-w-[60%] ${mine ? 'text-right' : ''}`}>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mb-2 space-y-2">
                    {msg.attachments.map((att, idx) => (
                      <div key={idx}>
                        {att.type === 'image' ? (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-lg overflow-hidden hover:opacity-90 transition"
                          >
                            <img
                              src={att.url}
                              alt={att.name}
                              className="max-w-xs max-h-64 rounded-lg object-cover"
                            />
                          </a>
                        ) : att.type === 'video' ? (
                          <video
                            src={att.url}
                            controls
                            className="max-w-xs max-h-64 rounded-lg"
                          />
                        ) : (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                              mine ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-900'
                            } hover:opacity-90 transition group`}
                          >
                            {getFileIcon(att.type, 18)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{att.name}</p>
                              {att.size && <p className={`text-xs ${mine ? 'text-blue-100' : 'text-gray-500'}`}>{formatFileSize(att.size)}</p>}
                            </div>
                            <Download size={16} className="opacity-0 group-hover:opacity-100 transition" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {msg.text && (
                  <p className={`px-4 py-2 text-sm rounded-xl
                    ${mine
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white border rounded-bl-sm'}`}
                  >
                    {msg.text}
                  </p>
                )}
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
          </>
        ) : (
          <div className="space-y-3">
            {/* Schedule Meeting Button */}
            <button
              onClick={() => setShowScheduleMeeting(true)}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Schedule New Meeting
            </button>

            {/* Meetings List */}
            {meetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Calendar size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No meetings scheduled</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Schedule your first meeting to discuss project details
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {meetings
                  .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))
                  .map(meeting => (
                    <MeetingInviteCard
                      key={meeting._id}
                      meeting={meeting}
                      currentUserId={user.id}
                      onUpdate={(updatedMeeting) => {
                        setMeetings(prev => prev.map(m => m._id === updatedMeeting._id ? updatedMeeting : m));
                      }}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t px-5 py-4">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((file, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg text-xs">
                <span className="truncate max-w-[100px]">{file.name}</span>
                <button onClick={() => removeAttachment(idx)} className="text-red-500 hover:text-red-700">
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={messageText}
            onChange={handleTyping}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            disabled={sending}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
            disabled={sending}
          >
            <FiPaperclip />
          </button>
          <button
            onClick={sendMessage}
            disabled={(!messageText.trim() && attachments.length === 0) || sending}
            className="w-10 h-10 rounded-full bg-blue-500 text-white
                       flex items-center justify-center
                       hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
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
              console.log('Closing call modal');
              setShowCallModal(false);
              setIncomingCall(null);
              setCallType(null);
            }}
          />
        )}

        {/* Schedule Meeting Modal */}
        {showScheduleMeeting && (
          <ScheduleMeetingModal
            conversationId={conversationId}
            orderId={conversation?.orderId}
            onClose={() => setShowScheduleMeeting(false)}
            onSuccess={(meeting) => {
              setMeetings(prev => [...prev, meeting]);
              setActiveTab('meetings');
            }}
          />
        )}
      </div>

      {/* Media & Documents Panel */}
      {showMediaPanel && (
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Media & Documents</h3>
              <button
                onClick={() => setShowMediaPanel(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Media Section */}
            {mediaItems.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Image size={16} />
                  Media ({mediaItems.length})
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {mediaItems.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition bg-gray-100"
                    >
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <VideoIcon size={24} className="text-gray-600" />
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Documents Section */}
            {documentItems.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <File size={16} />
                  Documents ({documentItems.length})
                </h4>
                <div className="space-y-2">
                  {documentItems.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition group"
                    >
                      {getFileIcon(item.type, 20)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
                      </div>
                      <Download size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {mediaItems.length === 0 && documentItems.length === 0 && (
              <div className="text-center py-12">
                <Image size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No media or documents yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Info Sidebar */}
      {showContactInfo && otherUser && !showMediaPanel && (
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Contact Info</h3>
              <button
                onClick={() => setShowContactInfo(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Profile Picture */}
            <div className="text-center mb-6">
              <button
                onClick={() => navigate(`/profile/${otherUser._id}`)}
                className="inline-block hover:opacity-80 transition"
              >
                <img
                  src={otherUser?.profile?.avatar || `https://ui-avatars.com/api/?name=${otherUser?.name}`}
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-4 border-gray-100"
                  alt={otherUser?.name}
                />
              </button>
              <button
                onClick={() => navigate(`/profile/${otherUser._id}`)}
                className="font-bold text-lg text-gray-900 hover:text-blue-600 transition"
              >
                {otherUser?.name}
              </button>
              {otherUser?.profile?.bio && (
                <p className="text-sm text-gray-600 mt-2">{otherUser.profile.bio}</p>
              )}
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              {otherUser?.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <p className="text-sm text-gray-900">{otherUser.email}</p>
                  </div>
                </div>
              )}

              {otherUser?.profile?.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Location</p>
                    <p className="text-sm text-gray-900">{otherUser.profile.location}</p>
                  </div>
                </div>
              )}

              {otherUser?.rating?.average > 0 && (
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0 fill-current" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Rating</p>
                    <p className="text-sm text-gray-900">
                      {otherUser.rating.average.toFixed(1)} ({otherUser.rating.count} reviews)
                    </p>
                  </div>
                </div>
              )}

              {otherUser?.profile?.skills && otherUser.profile.skills.length > 0 && (
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {otherUser.profile.skills.slice(0, 5).map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2">
              <button
                onClick={() => navigate(`/profile/${otherUser._id}`)}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                View Full Profile
              </button>
              <button
                onClick={() => setShowContactInfo(false)}
                className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
