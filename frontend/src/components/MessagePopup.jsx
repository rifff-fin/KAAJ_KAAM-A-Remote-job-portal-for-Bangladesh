import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, X, Send, Minimize2, Maximize2, Phone, Video, Paperclip, Info, Mail, MapPin, Star, Briefcase, FileText, Presentation, FileSpreadsheet, Table, Archive, Download, Image, Video as VideoIcon, File } from 'lucide-react';
import { socket } from '../socket';
import API from '../api';
import { formatDistanceToNow } from 'date-fns';
import VideoCallModal from './VideoCallModal';

export default function MessagePopup({ conversationId, otherUser, onClose, onMinimize, isMinimized, incomingCall = null }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState(null);
  const [callData, setCallData] = useState(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const processedCallsRef = useRef(new Set());
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

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
    if (!conversationId || !user?.id) return;

    socket.connect();
    socket.emit('join_conversation', conversationId);

    const handleMessage = (data) => {
      // Only add message if it's for this conversation
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data]);
        API.put(`/chat/conversations/${conversationId}/read`).catch(console.error);
      }
    };

    const handleUserOnline = () => setOtherUserOnline(true);
    const handleUserOffline = () => setOtherUserOnline(false);
    const handleUserTyping = () => setIsTyping(true);
    const handleUserStopTyping = () => setIsTyping(false);
    
    const handleIncomingCall = (data) => {
      if (data.conversationId === conversationId) {
        const callId = `${data.from}_${data.conversationId}_${Date.now()}`;
        
        // Prevent duplicate calls
        if (processedCallsRef.current.has(callId)) {
          console.log('Call already processed, ignoring');
          return;
        }
        
        console.log('Incoming call in popup:', data);
        processedCallsRef.current.add(callId);
        
        // Only set call if no call is currently displayed
        if (!showCallModal) {
          setCallData(data);
          setCallType(data.callType);
          setShowCallModal(true);
        }
      }
    };

    socket.on('receive_message', handleMessage);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('call:incoming', handleIncomingCall);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('receive_message', handleMessage);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('call:incoming', handleIncomingCall);
    };
  }, [conversationId, user?.id]);

  // Handle incoming call from props
  useEffect(() => {
    if (incomingCall && incomingCall.conversationId === conversationId) {
      const callId = `${incomingCall.from}_${incomingCall.conversationId}`;
      
      // Prevent duplicate calls
      if (processedCallsRef.current.has(callId)) {
        console.log('Call from props already processed, ignoring');
        return;
      }
      
      if (!showCallModal) {
        console.log('Opening call modal from props:', incomingCall);
        processedCallsRef.current.add(callId);
        setCallData(incomingCall);
        setCallType(incomingCall.callType);
        setShowCallModal(true);
      }
    }
  }, [incomingCall, conversationId]);

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
    setAttachments(prev => [...prev, ...files].slice(0, 5));
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (isMinimized) {
    return (
      <div className="fixed top-20 right-4 bg-white rounded-xl shadow-2xl w-80 max-w-[calc(100vw-2rem)] z-50">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl cursor-pointer" onClick={onMinimize}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Link to={`/profile/${otherUser?._id}`} target="_blank">
                <img
                  src={otherUser?.profile?.avatar || `https://i.pravatar.cc/40?u=${otherUser?.name}`}
                  alt={otherUser?.name}
                  className="w-10 h-10 rounded-full border-2 border-white hover:opacity-80 transition"
                />
              </Link>
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${otherUserOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            </div>
            <div>
              <Link
                to={`/profile/${otherUser?._id}`}
                target="_blank"
                className="font-semibold text-sm hover:underline"
              >
                {otherUser?.name}
              </Link>
              <p className="text-xs opacity-90">{otherUserOnline ? 'Online' : 'Offline'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); setShowContactInfo(!showContactInfo); }} className={`hover:bg-white/20 p-1 rounded ${showContactInfo ? 'bg-white/20' : ''}`} title="Contact Info">
              <Info className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setShowMediaPanel(!showMediaPanel); }} className={`hover:bg-white/20 p-1 rounded ${showMediaPanel ? 'bg-white/20' : ''}`} title="Media & Documents">
              <Image className="w-4 h-4" />
            </button>
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
    <>
      <div className="fixed top-20 right-4 bg-white rounded-xl shadow-2xl w-96 max-w-[calc(100vw-2rem)] flex flex-col z-50 border border-gray-200" style={{ maxHeight: 'calc(100vh - 6rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Link to={`/profile/${otherUser?._id}`} target="_blank">
              <img
                src={otherUser?.profile?.avatar || `https://i.pravatar.cc/40?u=${otherUser?.name}`}
                alt={otherUser?.name}
                className="w-10 h-10 rounded-full border-2 border-white hover:opacity-80 transition"
              />
            </Link>
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${otherUserOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          </div>
          <div>
            <Link
              to={`/profile/${otherUser?._id}`}
              target="_blank"
              className="font-semibold text-sm hover:underline"
            >
              {otherUser?.name}
            </Link>
            <p className="text-xs opacity-90">{otherUserOnline ? 'Online' : 'Offline'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowContactInfo(!showContactInfo)} className={`hover:bg-white/20 p-1 rounded transition ${showContactInfo ? 'bg-white/20' : ''}`} title="Contact Info">
            <Info className="w-4 h-4" />
          </button>
          <button onClick={() => setShowMediaPanel(!showMediaPanel)} className={`hover:bg-white/20 p-1 rounded transition ${showMediaPanel ? 'bg-white/20' : ''}`} title="Media & Documents">
            <Image className="w-4 h-4" />
          </button>
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
                className={`flex mb-3 ${msg.sender?._id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender?._id !== user.id && (
                  <Link to={`/profile/${msg.sender?._id}`} target="_blank">
                    <img
                      src={msg.sender?.profile?.avatar || `https://i.pravatar.cc/32?u=${msg.sender?.name}`}
                      alt={msg.sender?.name || 'User'}
                      className="w-8 h-8 rounded-full mr-2 flex-shrink-0 hover:opacity-80 transition"
                    />
                  </Link>
                )}
                <div className={`max-w-[70%]`}>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-1 space-y-1">
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
                                className="max-w-[200px] max-h-48 rounded-lg object-cover"
                              />
                            </a>
                          ) : att.type === 'video' ? (
                            <video
                              src={att.url}
                              controls
                              className="max-w-[200px] max-h-48 rounded-lg"
                            />
                          ) : (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${
                                msg.sender?._id === user.id ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-900'
                              } hover:opacity-90 transition group`}
                            >
                              {getFileIcon(att.type, 14)}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{att.name}</p>
                                {att.size && <p className={`text-[10px] ${msg.sender?._id === user.id ? 'text-blue-100' : 'text-gray-500'}`}>{formatFileSize(att.size)}</p>}
                              </div>
                              <Download size={12} className="opacity-0 group-hover:opacity-100 transition" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.text && (
                    <div className={`${msg.sender?._id === user.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'} rounded-2xl px-4 py-2 shadow-sm`}>
                      <p className="text-sm break-words">{msg.text}</p>
                    </div>
                  )}
                  <span className={`text-xs mt-1 block ${msg.sender?._id === user.id ? 'text-blue-100' : 'text-gray-500'}`}>
                    {msg.createdAt && formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
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
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {attachments.map((file, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                <span className="truncate max-w-[80px]">{file.name}</span>
                <button onClick={() => removeAttachment(idx)} className="text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCallType('audio');
              setCallData(null);
              setShowCallModal(true);
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
            title="Voice Call"
            disabled={sending}
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCallType('video');
              setCallData(null);
              setShowCallModal(true);
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
            title="Video Call"
            disabled={sending}
          >
            <Video className="w-4 h-4" />
          </button>
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
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
            title="Attach file"
            disabled={sending}
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={messageText}
            onChange={handleTyping}
            onKeyPress={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={(!messageText.trim() && attachments.length === 0) || sending}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

        {/* Video/Audio Call Modal */}
        {showCallModal && (
          <VideoCallModal
            conversationId={conversationId}
            otherUser={otherUser}
            isIncoming={!!callData}
            incomingOffer={callData?.offer}
            onClose={() => {
              console.log('Closing call modal');
              setShowCallModal(false);
              setCallData(null);
              setCallType(null);
            }}
            callType={callType}
          />
        )}
      </div>

      {/* Media & Documents Panel */}
      {showMediaPanel && (
        <div className="fixed top-20 right-[calc(1rem+24rem+1rem)] bg-white rounded-xl shadow-2xl w-80 max-w-[calc(100vw-26rem)] max-h-[calc(100vh-6rem)] overflow-y-auto z-50 border border-gray-200">
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

      {/* Contact Info Modal */}
      {showContactInfo && otherUser && !showMediaPanel && (
        <div className="fixed top-20 right-[calc(1rem+24rem+1rem)] bg-white rounded-xl shadow-2xl w-80 max-w-[calc(100vw-26rem)] max-h-[calc(100vh-6rem)] overflow-y-auto z-50 border border-gray-200">
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

            <div className="text-center mb-6">
              <button
                onClick={() => {
                  navigate(`/profile/${otherUser._id}`);
                  onClose();
                }}
                className="inline-block hover:opacity-80 transition"
              >
                <img
                  src={otherUser?.profile?.avatar || `https://i.pravatar.cc/96?u=${otherUser?.name}`}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-gray-100"
                  alt={otherUser?.name}
                />
              </button>
              <button
                onClick={() => {
                  navigate(`/profile/${otherUser._id}`);
                  onClose();
                }}
                className="font-bold text-lg text-gray-900 hover:text-blue-600 transition block"
              >
                {otherUser?.name}
              </button>
              {otherUser?.profile?.bio && (
                <p className="text-sm text-gray-600 mt-2">{otherUser.profile.bio}</p>
              )}
            </div>

            <div className="space-y-4">
              {otherUser?.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <p className="text-sm text-gray-900 break-words">{otherUser.email}</p>
                  </div>
                </div>
              )}

              {otherUser?.profile?.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Location</p>
                    <p className="text-sm text-gray-900">{otherUser.profile.location}</p>
                  </div>
                </div>
              )}

              {otherUser?.rating?.average > 0 && (
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-yellow-500 mt-0.5 fill-current" />
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
                  <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
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

            <div className="mt-6">
              <button
                onClick={() => {
                  navigate(`/profile/${otherUser._id}`);
                  onClose();
                }}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}