import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'https://kaajkaam.onrender.com'  //abar render e add korte hbe
  : 'http://localhost:8080';

// Get user ID safely
const getUserId = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user?.id || null;
  } catch {
    return null;
  }
};

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  query: () => ({
    userId: getUserId()
  })
});

socket.on('connect', () => {
  const userId = getUserId();
  console.log('Connected to server:', socket.id, 'User:', userId);
  
  // Emit user online status
  if (userId) {
    socket.emit('user_online', userId);
  }
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Reconnection handling
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected to server after', attemptNumber, 'attempts');
  const userId = getUserId();
  if (userId) {
    socket.emit('user_online', userId);
  }
});
