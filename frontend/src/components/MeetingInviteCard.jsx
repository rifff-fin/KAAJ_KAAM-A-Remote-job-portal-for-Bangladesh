// frontend/src/components/MeetingInviteCard.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Phone, Check, X, RefreshCw, User, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import API from '../api';

export default function MeetingInviteCard({ meeting, currentUserId, onUpdate }) {
  const [responding, setResponding] = useState(false);
  const [showProposeTime, setShowProposeTime] = useState(false);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [reason, setReason] = useState('');

  const isCreator = meeting.createdBy?._id === currentUserId;
  const userResponse = meeting.responses?.find(r => r.userId === currentUserId);
  const hasResponded = !!userResponse;

  // Format date and time
  const meetingDate = new Date(meeting.scheduledDate);
  const formattedDate = meetingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = meetingDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Check if meeting can be started
  const canStart = () => {
    const now = new Date();
    const tenMinsBefore = new Date(meetingDate.getTime() - 10 * 60 * 1000);
    const oneHourAfter = new Date(meetingDate.getTime() + 60 * 60 * 1000);
    return now >= tenMinsBefore && now <= oneHourAfter && meeting.status === 'accepted';
  };

  // Countdown timer
  const [timeUntil, setTimeUntil] = useState('');
  
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = meetingDate - now;
      
      if (diff < 0) {
        setTimeUntil('Meeting time passed');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeUntil(`in ${days} day${days > 1 ? 's' : ''}`);
      } else if (hours > 0) {
        setTimeUntil(`in ${hours} hour${hours > 1 ? 's' : ''}`);
      } else if (minutes > 0) {
        setTimeUntil(`in ${minutes} minute${minutes > 1 ? 's' : ''}`);
      } else {
        setTimeUntil('starting soon');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [meetingDate]);

  const handleResponse = async (status) => {
    setResponding(true);
    try {
      const endpoint = status === 'accepted' 
        ? `/meetings/${meeting._id}/accept`
        : `/meetings/${meeting._id}/decline`;

      const response = await API.put(endpoint, status === 'declined' ? { reason } : {});
      
      if (onUpdate) {
        onUpdate(response.data);
      }
    } catch (err) {
      console.error('Error responding to meeting:', err);
      alert('Failed to respond to meeting');
    } finally {
      setResponding(false);
    }
  };

  const handleProposeNewTime = async () => {
    if (!proposedDate || !proposedTime) {
      alert('Please select a date and time');
      return;
    }

    setResponding(true);
    try {
      const proposedDateTime = new Date(`${proposedDate}T${proposedTime}`);
      
      const response = await API.put(`/meetings/${meeting._id}/propose-time`, {
        proposedTime: proposedDateTime.toISOString(),
        reason: reason || 'Proposed new time'
      });

      if (onUpdate) {
        onUpdate(response.data);
      }
      setShowProposeTime(false);
    } catch (err) {
      console.error('Error proposing new time:', err);
      alert('Failed to propose new time');
    } finally {
      setResponding(false);
    }
  };

  const getStatusBadge = () => {
    switch (meeting.status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">Pending</span>;
      case 'accepted':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Accepted</span>;
      case 'declined':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">Declined</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 my-3 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{meeting.title}</h3>
            <p className="text-xs text-gray-600">
              by {meeting.createdBy?.name || 'Unknown'}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Meeting Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar size={16} className="text-blue-600" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Clock size={16} className="text-blue-600" />
          <span>{formattedTime} • {meeting.duration} minutes</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          {meeting.meetingType === 'video' ? (
            <Video size={16} className="text-blue-600" />
          ) : (
            <Phone size={16} className="text-blue-600" />
          )}
          <span>{meeting.meetingType === 'video' ? 'Video Call' : 'Audio Call'}</span>
        </div>
        {meeting.agenda && (
          <div className="flex items-start gap-2 text-sm text-gray-700 mt-2">
            <FileText size={16} className="text-blue-600 mt-0.5" />
            <span className="flex-1">{meeting.agenda}</span>
          </div>
        )}
      </div>

      {/* Countdown */}
      {meeting.status === 'accepted' && meetingDate > new Date() && (
        <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
          <p className="text-center text-sm font-medium text-gray-700">
            ⏰ Starts {timeUntil}
          </p>
        </div>
      )}

      {/* Responses Summary */}
      {meeting.responses && meeting.responses.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-2">Responses:</p>
          <div className="flex flex-wrap gap-2">
            {meeting.responses.map((response, idx) => {
              const participant = meeting.participants?.find(p => p._id === response.userId);
              return (
                <div key={idx} className="flex items-center gap-1 bg-white px-2 py-1 rounded text-xs">
                  <User size={12} />
                  <span>{participant?.name || 'Unknown'}</span>
                  {response.status === 'accepted' && <Check size={12} className="text-green-600" />}
                  {response.status === 'declined' && <X size={12} className="text-red-600" />}
                  {response.status === 'tentative' && <RefreshCw size={12} className="text-yellow-600" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!hasResponded && !isCreator && meeting.status === 'pending' && (
        <div className="space-y-2">
          {!showProposeTime ? (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => handleResponse('accepted')}
                  disabled={responding}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  <Check size={16} />
                  Accept
                </button>
                <button
                  onClick={() => handleResponse('declined')}
                  disabled={responding}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  <X size={16} />
                  Decline
                </button>
              </div>
              <button
                onClick={() => setShowProposeTime(true)}
                disabled={responding}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <RefreshCw size={16} />
                Propose New Time
              </button>
            </>
          ) : (
            <div className="space-y-2 bg-white p-3 rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="time"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowProposeTime(false)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProposeNewTime}
                  disabled={responding}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
                >
                  Propose
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Start Meeting Button */}
      {canStart() && hasResponded && userResponse?.status === 'accepted' && (
        <button
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg"
        >
          🎥 Start Meeting
        </button>
      )}

      {/* Already Responded */}
      {hasResponded && (
        <div className="bg-white bg-opacity-60 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-700">
            You {userResponse.status} this meeting
          </p>
        </div>
      )}
    </div>
  );
}