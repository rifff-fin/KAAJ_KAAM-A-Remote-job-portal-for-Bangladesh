// frontend/src/components/OrdersPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { FiMessageSquare, FiCheckCircle, FiClock, FiX } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import './OrdersPage.css';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [userRole, setUserRole] = useState('buyer');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setUserRole(user.role);
    fetchOrders();
  }, [user, navigate, activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await API.get('/orders', {
        params: {
          role: userRole,
          status: activeTab === 'all' ? undefined : activeTab
        }
      });

      setOrders(response.data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = (orderId) => {
    navigate(`/chat/${orderId}`);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await API.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#fbbf24',
      active: '#3b82f6',
      completed: '#10b981',
      cancelled: '#ef4444',
      disputed: '#f97316'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle />;
      case 'pending':
      case 'active':
        return <FiClock />;
      case 'cancelled':
        return <FiX />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="orders-page loading">
        <div className="spinner">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p className="subtitle">
          {userRole === 'buyer' ? 'Orders you placed' : 'Orders assigned to you'}
        </p>
      </div>

      {/* Tabs */}
      <div className="orders-tabs">
        {['all', 'pending', 'active', 'completed', 'cancelled'].map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="orders-container">
        {orders.length === 0 ? (
          <div className="empty-state">
            <FiMessageSquare size={48} />
            <p>No orders yet</p>
            <small>
              {userRole === 'buyer'
                ? 'Browse gigs or post a job to get started'
                : 'Wait for buyers to hire you'}
            </small>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-title">
                    <h3>{order.title}</h3>
                    <p className="order-id">Order ID: {order._id.slice(-8)}</p>
                  </div>
                  <div
                    className="order-status"
                    style={{ borderColor: getStatusColor(order.status) }}
                  >
                    {getStatusIcon(order.status)}
                    <span>{order.status.toUpperCase()}</span>
                  </div>
                </div>

                <div className="order-details">
                  <div className="detail-item">
                    <span className="label">Price</span>
                    <span className="value">৳{order.price}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Delivery</span>
                    <span className="value">{order.deliveryDays} days</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Due Date</span>
                    <span className="value">
                      {formatDistanceToNow(new Date(order.dueDate), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">
                      {userRole === 'buyer' ? 'Seller' : 'Buyer'}
                    </span>
                    <span className="value">
                      {userRole === 'buyer'
                        ? order.seller?.name
                        : order.buyer?.name}
                    </span>
                  </div>
                </div>

                <div className="order-actions">
                  <button
                    className="btn-chat"
                    onClick={() => handleChat(order.conversationId)}
                  >
                    <FiMessageSquare size={18} />
                    Chat
                  </button>

                  {userRole === 'seller' && order.status === 'active' && (
                    <button
                      className="btn-complete"
                      onClick={() => handleStatusUpdate(order._id, 'completed')}
                    >
                      Mark Complete
                    </button>
                  )}

                  {userRole === 'buyer' && order.status === 'completed' && (
                    <button
                      className="btn-review"
                      onClick={() => navigate(`/review/${order._id}`)}
                    >
                      Leave Review
                    </button>
                  )}

                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <button
                      className="btn-cancel"
                      onClick={() => {
                        if (window.confirm('Cancel this order?')) {
                          handleStatusUpdate(order._id, 'cancelled');
                        }
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
