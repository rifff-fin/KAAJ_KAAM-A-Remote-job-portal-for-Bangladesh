// frontend/src/components/ReviewPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { Star, MessageSquare, User } from 'lucide-react';

export default function ReviewPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [reviewee, setReviewee] = useState(null);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [recommendation, setRecommendation] = useState(null); // For freelancers only
  const [categories, setCategories] = useState({
    communication: 5,
    quality: 5,
    timeliness: 5,
    professionalism: 5
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setUserRole(user.role === 'client' ? 'buyer' : user.role === 'freelancer' ? 'seller' : user.role);
  }, [user, navigate]);

  // Initialize categories based on user role
  useEffect(() => {
    if (userRole === 'seller') {
      // Freelancer reviewing a client
      setCategories({
        clientBehavior: 5,
        clearInstructions: 5,
        communication: 5,
        paymentOnTime: 5
      });
    } else if (userRole === 'buyer') {
      // Client reviewing a freelancer
      setCategories({
        communication: 5,
        quality: 5,
        timeliness: 5,
        professionalism: 5
      });
    }
    setRecommendation(null);
  }, [userRole]);

  useEffect(() => {
    if (!userRole) return;
    fetchOrderDetails();
    // eslint-disable-next-line
  }, [userRole]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/orders/${orderId}`);
      const fetchedOrder = res.data.order || res.data; // Handle both response formats
      
      setOrder(fetchedOrder);

      // Determine who to review based on user role
      if (userRole === 'buyer') {
        setReviewee(fetchedOrder.seller);
      } else if (userRole === 'seller') {
        setReviewee(fetchedOrder.buyer);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category, value) => {
    setCategories(prev => ({
      ...prev,
      [category]: parseInt(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError('Please write a review comment');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Review must be at least 10 characters');
      return;
    }

    // Freelancers must select a recommendation
    if (userRole === 'seller' && recommendation === null) {
      setError('Please select a recommendation for this client');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const reviewData = {
        orderId,
        rating,
        comment,
        categories,
        isAnonymous
      };

      // Add recommendation for freelancer reviews
      if (userRole === 'seller') {
        reviewData.recommendation = recommendation;
      }

      await API.post('/reviews', reviewData);

      setSuccess(true);
      setTimeout(() => {
        // Add timestamp to force refresh
        navigate(`/profile/${reviewee?._id || reviewee?.id}?refresh=${Date.now()}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Order not found</p>
          <button
            onClick={() => navigate('/orders')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-5">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/orders')}
            className="text-blue-500 hover:text-blue-600 mb-4"
          >
            ← Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Leave a Review</h1>
          <p className="text-sm text-gray-500 mt-2">Share your experience with this order</p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-xl p-6 shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase">Order</p>
              <p className="font-semibold text-gray-800">{order.title}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Price</p>
              <p className="font-semibold text-gray-800">৳{order.price}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">
                {userRole === 'buyer' ? 'Seller' : 'Buyer'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {reviewee?.profile?.avatar ? (
                  <img
                    src={reviewee.profile.avatar}
                    alt={reviewee.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                    {reviewee?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <p className="font-semibold text-gray-800">{reviewee?.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="bg-white rounded-xl p-8 shadow">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                <div className="text-green-600">✓</div>
                <div>
                  <p className="font-semibold text-green-800">Review submitted!</p>
                  <p className="text-sm text-green-700">Redirecting to profile...</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <div className="text-red-600">!</div>
                <div>
                  <p className="font-semibold text-red-800">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Overall Rating *
              </label>
              <div className="flex gap-4 items-center">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition"
                    >
                      <Star
                        size={32}
                        className={`${
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-2xl font-bold text-gray-800">{rating}.0</div>
              </div>
            </div>

            {/* Category Ratings */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                {userRole === 'seller' ? 'Rate Your Client' : 'Rate Your Service Provider'}
              </h3>
              <div className="space-y-5">
                {userRole === 'seller' ? (
                  // Freelancer reviewing a client
                  <>
                    {[
                      { key: 'clientBehavior', label: 'Client Behavior' },
                      { key: 'clearInstructions', label: 'Clear Instructions' },
                      { key: 'communication', label: 'Communication' },
                      { key: 'paymentOnTime', label: 'Payment on Time' }
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-700">{label}</label>
                          <span className="text-sm font-semibold text-gray-800">
                            {categories[key]}.0
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={categories[key]}
                          onChange={(e) => handleCategoryChange(key, e.target.value)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={16}
                              className={
                                star <= categories[key]
                                  ? 'fill-blue-500 text-blue-500'
                                  : 'text-gray-300'
                              }
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  // Buyer reviewing a freelancer
                  <>
                    {[
                      { key: 'communication', label: 'Communication' },
                      { key: 'quality', label: 'Quality of Work' },
                      { key: 'timeliness', label: 'Timeliness' },
                      { key: 'professionalism', label: 'Professionalism' }
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm text-gray-700">{label}</label>
                          <span className="text-sm font-semibold text-gray-800">
                            {categories[key]}.0
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={categories[key]}
                          onChange={(e) => handleCategoryChange(key, e.target.value)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={16}
                              className={
                                star <= categories[key]
                                  ? 'fill-blue-500 text-blue-500'
                                  : 'text-gray-300'
                              }
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Recommendation for Freelancers */}
            {userRole === 'seller' && (
              <div className="border-t pt-6">
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  Would you recommend this client? *
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setRecommendation(true)}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
                      recommendation === true
                        ? 'bg-green-500 text-white border-2 border-green-600'
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    ✓ Yes, Recommend
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecommendation(false)}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
                      recommendation === false
                        ? 'bg-red-500 text-white border-2 border-red-600'
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    ✗ Don't Recommend
                  </button>
                </div>
              </div>
            )}

            {/* Comment */}
            <div className="border-t pt-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Your Review Comment *
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Share specific details about your experience. Minimum 10 characters.
              </p>
              <textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setError('');
                }}
                placeholder="Tell others about your experience with this order..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="5"
              />
              <p className="text-xs text-gray-500 mt-2">
                {comment.length} characters (minimum 10)
              </p>
            </div>

            {/* Anonymous Option */}
            <div className="border-t pt-6 flex items-center gap-3">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 accent-blue-500 cursor-pointer"
              />
              <label htmlFor="anonymous" className="text-sm text-gray-700 cursor-pointer">
                Post this review anonymously
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || success}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
