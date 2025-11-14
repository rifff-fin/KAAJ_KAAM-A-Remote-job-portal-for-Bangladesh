import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api';

export default function Signup() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Auto-set role from URL
  useEffect(() => {
    const role = searchParams.get("role");
    if (role === "buyer" || role === "seller") {
      setForm((prev) => ({ ...prev, role }));
    }
  }, [searchParams]);

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

    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      const res = await API.post("/auth/signup", data);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert(`Welcome, ${res.data.user.name}!`);
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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

          <button
            disabled={loading || !form.role}
            className="w-full bg-blue-600 text-white p-3 rounded-lg"
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