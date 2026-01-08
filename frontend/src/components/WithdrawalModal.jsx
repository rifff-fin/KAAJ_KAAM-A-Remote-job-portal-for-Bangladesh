// frontend/src/components/WithdrawalModal.jsx
import React, { useState } from 'react';
import { X, Wallet, CreditCard, Building2, Smartphone, AlertCircle } from 'lucide-react';
import API from '../api';

export default function WithdrawalModal({ balance, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Method, 2: Details, 3: OTP
  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState({});
  const [withdrawalId, setWithdrawalId] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const methods = [
    { id: 'bank', name: 'Bank Transfer', icon: Building2, color: 'blue' },
    { id: 'card', name: 'Card', icon: CreditCard, color: 'purple' },
    { id: 'bkash', name: 'bKash', icon: Smartphone, color: 'pink' },
    { id: 'nagad', name: 'Nagad', icon: Smartphone, color: 'orange' }
  ];

  const handleMethodSelect = (methodId) => {
    setMethod(methodId);
    setStep(2);
    setError('');
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > balance) {
      setError('Insufficient balance');
      return;
    }

    if (parseFloat(amount) < 100) {
      setError('Minimum withdrawal amount is ৳100');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await API.post('/withdrawals/request', {
        amount: parseFloat(amount),
        method,
        details
      });

      setWithdrawalId(response.data.withdrawalId);
      setGeneratedOtp(response.data.otp); // In production, this would be sent via SMS/Email
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await API.post('/withdrawals/verify', {
        withdrawalId,
        otp
      });

      alert('Withdrawal successful! ৳' + amount + ' has been withdrawn.');
      onSuccess(response.data.newBalance);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const renderDetailsForm = () => {
    switch (method) {
      case 'bank':
        return (
          <>
            <input
              type="text"
              placeholder="Bank Name"
              value={details.bankName || ''}
              onChange={(e) => setDetails({ ...details, bankName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              required
            />
            <input
              type="text"
              placeholder="Account Number"
              value={details.accountNumber || ''}
              onChange={(e) => setDetails({ ...details, accountNumber: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              required
            />
            <input
              type="text"
              placeholder="Account Holder Name"
              value={details.accountHolderName || ''}
              onChange={(e) => setDetails({ ...details, accountHolderName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              required
            />
            <input
              type="text"
              placeholder="Branch Name"
              value={details.branchName || ''}
              onChange={(e) => setDetails({ ...details, branchName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              placeholder="Routing Number (Optional)"
              value={details.routingNumber || ''}
              onChange={(e) => setDetails({ ...details, routingNumber: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
            />
          </>
        );

      case 'card':
        return (
          <>
            <input
              type="text"
              placeholder="Card Number"
              maxLength="19"
              value={details.cardNumber || ''}
              onChange={(e) => setDetails({ ...details, cardNumber: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
              required
            />
            <input
              type="text"
              placeholder="Card Holder Name"
              value={details.cardHolderName || ''}
              onChange={(e) => setDetails({ ...details, cardHolderName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
              required
            />
          </>
        );

      case 'bkash':
      case 'nagad':
        return (
          <>
            <input
              type="tel"
              placeholder="Phone Number"
              maxLength="11"
              value={details.phoneNumber || ''}
              onChange={(e) => setDetails({ ...details, phoneNumber: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400"
              required
            />
            <select
              value={details.accountType || 'personal'}
              onChange={(e) => setDetails({ ...details, accountType: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400"
            >
              <option value="personal">Personal</option>
              <option value="agent">Agent</option>
              <option value="merchant">Merchant</option>
            </select>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Wallet className="text-white w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
              <p className="text-blue-100 text-sm">Available: ৳{balance.toFixed(2)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Select Method */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 mb-4">Select Withdrawal Method</h3>
            {methods.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => handleMethodSelect(m.id)}
                  className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl hover:border-${m.color}-500 hover:bg-${m.color}-50 transition-all group`}
                >
                  <div className={`w-12 h-12 bg-${m.color}-100 rounded-lg flex items-center justify-center group-hover:bg-${m.color}-500 transition`}>
                    <Icon className={`w-6 h-6 text-${m.color}-600 group-hover:text-white`} />
                  </div>
                  <span className="font-semibold text-gray-800">{m.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Enter Details */}
        {step === 2 && (
          <form onSubmit={handleDetailsSubmit} className="p-6 space-y-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-blue-600 hover:text-blue-700 text-sm mb-2"
            >
              ← Back to methods
            </button>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount (৳)
              </label>
              <input
                type="number"
                step="0.01"
                min="100"
                max={balance}
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 text-lg font-semibold"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Minimum: ৳100</p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Payment Details
              </label>
              {renderDetailsForm()}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Step 3: OTP Verification */}
        {step === 3 && (
          <form onSubmit={handleOtpSubmit} className="p-6 space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Enter OTP</h3>
              <p className="text-sm text-gray-600">
                A 6-digit OTP has been sent to your registered email address
              </p>
            </div>

            <input
              type="text"
              maxLength="6"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 text-center text-2xl font-bold tracking-widest"
              required
            />

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Withdraw'}
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full text-gray-600 py-2 text-sm hover:text-gray-800"
            >
              Back to details
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
