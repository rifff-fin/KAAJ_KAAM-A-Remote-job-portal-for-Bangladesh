import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import SellerDashboard from './components/SellerDashboard';
import CreateGig from './components/CreateGig';
import PostJob from './components/PostJob';
import Jobs from './components/Jobs';
import GigDetails from './components/GigDetails';
import OrdersPage from './components/OrdersPage';
import ChatWindow from './components/ChatWindow';
import MessagesList from './components/MessagesList';
import Profile from './components/Profile';
import ClientDashboard from './components/ClientDashboard';
import MessageManager from './components/MessageManager';

import './App.css';
import './index.css';

function App() {
  return (
    <Router>
      <Navbar />
      <MessageManager />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} />
        <Route path="/create-gig" element={<CreateGig />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/gig/:id" element={<GigDetails />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/messages" element={<MessagesList />} />
        <Route path="/chat/:conversationId" element={<ChatWindow />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;