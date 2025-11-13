import React, { useEffect, useState } from 'react';
import API from '../api';
import { Link } from 'react-router-dom';

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await API.get('/api/orders');
        setOrders(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        {orders.length === 0 ? (
          <p className="text-center text-gray-600">No orders yet.</p>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order._id} className="card p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">{order.gig?.title || 'Gig'}</h3>
                    <p className="text-gray-600">Status: <strong>{order.status}</strong></p>
                  </div>
                  <Link
                    to={`/chat/${order._id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Chat
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}