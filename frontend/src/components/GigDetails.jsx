import React, { useEffect, useState } from 'react';
import API from '../api';
import { useParams, useNavigate } from 'react-router-dom';

export default function GigDetails() {
  const { id } = useParams();
  const [gig, setGig] = useState(null);
  const [proposal, setProposal] = useState({ coverLetter: '', proposedPrice: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    API.get(`/gigs/${id}`)
      .then(res => setGig(res.data))
      .catch(() => {
        alert('Gig not found');
        navigate('/jobs');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user || user.role !== 'buyer') return alert('Only buyers can apply');

    try {
      const res = await API.post('/jobs/apply', {
        gigId: gig._id,
        coverLetter: proposal.coverLetter,
        proposedPrice: proposal.proposedPrice
      });
      alert('Applied! Opening chat...');
      navigate(`/chat/${res.data.roomId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Apply failed');
    }
  };

  if (loading) return <p className="text-center py-20">Loading...</p>;
  if (!gig) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            <div>
              {gig.image ? (
                <img src={gig.image} alt={gig.title} className="w-full h-96 object-cover rounded-xl" />
              ) : (
                <div className="bg-gray-200 h-96 rounded-xl flex items-center justify-center">
                  <span className="text-gray-500 text-xl">No Image</span>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{gig.title}</h1>
                <p className="text-gray-700 mb-6">{gig.description}</p>
                <div className="space-y-3 text-lg">
                  <p className="text-3xl font-bold text-green-600">৳{gig.price}</p>
                  <p><strong>Delivery:</strong> {gig.deliveryTime}</p>
                  <p><strong>Category:</strong> {gig.category}</p>
                  <p><strong>Seller:</strong> {gig.seller?.name}</p>
                </div>
              </div>

              {user?.role === 'buyer' && (
                <form onSubmit={handleApply} className="mt-8 space-y-4">
                  <textarea
                    placeholder="Your proposal..."
                    className="w-full p-4 border rounded-lg h-32 resize-none focus:ring-2 focus:ring-green-500"
                    value={proposal.coverLetter}
                    onChange={e => setProposal({ ...proposal, coverLetter: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Your offer (BDT)"
                    className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-green-500"
                    value={proposal.proposedPrice}
                    onChange={e => setProposal({ ...proposal, proposedPrice: e.target.value })}
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition"
                  >
                    Apply Now
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}