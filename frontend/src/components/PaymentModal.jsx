// frontend/src/components/PaymentModal.jsx
import React, { useState } from 'react';
import { X, CreditCard, Smartphone, DollarSign } from 'lucide-react';
import API from '../api';

export default function PaymentModal({ isOpen, onClose, onSuccess, order, setToast }) {
  const [step, setStep] = useState(1); // 1: Payment Method, 2: Payment Details, 3: OTP
  const [method, setMethod] = useState('');
  const [details, setDetails] = useState({});
  const [paymentId, setPaymentId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const paymentMethods = [
    { id: 'bkash', name: 'bKash', icon: '💳', color: 'bg-pink-500' },
    { id: 'nagad', name: 'Nagad', icon: '📱', color: 'bg-orange-500' },
    { id: 'card', name: 'Card', icon: '💳', color: 'bg-blue-500' },
    { id: 'bank', name: 'Bank Transfer', icon: '🏦', color: 'bg-green-500' }
  ];

  const handleMethodSelect = (methodId) => {
    setMethod(methodId);
    setDetails({});
    setError('');
    setStep(2);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setMethod('');
      setDetails({});
      setError('');
    } else if (step === 3) {
      setStep(2);
      setOtp('');
      setError('');
    }
  };

  const handleSubmitDetails = async () => {
    setError('');
    
    // Validate details based on payment method
    if (method === 'bkash' || method === 'nagad') {
      if (!details.phoneNumber || details.phoneNumber.length !== 11) {
        setError('Please enter a valid 11-digit phone number');
        return;
      }
      if (!details.transactionId) {
        setError('Please enter transaction ID');
        return;
      }
    } else if (method === 'card') {
      if (!details.lastFourDigits || details.lastFourDigits.length !== 4) {
        setError('Please enter last 4 digits of card');
        return;
      }
      if (!details.transactionId) {
        setError('Please enter transaction ID');
        return;
      }
    } else if (method === 'bank') {
      if (!details.accountNumber) {
        setError('Please enter account number');
        return;
      }
      if (!details.transactionId) {
        setError('Please enter transaction ID');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await API.post('/payments/request', {
        orderId: order._id,
        method,
        details
      });

      if (response.data.paymentId) {
        setPaymentId(response.data.paymentId);
        setError('');
        setStep(3);
      } else {
        setError('Failed to process payment request');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process payment request');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await API.post('/payments/verify', {
        paymentId,
        otp
      });

      if (setToast) {
        setToast({ message: 'Payment completed successfully! The seller can now start working.', type: 'success' });
      }
      onSuccess(response.data.order);
      handleClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid OTP. Please try again.';
      setError(errorMsg);
      
      if (errorMsg.includes('failed') || errorMsg.includes('expired')) {
        if (setToast) {
          setToast({ message: errorMsg, type: 'error' });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setMethod('');
    setDetails({});
    setPaymentId('');
    setOtp('');
    setError('');
    setLoading(false);
    onClose();
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-blue-600" />
            Payment
          </h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="p-6 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-gray-600 mb-1">Order</p>
          <p className="font-semibold text-gray-900 mb-2">{order.title}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Amount to Pay</span>
            <span className="text-2xl font-bold text-blue-600">৳{order.price}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Step 1: Select Payment Method */}
        {step === 1 && (
          <div className="p-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</p>
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => handleMethodSelect(pm.id)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition flex items-center gap-3"
                >
                  <div className={`${pm.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                    {pm.icon}
                  </div>
                  <span className="font-semibold text-gray-800">{pm.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Enter Payment Details */}
        {step === 2 && (
          <div className="p-6">
            <button onClick={handleBack} className="text-sm text-gray-600 hover:text-gray-800 mb-4">
              ← Back
            </button>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600">Payment via {method.toUpperCase()}</p>
              <p className="text-xl font-bold text-blue-600">৳{order.price}</p>
            </div>

            <div className="space-y-4">
              {(method === 'bkash' || method === 'nagad') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={details.phoneNumber || ''}
                      onChange={(e) => setDetails({ ...details, phoneNumber: e.target.value })}
                      placeholder="01XXXXXXXXX"
                      maxLength="11"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={details.transactionId || ''}
                      onChange={(e) => setDetails({ ...details, transactionId: e.target.value })}
                      placeholder="Enter transaction ID"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {method === 'card' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last 4 Digits of Card
                    </label>
                    <input
                      type="text"
                      value={details.lastFourDigits || ''}
                      onChange={(e) => setDetails({ ...details, lastFourDigits: e.target.value })}
                      placeholder="1234"
                      maxLength="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={details.transactionId || ''}
                      onChange={(e) => setDetails({ ...details, transactionId: e.target.value })}
                      placeholder="Enter transaction ID"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {method === 'bank' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={details.accountNumber || ''}
                      onChange={(e) => setDetails({ ...details, accountNumber: e.target.value })}
                      placeholder="Enter account number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={details.transactionId || ''}
                      onChange={(e) => setDetails({ ...details, transactionId: e.target.value })}
                      placeholder="Enter transaction ID"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleSubmitDetails}
              disabled={loading}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Continue to OTP'}
            </button>
          </div>
        )}

        {/* Step 3: OTP Verification */}
        {step === 3 && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Enter OTP</h3>
              <p className="text-sm text-gray-600">
                A 6-digit OTP has been sent to your registered email address
              </p>
            </div>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength="6"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6"
            />

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Complete Payment'}
            </button>

            <button
              onClick={handleBack}
              disabled={loading}
              className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm disabled:opacity-50"
            >
              Back to Payment Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
