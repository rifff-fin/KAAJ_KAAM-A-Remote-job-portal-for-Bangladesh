// frontend/src/components/FinancialStats.jsx
import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Download, History } from 'lucide-react';
import API from '../api';
import WithdrawalModal from './WithdrawalModal';

export default function FinancialStats({ isOwnProfile, userRole }) {
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    if (isOwnProfile) {
      fetchFinancialSummary();
    }
  }, [isOwnProfile]);

  const fetchFinancialSummary = async () => {
    try {
      setLoading(true);
      const response = await API.get('/withdrawals/summary');
      setFinancialData(response.data);
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      if (userRole === 'seller') {
        const response = await API.get('/withdrawals/history?limit=10');
        setHistoryData(response.data.withdrawals);
      } else {
        // Fetch payment history for buyers
        const response = await API.get('/payments/history?limit=10');
        setHistoryData(response.data.payments);
      }
      setShowHistory(true);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleWithdrawalSuccess = (newBalance) => {
    setFinancialData({
      ...financialData,
      currentBalance: newBalance
    });
    fetchFinancialSummary();
  };

  if (!isOwnProfile) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-7 h-7" />
            Financial Overview
          </h2>
          <button
            onClick={fetchHistory}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
          >
            <History className="w-4 h-4" />
            {userRole === 'buyer' ? 'Payment History' : 'History'}
          </button>
        </div>

        {/* Main Balance Card - Sellers Only */}
        {userRole === 'seller' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
            <p className="text-blue-100 text-sm mb-2">Available Balance</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold">
                  ৳{financialData?.currentBalance?.toFixed(2) || '0.00'}
                </p>
                <p className="text-blue-100 text-xs mt-1">{financialData?.currency || 'BDT'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowWithdrawalModal(true)}
                  disabled={!financialData?.currentBalance || financialData?.currentBalance < 100}
                  className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-5 h-5" />
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Earnings */}
          {(userRole === 'seller' || userRole === 'freelancer') && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-300" />
                <p className="text-blue-100 text-sm">Total Earnings</p>
              </div>
              <p className="text-2xl font-bold">
                ৳{financialData?.totalEarnings?.toFixed(2) || '0.00'}
              </p>
            </div>
          )}

          {/* Total Spending */}
          {(userRole === 'buyer' || userRole === 'client') && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-orange-300" />
                <p className="text-blue-100 text-sm">Total Spending</p>
              </div>
              <p className="text-2xl font-bold">
                ৳{financialData?.totalSpending?.toFixed(2) || '0.00'}
              </p>
            </div>
          )}

          {/* Total Withdrawn */}
          {userRole === 'seller' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5 text-purple-300" />
                <p className="text-blue-100 text-sm">Total Withdrawn</p>
              </div>
              <p className="text-2xl font-bold">
                ৳{financialData?.totalWithdrawn?.toFixed(2) || '0.00'}
              </p>
            </div>
          )}

          {/* Pending Clearance */}
          {userRole === 'seller' && financialData?.pendingClearance > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-yellow-300" />
                <p className="text-blue-100 text-sm">Pending Clearance</p>
              </div>
              <p className="text-2xl font-bold">
                ৳{financialData?.pendingClearance?.toFixed(2) || '0.00'}
              </p>
            </div>
          )}
        </div>

        {/* Minimum Withdrawal Note */}
        {userRole === 'seller' && (
          <p className="text-blue-100 text-xs mt-4 text-center">
            Minimum withdrawal amount: ৳100
          </p>
        )}
      </div>

      {/* Transaction History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {userRole === 'buyer' ? 'Payment History' : 'Withdrawal History'}
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {historyData.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {userRole === 'buyer' ? 'No payment history yet' : 'No withdrawal history yet'}
                </p>
              ) : (
                <div className="space-y-3">
                  {historyData.map((item) => (
                    <div
                      key={item._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800">
                          ৳{item.amount.toFixed(2)}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : item.status === 'pending_otp'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span className="capitalize">{item.method}</span>
                        <span>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {userRole === 'buyer' && item.order && (
                        <div className="mt-2 text-xs text-gray-500">
                          Order: {item.order.title || 'N/A'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <WithdrawalModal
          balance={financialData?.currentBalance || 0}
          onClose={() => setShowWithdrawalModal(false)}
          onSuccess={handleWithdrawalSuccess}
        />
      )}
    </>
  );
}
