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
    const fetchGig = async () => {
      try {
        const res = await API.get(`/api/gigs/${id}`);
        setGig(res.data);
      } catch (err) {
        alert('Gig not found');
        navigate('/jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchGig();
  }, [id, navigate]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user || user.role !== 'buyer') {
      alert('Only clients can apply');
      return;
    }
    try {
      await API.post('/api/jobs/apply', {
        jobId: gig._id,
        gigId: gig._id,
        coverLetter: proposal.coverLetter,
        proposedPrice: proposal.proposedPrice
      });
      alert('Applied successfully!');
      navigate('/orders');
    } catch (err) {
      alert('Error: ' + err.response?.data?.message);
    }
  };

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (!gig) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              {gig.image ? (
                <img src={gig.image} alt={gig.title} className="w-full h-80 object-cover rounded-md" />
              ) : (
                <div className="bg-gray-200 h-80 rounded-md flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{gig.title}</h1>
              <p className="text-gray-600 mb-6">{gig.description}</p>
              <div className="space-y-3">
                <p className="text-2xl font-bold text-blue-600">${gig.price}</p>
                <p className="text-gray-600"><strong>Delivery:</strong> {gig.deliveryTime}</p>
                <p className="text-gray-600"><strong>Category:</strong> {gig.category}</p>
                <p className="text-gray-600"><strong>Seller:</strong> {gig.seller?.name}</p>
              </div>

              {user?.role === 'buyer' && (
                <form onSubmit={handleApply} className="mt-8 space-y-4">
                  <textarea
                    placeholder="Write your proposal..."
                    className="h-32"
                    value={proposal.coverLetter}
                    onChange={e => setProposal({ ...proposal, coverLetter: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Your offer ($)"
                    value={proposal.proposedPrice}
                    onChange={e => setProposal({ ...proposal, proposedPrice: e.target.value })}
                    required
                  />
                  <button type="submit" className="w-full bg-green-600 hover:bg-green-700">
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