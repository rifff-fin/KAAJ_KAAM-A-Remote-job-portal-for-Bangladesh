import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'https://kaajkaam.onrender.com'  // Your Render URL
  : 'http://localhost:8080';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true
});

socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});