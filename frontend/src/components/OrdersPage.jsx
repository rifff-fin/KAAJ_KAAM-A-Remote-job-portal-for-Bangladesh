// frontend/src/components/OrdersPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import {
  FiMessageSquare,
  FiCheckCircle,
  FiClock,
  FiX
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [userRole, setUserRole] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const normalized =
      user.role === 'client' ? 'buyer' :
      user.role === 'freelancer' ? 'seller' :
      user.role || 'buyer';
    setUserRole(normalized);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!user || !userRole) return;
    fetchOrders();
    // eslint-disable-next-line
  }, [activeTab, userRole]);

const fetchOrders = async () => {
  try {
    setLoading(true);
    const params = { role: userRole };
    if (activeTab !== 'all') params.status = activeTab;

    const res = await API.get('/orders', { params });
    const incoming = res.data.orders || [];

    // Filter orders so cancelled orders only appear in 'cancelled' tab
    const filtered = activeTab === 'all'
      ? incoming.filter(o => o.status !== 'cancelled') // exclude cancelled
      : incoming;

    setOrders(filtered);
  } catch (err) {
    console.error('Error fetching orders:', err);
  } finally {
    setLoading(false);
  }
};


  const handleChat = (conversationId) => {
    navigate(`/chat/${conversationId}`);
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await API.put(`/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch {
      alert('Failed to update order status');
    }
  };

  const statusStyles = {
    pending: 'border-yellow-400 text-yellow-600',
    active: 'border-blue-500 text-blue-600',
    completed: 'border-green-500 text-green-600',
    cancelled: 'border-red-500 text-red-600',
    disputed: 'border-orange-500 text-orange-600'
  };

  const statusIcon = (status) => {
    if (status === 'completed') return <FiCheckCircle />;
    if (status === 'pending' || status === 'active') return <FiClock />;
    if (status === 'cancelled') return <FiX />;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-5">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
          <p className="text-sm text-gray-500">
            {userRole === 'buyer'
              ? 'Orders you placed'
              : 'Orders assigned to you'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 overflow-x-auto border-b pb-3 mb-6">
          {['all', 'pending', 'active', 'completed', 'cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl py-16 flex flex-col items-center text-gray-400 gap-3">
            <FiMessageSquare size={48} />
            <p className="text-lg font-medium">No orders yet</p>
            <small>
              {userRole === 'buyer'
                ? 'Browse gigs or post a job to get started'
                : 'Wait for buyers to hire you'}
            </small>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div
                key={order._id}
                className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition"
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {order.title}
                    </h3>
                    <p className="text-xs text-gray-400">
                      Order ID: {order._id.slice(-8)}
                    </p>
                  </div>

                  <div
                    className={`flex items-center gap-2 px-3 py-2 border-2 rounded-lg text-xs font-semibold uppercase ${statusStyles[order.status]}`}
                  >
                    {statusIcon(order.status)}
                    {order.status}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b pb-4 mb-4">
                  <Detail label="Price" value={`৳${order.price}`} />
                  <Detail label="Delivery" value={`${order.deliveryDays} days`} />
                  <Detail
                    label="Due"
                    value={formatDistanceToNow(new Date(order.dueDate), {
                      addSuffix: true
                    })}
                  />
                  <Detail
                    label={userRole === 'buyer' ? 'Seller' : 'Buyer'}
                    value={
                      userRole === 'buyer'
                        ? order.seller?.name
                        : order.buyer?.name
                    }
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row gap-3">
                  <ActionButton
                    label="Chat"
                    color="blue"
                    icon={<FiMessageSquare />}
                    onClick={() => handleChat(order.conversationId)}
                  />
                 {/* Buyer-only Confirm Payment */}
  {userRole === "buyer" &&
    order.status === "active" &&
    order.paymentStatus === "pending" && (
      <button
        onClick={() => handleConfirmPayment(order._id)}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Confirm Payment
      </button>
  )}

                  {userRole === 'seller' && order.status === 'pending' && (
                    <ActionButton
                      label="Confirm"
                      color="green"
                      onClick={() => handleStatusUpdate(order._id, 'active')}
                    />
                  )}

                  {userRole === 'seller' && order.status === 'active' && (
                    <ActionButton
                      label="Mark Complete"
                      color="green"
                      onClick={() =>
                        handleStatusUpdate(order._id, 'completed')
                      }
                    />
                  )}

                  {userRole === 'buyer' && order.status === 'completed' && (
                    <ActionButton
                      label="Leave Review"
                      color="purple"
                      onClick={() => navigate(`/review/${order._id}`)}
                    />
                  )}

                  {order.status !== 'completed' &&
                    order.status !== 'cancelled' && (
                      <ActionButton
                        label="Cancel"
                        color="gray"
                        onClick={() => {
                          if (window.confirm('Cancel this order?')) {
                            handleStatusUpdate(order._id, 'cancelled');
                          }
                        }}
                      />
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
const handleConfirmPayment = async (orderId) => {
  try {
    await API.put(`/orders/${orderId}/pay`);
    fetchOrders(); // refresh orders
  } catch (error) {
    alert(error.response?.data?.message || "Payment failed");
  }
};

/* ------------------ SMALL COMPONENTS ------------------ */

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase text-gray-400 font-medium">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function ActionButton({ label, onClick, color, icon }) {
  const styles = {
    blue: 'bg-blue-500 hover:bg-blue-600 text-white',
    green: 'bg-green-500 hover:bg-green-600 text-white',
    purple: 'bg-purple-500 hover:bg-purple-600 text-white',
    gray: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${styles[color]}`}
    >
      {icon}
      {label}
    </button>
  );
}
