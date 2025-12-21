import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import MessagePopup from './MessagePopup';
import MessageNotification from './MessageNotification';
import API from '../api';

export default function MessageManager() {
  const [openChats, setOpenChats] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [minimizedChats, setMinimizedChats] = useState(new Set());
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user?.id) return;

    socket.connect();
    socket.emit('user_online', user.id);

    const handleNewMessage = (data) => {
      // Check if chat is already open
      const chatOpen = openChats.find(chat => chat.conversationId === data.conversationId);
      
      if (!chatOpen && data.sender?._id !== user.id) {
        // Show notification for new message
        setNotifications(prev => [...prev, { ...data, id: Date.now() }]);
      }
    };

    const handleIncomingCall = (data) => {
      console.log('Incoming call received in MessageManager:', data);
      // Check if chat is already open for this conversation
      const chatOpen = openChats.find(chat => chat.conversationId === data.conversationId);
      
      if (!chatOpen) {
        // Auto-open chat with incoming call
        openChatWithCall(data);
      }
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('call:incoming', handleIncomingCall);

    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('call:incoming', handleIncomingCall);
    };
  }, [user?.id, openChats]);

  const openChat = async (conversationId, otherUser, incomingCall = null) => {
    // Check if already open
    const existingChat = openChats.find(chat => chat.conversationId === conversationId);
    if (existingChat) {
      // Unminimize if minimized
      setMinimizedChats(prev => {
        const newSet = new Set(prev);
        newSet.delete(conversationId);
        return newSet;
      });
      
      // If there's an incoming call, update the chat with call data
      if (incomingCall) {
        setOpenChats(prev => prev.map(chat => 
          chat.conversationId === conversationId 
            ? { ...chat, incomingCall } 
            : chat
        ));
      }
      return;
    }

    // Limit to 3 open chats
    if (openChats.length >= 3) {
      alert('You can only have 3 chats open at once. Please close one first.');
      return;
    }

    setOpenChats(prev => [...prev, { conversationId, otherUser, incomingCall }]);
  };

  const openChatWithCall = async (callData) => {
    try {
      // Fetch conversation details to get other user info
      const response = await API.get(`/chat/conversations/${callData.conversationId}`);
      const otherUser = response.data.participants.find(p => p._id !== user?.id);
      
      if (otherUser) {
        openChat(callData.conversationId, otherUser, callData);
      }
    } catch (err) {
      console.error('Error opening chat with call:', err);
    }
  };

  const closeChat = (conversationId) => {
    setOpenChats(prev => prev.filter(chat => chat.conversationId !== conversationId));
    setMinimizedChats(prev => {
      const newSet = new Set(prev);
      newSet.delete(conversationId);
      return newSet;
    });
  };

  const toggleMinimize = (conversationId) => {
    setMinimizedChats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId);
      } else {
        newSet.add(conversationId);
      }
      return newSet;
    });
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const handleNotificationClick = async (notification) => {
    removeNotification(notification.id);
    
    // Get conversation details
    try {
      const response = await API.get(`/chat/conversations/${notification.conversationId}`);
      const otherUser = response.data.participants.find(p => p._id !== user?.id);
      if (otherUser) {
        openChat(notification.conversationId, otherUser);
      }
    } catch (err) {
      console.error('Error opening chat:', err);
      alert('Failed to open chat. Please try again.');
    }
  };

  // Expose openChat function globally for other components
  useEffect(() => {
    window.openMessagePopup = openChat;
    return () => {
      delete window.openMessagePopup;
    };
  }, [openChats]);

  return (
    <>
      {/* Message Popups */}
      {openChats.map((chat, index) => (
        <div
          key={chat.conversationId}
          style={{
            right: `${16 + (index * (minimizedChats.has(chat.conversationId) ? 336 : 400))}px`
          }}
        >
          <MessagePopup
            conversationId={chat.conversationId}
            otherUser={chat.otherUser}
            onClose={() => closeChat(chat.conversationId)}
            onMinimize={() => toggleMinimize(chat.conversationId)}
            isMinimized={minimizedChats.has(chat.conversationId)}
            incomingCall={chat.incomingCall}
          />
        </div>
      ))}

      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map((notif, index) => (
          <div key={notif.id} style={{ marginTop: `${index * 100}px` }}>
            <MessageNotification
              message={notif}
              onClose={() => removeNotification(notif.id)}
              onClick={() => handleNotificationClick(notif)}
            />
          </div>
        ))}
      </div>
    </>
  );
}