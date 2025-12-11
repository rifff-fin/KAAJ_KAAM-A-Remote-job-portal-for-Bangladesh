// src/utils/auth.js
// Custom event for auth state changes
export const AUTH_CHANGE_EVENT = 'authStateChange';

export const setAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // Dispatch custom event to notify all components
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Dispatch custom event to notify all components
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const getUser = () => {
  return JSON.parse(localStorage.getItem('user') || 'null');
};

export const getToken = () => {
  return localStorage.getItem('token');
};
