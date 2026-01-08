// src/components/Login.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { setAuthData } from '../utils/auth';
import Toast from './Toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);
  const navigate = useNavigate();

  // Cloudflare Turnstile Site Key
  const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

  // Setup Turnstile widget
  useEffect(() => {
    // Wait for Turnstile script to load
    const checkTurnstile = setInterval(() => {
      if (window.turnstile && turnstileRef.current) {
        clearInterval(checkTurnstile);
        
        // Render Turnstile widget
        window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => {
            setTurnstileToken(token);
          },
          theme: 'light',
        });
      }
    }, 100);

    return () => {
      clearInterval(checkTurnstile);
      if (window.turnstile && turnstileRef.current) {
        window.turnstile.remove(turnstileRef.current);
      }
    };
  }, []);

  // Validation similar to Signup
  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "Email required";
    else if (!form.email.includes("@")) newErrors.email = "Enter valid email";

    if (!form.password) newErrors.password = "Password required";
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return; // stop if validation fails

    // Check if Turnstile token exists
    if (!turnstileToken) {
      setToast({ message: 'Please complete the security check', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // Explicitly send fields to backend including Turnstile token
      const res = await API.post('/auth/login', {
        email: form.email.trim(),
        password: form.password,
        turnstileToken: turnstileToken,
      });

      // Save token and user
      setAuthData(res.data.token, res.data.user);

      setToast({ message: `Welcome back, ${res.data.user.name}!`, type: 'success' });
      setTimeout(() => navigate('/'), 2000); // redirect to dashboard/home
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Login failed", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-blue-50">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">

        <h2 className="text-center text-3xl font-bold mb-6">Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 border rounded-lg"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border rounded-lg"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Cloudflare Turnstile Widget */}
          <div className="flex justify-center">
            <div ref={turnstileRef}></div>
          </div>

          <button
            type="submit"
            disabled={loading || !turnstileToken}
            className="w-full bg-blue-600 text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
