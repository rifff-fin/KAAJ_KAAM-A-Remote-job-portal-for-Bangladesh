import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css'; 

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [time, setTime] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Load user
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(stored);
  }, []);

  // Live BD Time
  useEffect(() => {
    const update = () => {
      const bd = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setTime(bd);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Logo */}
        <Link to="/" className="navbar-logo">KAAJ KAAM</Link>

        {/* Desktop Links */}
        <div className="navbar-links">
          <Link to="/" className="nav-link">Home</Link>

          {user?.role === 'seller' && (
            <>
              <Link to="/jobs" className="nav-link">Find Work</Link>
              <Link to="/seller-dashboard" className="nav-link">My Gigs</Link>
            </>
          )}

          {user?.role === 'buyer' && (
            <>
              <Link to="/post-job" className="nav-link">Post Job</Link>
              <Link to="/client-dashboard" className="nav-link">My Job Posts</Link>
            </>
          )}

          {user && (
            <>
              <Link to="/orders" className="nav-link">Orders</Link>
              <Link to="/profile" className="nav-link">Profile</Link>

              {/* User Info */}
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">
                  {user.role === 'seller' ? 'Freelancer' : 'Client'}
                </span>
                <span className="live-time">{time} BD</span>
              </div>

              <button onClick={logout} className="btn-logout">Logout</button>
            </>
          )}

          {!user && (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="btn-signup">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-link" onClick={() => setMobileOpen(false)}>Home</Link>

          {user?.role === 'seller' && (
            <>
              <Link to="/jobs" className="mobile-link" onClick={() => setMobileOpen(false)}>Find Work</Link>
              <Link to="/seller-dashboard" className="mobile-link" onClick={() => setMobileOpen(false)}>My Gigs</Link>
            </>
          )}

          {user?.role === 'buyer' && (
            <>
              <Link to="/post-job" className="mobile-link" onClick={() => setMobileOpen(false)}>Post Job</Link>
              <Link to="/client-dashboard" className="mobile-link" onClick={() => setMobileOpen(false)}>My Job Posts</Link>
            </>
          )}

          {user && (
            <>
              <Link to="/orders" className="mobile-link" onClick={() => setMobileOpen(false)}>Orders</Link>
              <Link to="/profile" className="mobile-link" onClick={() => setMobileOpen(false)}>Profile</Link>

              {/* User info */}
              <div className="mobile-user-info">
                <div>
                  <strong>{user.name}</strong> • {user.role === 'seller' ? 'Freelancer' : 'Client'}
                </div>
                <div className="live-time">{time} BD</div>
              </div>

              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="mobile-logout"
              >
                Logout
              </button>
            </>
          )}

          {!user && (
            <>
              <Link to="/login" className="mobile-link" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/signup" className="mobile-signup" onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
