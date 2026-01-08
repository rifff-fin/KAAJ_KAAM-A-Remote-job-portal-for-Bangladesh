// src/components/Signup.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api';
import { setAuthData } from '../utils/auth';
import Toast from './Toast';

export default function Signup() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Cloudflare Turnstile Site Key
  const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

  // Auto-set role from URL
  useEffect(() => {
    const role = searchParams.get("role");
    if (role === "buyer" || role === "seller") {
      setForm((prev) => ({ ...prev, role }));
    }
  }, [searchParams]);

  // Setup Turnstile widget
  useEffect(() => {
    const checkTurnstile = setInterval(() => {
      if (window.turnstile && turnstileRef.current) {
        clearInterval(checkTurnstile);
        
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

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name required";
    if (!form.email.includes("@")) newErrors.email = "Valid email required";
    if (form.password.length < 6) newErrors.password = "Password 6+ chars";
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!form.role) newErrors.role = "Select a role";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Check if Turnstile token exists
    if (!turnstileToken) {
      setToast({ message: 'Please complete the security check', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      const res = await API.post("/auth/signup", {
        ...data,
        turnstileToken: turnstileToken
      });

      setAuthData(res.data.token, res.data.user);

      setToast({ message: `Welcome, ${res.data.user.name}!`, type: 'success' });
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Signup failed", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">

        {/* ROLE SELECTION */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <button
            type="button"
            onClick={() => setForm({ ...form, role: "buyer" })}
            className={`p-5 rounded-xl border-2 ${
              form.role === "buyer"
                ? "border-blue-600 bg-blue-50 shadow"
                : "border-gray-300"
            }`}
          >
            Buyer
          </button>

          <button
            type="button"
            onClick={() => setForm({ ...form, role: "seller" })}
            className={`p-5 rounded-xl border-2 ${
              form.role === "seller"
                ? "border-green-600 bg-green-50 shadow"
                : "border-gray-300"
            }`}
          >
            Seller
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 border rounded-lg"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-lg"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded-lg"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full p-3 border rounded-lg"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
          />

          {/* Cloudflare Turnstile Widget */}
          <div className="flex justify-center">
            <div ref={turnstileRef}></div>
          </div>

          <button
            disabled={loading || !form.role || !turnstileToken}
            className="w-full bg-blue-600 text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-4">
          Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
}
