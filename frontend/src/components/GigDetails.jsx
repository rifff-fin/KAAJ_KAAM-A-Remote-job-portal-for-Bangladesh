import React, { useEffect, useState } from 'react';
import API from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Star, Clock, Eye, TrendingUp } from 'lucide-react';

export default function GigDetails() {
  const { id } = useParams();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Get user with proper error handling
  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr || userStr === 'null') return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  };
  
  const user = getUserFromStorage();

  useEffect(() => {
    const fetchGigData = async () => {
      try {
        const gigRes = await API.get(`/gigs/${id}`);
        const gigData = gigRes.data;
        
        console.log('Fetched gig data:', {
          gigId: gigData._id,
          title: gigData.title,
          seller: gigData.seller,
          sellerId: gigData.seller?._id,
          sellerName: gigData.seller?.name
        });
        
        // Validate seller data exists
        if (!gigData.seller) {
          console.error('Gig seller data is missing!');
          alert('This gig has invalid seller information.');
          navigate('/gigs');
          return;
        }
        
        if (!gigData.seller._id) {
          console.error('Gig seller ID is missing!', gigData.seller);
          alert('This gig has invalid seller information.');
          navigate('/gigs');
          return;
        }
        
        // Fetch fresh seller data to get updated rating (optional enhancement)
        if (gigData.seller._id) {
          try {
            const sellerRes = await API.get(`/profile/${gigData.seller._id}`);
            if (sellerRes.data.user && sellerRes.data.user._id) {
              // Only merge rating if available, keep original seller data intact
              gigData.seller = {
                ...gigData.seller,
                rating: sellerRes.data.user.rating || gigData.seller.rating,
                profile: sellerRes.data.user.profile || gigData.seller.profile
              };
            }
          } catch (err) {
            console.error('Error fetching seller profile (non-critical):', err);
            // Continue with original gig seller data
          }
        }
        
        console.log('Final seller data:', gigData.seller);
        setGig(gigData);
      } catch (err) {
        console.error('Error fetching gig:', err);
        alert('Gig not found');
        navigate('/gigs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGigData();
  }, [id, navigate]);

  const handleContactSeller = async () => {
    if (!user) {
      alert('Please login to contact the seller');
      navigate('/login');
      return;
    }

    // Get user ID safely
    const currentUserId = user.id || user._id;
    const sellerId = gig?.seller?._id;
    
    console.log('Contact seller button clicked:', {
      gigExists: !!gig,
      gigId: gig?._id,
      gigTitle: gig?.title,
      sellerExists: !!gig?.seller,
      sellerObject: gig?.seller,
      sellerId: sellerId,
      currentUserId: currentUserId,
      fullGigData: gig
    });

    // Validate IDs exist
    if (!currentUserId) {
      console.error('Current user ID is missing!', { user });
      alert('Authentication error. Please log in again.');
      navigate('/login');
      return;
    }

    if (!gig) {
      console.error('Gig data is not loaded yet!');
      alert('Please wait for the page to load completely.');
      return;
    }

    if (!gig.seller) {
      console.error('Gig seller data is missing!', { gig });
      alert('Seller information is not available. The gig may be deleted or invalid.');
      return;
    }

    if (!sellerId) {
      console.error('Seller ID is missing from seller object!', { seller: gig.seller });
      alert('Seller ID is not available. Please refresh the page.');
      return;
    }

    // Check if user is trying to message themselves
    if (String(currentUserId) === String(sellerId)) {
      alert('You cannot message yourself');
      return;
    }

    try {
      console.log('Creating conversation with seller:', sellerId);
      
      // Create or get conversation with seller
      const response = await API.post('/chat/conversations', {
        participantId: sellerId,
        gigId: gig._id
      });
      
      console.log('Conversation created/retrieved:', response.data);
      
      const conversationId = response.data._id;
      const otherUser = gig.seller;

      // Open message popup
      if (window.openMessagePopup) {
        window.openMessagePopup(conversationId, otherUser);
      } else {
        // Fallback to chat page
        navigate(`/chat/${conversationId}`);
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message || 'Failed to start conversation';
      alert(errorMsg);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      alert('Please login to place an order');
      navigate('/login');
      return;
    }
    if (user.role !== 'buyer') {
      alert('Only buyers can place orders.');
      return;
    }
    if (gig?.seller?._id && (user._id || user.id) === gig.seller._id) {
      alert('You cannot order your own gig.');
      return;
    }

    try {
      await API.post('/orders/from-gig', { gigId: gig._id });
      navigate('/orders');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to place order';
      alert(msg);
    }
  };

  if (loading) return <p className="text-center py-20">Loading...</p>;
  if (!gig) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Image Section */}
            <div>
              {gig.thumbnail || gig.images?.[0] ? (
                <img
                  src={gig.thumbnail || gig.images[0]}
                  alt={gig.title}
                  className="w-full h-96 object-cover rounded-xl shadow-lg"
                />
              ) : (
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 h-96 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-semibold">No Image</span>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Eye className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <p className="text-sm text-gray-600">Views</p>
                  <p className="font-bold text-gray-900">{gig.stats?.views || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <p className="text-sm text-gray-600">Orders</p>
                  <p className="font-bold text-gray-900">{gig.stats?.orders || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Star className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="font-bold text-gray-900">{gig.seller?.rating?.average ? gig.seller.rating.average.toFixed(1) : '0'}</p>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="flex flex-col justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{gig.title}</h1>
                <p className="text-gray-700 mb-6 leading-relaxed">{gig.description}</p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Price</span>
                    <span className="text-3xl font-bold text-green-600">৳{gig.basePrice}</span>
                  </div>

                  <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">Delivery: <strong>{gig.deliveryDays} days</strong></span>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-gray-700">Category: <strong className="text-purple-700">{gig.category}</strong></p>
                  </div>
                </div>

                {/* Seller Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={gig.seller?.profile?.avatar || `https://i.pravatar.cc/60?u=${gig.seller?.name}`}
                    alt={gig.seller?.name}
                    className="w-14 h-14 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{gig.seller?.name}</p>
                    <p className="text-sm text-gray-600">{gig.seller?.profile?.bio || 'Freelancer'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {gig.seller?.rating?.average > 0 ? (
                        <>
                          <span className="text-sm font-medium">{gig.seller.rating.average.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">({gig.seller.rating.count} reviews)</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">No reviews yet</span>
                      )}
                    </div>
                    {user?.role === 'seller' && gig?.seller && String(user.id) === String(gig.seller?._id) && (
                      <p className="text-blue-700 font-medium text-sm mt-2">This is your gig</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-3">
                {user?.role === 'buyer' && gig.seller?._id !== user.id && (
                  <>
                    <button
                      onClick={handlePlaceOrder}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105"
                    >
                      Place Your Order
                    </button>
                    <button
                      onClick={handleContactSeller}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Contact Seller
                    </button>
                  </>
                )}

                {!user && (
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    Login to Place Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}