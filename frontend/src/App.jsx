import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import SellerDashboard from './components/SellerDashboard';
import CreateGig from './components/CreateGig';
import PostJob from './components/PostJob';          // ← ONLY ONE
import Jobs from './components/Jobs';
import GigDetails from './components/GigDetails';
import Orders from './components/Orders';
import Chat from './components/Chat';
import Profile from './components/Profile';
import ClientDashboard from './components/ClientDashboard';

import './App.css';
import './index.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} />
        <Route path="/create-gig" element={<CreateGig />} />
        <Route path="/post-job" element={<PostJob />} /> {/* ← ONLY ONE */}
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/gig/:id" element={<GigDetails />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/chat/:orderId" element={<Chat />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;