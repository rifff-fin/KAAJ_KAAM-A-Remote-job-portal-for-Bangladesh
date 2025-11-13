import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';  // ← Import from socket.js

export default function Chat() {
  const { orderId } = useParams();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Connect & join room
    socket.connect();
    socket.emit('join_room', orderId);

    // Listen for messages
    const handleMessage = (data) => {
      setMessages(prev => [...prev, data]);
    };
    socket.on('receive_message', handleMessage);

    // Load old messages (optional later)
    // fetch(`/api/chat/${orderId}`).then(...)

    return () => {
      socket.off('receive_message', handleMessage);
      socket.emit('leave_room', orderId);
      socket.disconnect();
    };
  }, [orderId]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const msgData = {
      orderId,
      text: message,
      sender: user.name,
      time: new Date().toLocaleTimeString('en-US', { hour12: false })
    };

    socket.emit('send_message', msgData);
    setMessage('');
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-2xl h-96 md:h-[600px] flex flex-col">
        {/* Header */}
        <div className="border-b p-4 bg-blue-50">
          <h3 className="font-bold text-blue-800">Order Chat</h3>
          <p className="text-xs text-gray-600">Order ID: {orderId}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.sender === user.name ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg shadow-sm ${
                  m.sender === user.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border'
                }`}
              >
                <p className="text-xs font-medium opacity-80">{m.sender}</p>
                <p className="mt-1">{m.text}</p>
                <p className="text-xs opacity-70 mt-1">{m.time}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4 flex gap-2">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}