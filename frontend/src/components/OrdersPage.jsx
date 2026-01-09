// frontend/src/components/OrdersPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import CancelOrderModal from './CancelOrderModal';
import Toast from './Toast';
import {
  FiMessageSquare,
  FiCheckCircle,
  FiClock,
  FiX,
  FiInfo
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import DeliveryModal from './DeliveryModal';
import OrderDetailsModal from './OrderDetailsModal';
import DeliveryRejectModal from './DeliveryRejectModal';
import PaymentModal from './PaymentModal';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [userRole, setUserRole] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState(new Set());
  const [error, setError] = useState('');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState(null);
  const [toast, setToast] = useState(null);

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
    fetchReviewedOrders();
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

const fetchReviewedOrders = async () => {
  try {
    const res = await API.get('/reviews/my-reviews');
    const reviews = res.data.reviews || [];
    const reviewedOrderIds = new Set(
      reviews.map(r => {
        // Ensure we convert to string for proper comparison
        const orderId = typeof r.order === 'object' ? r.order._id : r.order;
        return String(orderId);
      })
    );
    console.log('Fetched reviews:', reviews);
    console.log('Reviewed order IDs:', Array.from(reviewedOrderIds));
    setReviewedOrders(reviewedOrderIds);
  } catch (err) {
    console.error('Error fetching reviewed orders:', err);
  }
};


  const handleChat = (conversationId) => {
    navigate(`/chat/${conversationId}`);
  };

  const handleConfirmPayment = (order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (updatedOrder) => {
    // Update the order in state with the updated order data
    setOrders(prevOrders => 
      prevOrders.map(o => o._id === updatedOrder._id ? updatedOrder : o)
    );
    
    // Refresh orders in background
    fetchOrders();
  };

  const handleRejectJobApplication = async (order) => {
    if (!window.confirm('Are you sure you want to reject this application?')) {
      return;
    }

    try {
      const jobId = order.job?._id || order.job;
      await API.post(`/jobs/${jobId}/reject-application`, { 
        freelancerId: order.seller._id 
      });
      setToast({ message: 'Application rejected', type: 'success' });
      fetchOrders();
    } catch (err) {
      console.error('Reject error:', err);
      setToast({ 
        message: err?.response?.data?.message || 'Failed to reject application', 
        type: 'error' 
      });
    }
  };

  const handleCancelOrder = async (orderId, reason) => {
    try {
      await API.delete(`/orders/${orderId}`, { 
        data: { reason } 
      });
      setToast({ message: 'Order cancelled successfully', type: 'success' });
      setSelectedOrderToCancel(null);
      fetchOrders();
    } catch (err) {
      console.error('Cancel error:', err);
      setToast({ 
        message: err?.response?.data?.message || 'Failed to cancel order', 
        type: 'error' 
      });
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const response = await API.post(`/orders/${orderId}/accept`);
      
      // Update the order in state immediately with the response data
      if (response.data) {
        setOrders(prevOrders => 
          prevOrders.map(o => o._id === orderId ? response.data : o)
        );
      }
      
      setToast({ message: 'Order accepted successfully! Payment deadline set for 7 days.', type: 'success' });
      
      // Refresh orders and profile in background
      fetchOrders();
      
      try {
        const profileRes = await API.get('/profile/me');
        if (profileRes.data.success && profileRes.data.user) {
          localStorage.setItem('user', JSON.stringify(profileRes.data.user));
          window.dispatchEvent(new Event('userUpdated'));
        }
      } catch (refreshErr) {
        console.error('Error refreshing profile:', refreshErr);
      }
    } catch (err) {
      setToast({ message: err?.response?.data?.message || 'Failed to accept order', type: 'error' });
    }
  };

  const handleStatusUpdate = async (orderId, status, reason = '') => {
    try {
      const updateData = { status };
      if (reason) updateData.cancellationReason = reason;
      await API.put(`/orders/${orderId}/status`, updateData);
      fetchOrders();
      
      // Refresh orders and profile - even if these fail, status update succeeded
      try {
        await fetchOrders();
        
        const profileRes = await API.get('/profile/me');
        if (profileRes.data.success && profileRes.data.user) {
          localStorage.setItem('user', JSON.stringify(profileRes.data.user));
          window.dispatchEvent(new Event('userUpdated'));
        }
      } catch (refreshErr) {
        console.error('Error refreshing data:', refreshErr);
        // Don't show error - status update already succeeded
      }

      setToast({ message: 'Order status updated successfully!', type: 'success' });
    } catch {
      setToast({ message: 'Failed to update order status', type: 'error' });
    }
  };

  const statusStyles = {
    pending: 'border-yellow-400 text-yellow-600',
    activated: 'border-blue-400 text-blue-600',
    in_progress: 'border-blue-500 text-blue-700',
    delivered: 'border-purple-500 text-purple-600',
    completed: 'border-green-500 text-green-600',
    cancelled: 'border-red-500 text-red-600',
    disputed: 'border-orange-500 text-orange-600'
  };

  const statusIcon = (status) => {
    if (status === 'completed') return <FiCheckCircle />;
    if (status === 'pending' || status === 'activated' || status === 'in_progress' || status === 'delivered') return <FiClock />;
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

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <div className="text-red-600 font-bold">!</div>
            <div>
              <p className="font-semibold text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

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
          {['all', 'pending', 'activated', 'in_progress', 'delivered', 'completed', 'cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab === 'in_progress' ? 'In Progress' : tab}
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
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {order.title}
                      </h3>
                      {order.job && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                          Job
                        </span>
                      )}
                      {order.gig && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          Gig
                        </span>
                      )}
                    </div>
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
                    value={
                      order.dueDate && !isNaN(new Date(order.dueDate).getTime())
                        ? formatDistanceToNow(new Date(order.dueDate), {
                            addSuffix: true
                          })
                        : 'Not set'
                    }
                  />
                  <Detail
                    label={userRole === 'buyer' ? 'Seller' : 'Buyer'}
                    value={
                      userRole === 'buyer'
                        ? order.seller?.name || 'Unknown'
                        : order.buyer?.name || 'Unknown'
                    }
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row gap-3">
                  <ActionButton
                    label="Details"
                    color="purple"
                    icon={<FiInfo />}
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowDetailsModal(true);
                    }}
                  />
                  <ActionButton
                    label="Chat"
                    color="blue"
                    icon={<FiMessageSquare />}
                    onClick={() => handleChat(order.conversationId)}
                  />
                 {/* Buyer Hire/Reject for Job Orders (pending status) */}
  {userRole === "buyer" &&
    order.status === "pending" &&
    order.job && (
      <>
        <ActionButton
          label="Hire"
          color="green"
          onClick={() => handleConfirmPayment(order)}
        />
        <ActionButton
          label="Reject"
          color="red"
          onClick={() => handleRejectJobApplication(order)}
        />
      </>
  )}

  {/* Buyer Confirm Payment for Job Orders (activated status - after hire) */}
  {userRole === "buyer" &&
    order.status === "activated" &&
    order.paymentStatus === "pending" &&
    order.job && (
      <ActionButton
        label="Confirm Payment"
        color="green"
        onClick={() => handleConfirmPayment(order)}
      />
  )}

  {/* Buyer Confirm Payment for Gig Orders (activated status) */}
  {userRole === "buyer" &&
    order.status === "activated" &&
    order.paymentStatus === "pending" &&
    order.gig && (
      <ActionButton
        label="Confirm Payment"
        color="green"
        onClick={() => handleConfirmPayment(order)}
      />
  )}

                  {/* Seller Confirm - Only for gig orders (no job), not for job applications */}
                  {userRole === 'seller' && 
                   order.status === 'pending' && 
                   !order.job && 
                   order.gig && (
                    <ActionButton
                      label="Confirm"
                      color="green"
                      onClick={() => handleAcceptOrder(order._id)}
                    />
                  )}

                  {userRole === 'seller' && order.status === 'in_progress' && (
                    <ActionButton
                      label="Deliver Order"
                      color="green"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDeliveryModal(true);
                      }}
                    />
                  )}

                  {userRole === 'seller' && order.status === 'activated' && order.paymentStatus !== 'completed' && (
                    <ActionButton
                      label="Deliver Order"
                      color="gray"
                      disabled={true}
                    />
                  )}

                  {/* Accept/Reject Delivery Buttons (Buyer Only) */}
                  {userRole === 'buyer' && order.status === 'delivered' && order.delivery?.status === 'pending' && (
                    <>
                      <ActionButton
                        label="Accept Delivery"
                        color="green"
                        onClick={async () => {
                          try {
                            await API.post(`/orders/${order._id}/delivery/accept`);
                            setToast({ message: 'Delivery accepted successfully!', type: 'success' });
                            await fetchOrders();
                          } catch (err) {
                            setToast({ message: err?.response?.data?.message || 'Failed to accept delivery', type: 'error' });
                          }
                        }}
                      />
                      <ActionButton
                        label="Reject Delivery"
                        color="red"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowRejectModal(true);
                        }}
                      />
                    </>
                  )}

                  {/* Review Button - Shows after delivery acceptance, completion, or cancellation for both buyer and seller */}
                  {((order.status === 'delivered' && order.delivery?.status === 'accepted') || order.status === 'completed' || order.status === 'cancelled') ? (
                    (() => {
                      const orderId = String(order._id);
                      const isReviewed = reviewedOrders.has(orderId);
                      console.log(`Order ${orderId} reviewed:`, isReviewed);
                      return isReviewed ? (
                        <ActionButton
                          label="Reviewed"
                          color="gray"
                          onClick={() => {
                            setError('You already reviewed this order');
                            setTimeout(() => setError(''), 3000);
                          }}
                          disabled={true}
                        />
                      ) : (
                        <ActionButton
                          label="Leave Review"
                          color="purple"
                          onClick={() => navigate(`/review/${order._id}`)}
                        />
                      );
                    })()
                  ) : null}

                  {/* Cancel Button - Hide after delivery is accepted or order is completed */}
                  {order.status !== 'completed' &&
                    order.status !== 'cancelled' &&
                    order.delivery?.status !== 'accepted' && (
                      <ActionButton
                        label="Cancel"
                        color="gray"
                        onClick={() => setSelectedOrderToCancel(order)}
                      />
                    )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delivery Modal */}
        {showDeliveryModal && selectedOrder && (
          <DeliveryModal
            order={selectedOrder}
            onClose={() => {
              setShowDeliveryModal(false);
              setSelectedOrder(null);
            }}
            onSuccess={fetchOrders}
          />
        )}

        {/* Order Details Modal */}
        {showDetailsModal && selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedOrder(null);
            }}
          />
        )}

        {/* Reject Delivery Modal */}
        {showRejectModal && selectedOrder && (
          <DeliveryRejectModal
            order={selectedOrder}
            onClose={() => {
              setShowRejectModal(false);
              setSelectedOrder(null);
            }}
            onSuccess={fetchOrders}
          />
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedOrder && (
          <PaymentModal
            isOpen={showPaymentModal}
            order={selectedOrder}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedOrder(null);
            }}
            onSuccess={handlePaymentSuccess}
            setToast={setToast}
          />
        )}
      </div>

      {/* Cancel Order Modal */}
      {selectedOrderToCancel && (
        <CancelOrderModal
          order={selectedOrderToCancel}
          onClose={() => setSelectedOrderToCancel(null)}
          onConfirm={handleCancelOrder}
        />
      )}
    </div>
  );
}

/* ------------------ SMALL COMPONENTS ------------------ */

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase text-gray-400 font-medium">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function ActionButton({ label, onClick, color, icon, disabled }) {
  const styles = {
    blue: 'bg-blue-500 hover:bg-blue-600 text-white',
    green: 'bg-green-500 hover:bg-green-600 text-white',
    purple: 'bg-purple-500 hover:bg-purple-600 text-white',
    red: 'bg-red-500 hover:bg-red-600 text-white',
    gray: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${styles[color]} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {icon}
      {label}
    </button>
  );
}
