import React from 'react';
import { X, Calendar, DollarSign, Package, CheckCircle, Clock, FileText, Link as LinkIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function OrderDetailsModal({ order, onClose }) {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `৳${amount?.toLocaleString() || 0}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              <p className="text-sm text-gray-600 mt-1">Order ID: {order._id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <InfoItem label="Title" value={order.title} />
              <InfoItem 
                label="Status" 
                value={
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'activated' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' :
                    order.status === 'delivered' ? 'bg-purple-100 text-purple-700' :
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {order.status}
                  </span>
                } 
              />
              <InfoItem label="Buyer" value={order.buyer?.name || 'N/A'} />
              <InfoItem label="Seller" value={order.seller?.name || 'N/A'} />
              <InfoItem label="Price" value={formatCurrency(order.price)} />
              <InfoItem label="Delivery Days" value={`${order.deliveryDays} days`} />
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payment Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <InfoItem 
                label="Payment Status" 
                value={
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                    order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.paymentStatus}
                  </span>
                } 
              />
              <InfoItem 
                label="Total Amount" 
                value={order.totalAmount ? formatCurrency(order.totalAmount) : 'N/A'} 
              />
              <InfoItem 
                label="Commission (10%)" 
                value={order.commission ? formatCurrency(order.commission) : 'N/A'} 
              />
              <InfoItem 
                label="Seller Amount (90%)" 
                value={order.sellerAmount ? formatCurrency(order.sellerAmount) : 'N/A'} 
              />
              {order.paymentCompletedAt && (
                <InfoItem 
                  label="Payment Cleared At" 
                  value={
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{formatDate(order.paymentCompletedAt)}</div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(order.paymentCompletedAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  } 
                />
              )}
              {order.paymentDeadline && order.paymentStatus !== 'completed' && (
                <InfoItem 
                  label="Payment Deadline" 
                  value={
                    <div className="flex items-center gap-2 text-orange-600">
                      <Clock className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{formatDate(order.paymentDeadline)}</div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(order.paymentDeadline), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  } 
                />
              )}
            </div>
          </div>

          {/* Delivery Information */}
          {order.delivery && order.delivery.deliveredAt && (
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Delivery Information
              </h3>
              <div className="space-y-4">
                <InfoItem 
                  label="Delivered At" 
                  value={
                    <div className="flex items-center gap-2 text-purple-600">
                      <CheckCircle className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{formatDate(order.delivery.deliveredAt)}</div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(order.delivery.deliveredAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  } 
                />
                
                {order.delivery.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                      <FileText className="w-4 h-4" />
                      Work Description
                    </label>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded-lg">
                      {order.delivery.description}
                    </p>
                  </div>
                )}
                
                {order.delivery.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Additional Notes
                    </label>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded-lg">
                      {order.delivery.notes}
                    </p>
                  </div>
                )}
                
                {order.delivery.link && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                      <LinkIcon className="w-4 h-4" />
                      Work Link
                    </label>
                    <a 
                      href={order.delivery.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 underline break-all"
                    >
                      {order.delivery.link}
                    </a>
                  </div>
                )}
                
                {order.delivery.files && order.delivery.files.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Attached Files ({order.delivery.files.length})
                    </label>
                    <div className="space-y-2">
                      {order.delivery.files.map((file, index) => (
                        <div key={index} className="bg-white p-2 rounded-lg text-sm text-gray-600">
                          📎 {file.split('/').pop()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Timeline
            </h3>
            <div className="space-y-3">
              <TimelineItem 
                label="Order Created" 
                date={order.createdAt} 
                icon={<Package className="w-4 h-4" />}
              />
              {order.activatedAt && (
                <TimelineItem 
                  label="Order Activated" 
                  date={order.activatedAt} 
                  icon={<CheckCircle className="w-4 h-4" />}
                />
              )}
              {order.paymentCompletedAt && (
                <TimelineItem 
                  label="Payment Cleared" 
                  date={order.paymentCompletedAt} 
                  icon={<DollarSign className="w-4 h-4" />}
                />
              )}
              {order.startDate && (
                <TimelineItem 
                  label="Work Started" 
                  date={order.startDate} 
                  icon={<Clock className="w-4 h-4" />}
                />
              )}
              {order.delivery?.deliveredAt && (
                <TimelineItem 
                  label="Order Delivered" 
                  date={order.delivery.deliveredAt} 
                  icon={<Package className="w-4 h-4" />}
                />
              )}
              {order.completionDate && (
                <TimelineItem 
                  label="Order Completed" 
                  date={order.completionDate} 
                  icon={<CheckCircle className="w-4 h-4" />}
                />
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-sm text-gray-900 font-medium">{value}</p>
    </div>
  );
}

function TimelineItem({ label, date, icon }) {
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 text-blue-600">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{formatDate(date)}</p>
        <p className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(date), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

export default OrderDetailsModal;
