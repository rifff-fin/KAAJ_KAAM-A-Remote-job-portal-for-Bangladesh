import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const [time, setTime] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="bg-white navbar-shadow sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center py-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-blue-600">
          KAAJ KAAM
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/jobs" className="text-gray-700 hover:text-blue-600 font-medium">Find Work</Link>
          <Link to="/post-job" className="text-gray-700 hover:text-blue-600 font-medium">Post Job</Link>
          
          {user ? (
            <>
              <div className="flex items-center space-x-3 text-sm">
                <span className="font-medium">{user.name}</span>
                <span className="text-gray-400">•</span>
                <span className="text-blue-600 font-medium">
                  {user.role === 'seller' ? 'Freelancer' : 'Client'}
                </span>
                <span className="text-gray-400">•</span>
                <span className="font-mono text-gray-500">{time} BD</span>
              </div>
              <button onClick={logout} className="btn-danger">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">Login</Link>
              <Link to="/signup" className="btn-primary">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden">
          Menu
        </button>
      </div>
    </nav>
  );
}