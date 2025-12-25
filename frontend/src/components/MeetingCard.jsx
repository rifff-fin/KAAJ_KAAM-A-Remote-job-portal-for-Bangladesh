// frontend/src/components/MeetingCard.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Phone, Check, X, Play, FileText } from 'lucide-react';
import { formatDistanceToNow, format, isPast, differenceInMinutes } from 'date-fns';
import API from '../api';

export default function MeetingCard({ meeting, onUpdate, showActions = true, onStartMeeting }) {
  const [loading, setLoading] = useState(false);
  const [timeUntil, setTimeUntil] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const scheduledDate = new Date(meeting.scheduledDate);
  const isCreator = meeting.createdBy._id === user?.id;
  const hasAccepted = meeting.acceptedBy?.some(a => a.user === user?.id);
  const hasDeclined = meeting.declinedBy?.some(d => d.user === user?.id);
  
  // Check if can start (10 minutes before)
  const minutesUntil = differenceInMinutes(scheduledDate, new Date());
  const canStart = minutesUntil <= 10 && minutesUntil >= -60 && meeting.status === 'accepted';

  useEffect(() => {
    const updateTimeUntil = () => {
      const now = new Date();
      if (scheduledDate > now) {
        const distance = formatDistanceToNow(scheduledDate, { addSuffix: true });
        setTimeUntil(distance);
      } else {
        setTimeUntil('Now');
      }
    };

    updateTimeUntil();
    const interval = setInterval(updateTimeUntil, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [scheduledDate]);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const response = await API.put(`/meetings/${meeting._id}/accept`);
      onUpdate(response.data);
    } catch (err) {
      console.error('Error accepting meeting:', err);
      alert(err.response?.data?.message || 'Failed to accept meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    const reason = prompt('Reason for declining (optional):');
    setLoading(true);
    try {
      const response = await API.put(`/meetings/${meeting._id}/decline`, { reason });
      onUpdate(response.data);
    } catch (err) {
      console.error('Error declining meeting:', err);
      alert(err.response?.data?.message || 'Failed to decline meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (onStartMeeting) {
      setLoading(true);
      try {
        await API.put(`/meetings/${meeting._id}/start`);
        onStartMeeting(meeting);
      } catch (err) {
        console.error('Error starting meeting:', err);
        alert(err.response?.data?.message || 'Failed to start meeting');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusBadge = () => {
    switch (meeting.status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">Pending</span>;
      case 'accepted':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Accepted</span>;
      case 'declined':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">Declined</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">Cancelled</span>;
      case 'missed':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">Missed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border-2 border-blue-100 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {meeting.meetingType === 'video' ? (
              <Video size={16} className="text-blue-600" />
            ) : (
              <Phone size={16} className="text-blue-600" />
            )}
            <h4 className="font-semibold text-gray-900">{meeting.title}</h4>
          </div>
          <p className="text-sm text-gray-500">
            {isCreator ? 'You scheduled this meeting' : `Scheduled by ${meeting.createdBy.name}`}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Date and Time */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-gray-700">
          <Calendar size={16} className="text-gray-400" />
          <span>{format(scheduledDate, 'MMM dd, yyyy')}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-700">
          <Clock size={16} className="text-gray-400" />
          <span>{format(scheduledDate, 'h:mm a')}</span>
        </div>
        <div className="text-gray-500">
          ({meeting.duration} min)
        </div>
      </div>

      {/* Time until */}
      {meeting.status === 'accepted' && !isPast(scheduledDate) && (
        <div className="flex items-center gap-2 text-sm">
          <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full font-medium">
            {canStart ? '🟢 Ready to start' : `⏰ ${timeUntil}`}
          </div>
        </div>
      )}

      {/* Agenda */}
      {meeting.agenda && (
        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
          <FileText size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-700">{meeting.agenda}</p>
        </div>
      )}

      {/* Actions */}
      {showActions && meeting.status === 'pending' && !hasDeclined && (
        <div className="flex gap-2 pt-2">
          {!hasAccepted && (
            <>
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
              >
                <Check size={18} />
                Accept
              </button>
              <button
                onClick={handleDecline}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                <X size={18} />
                Decline
              </button>
            </>
          )}
          {hasAccepted && (
            <div className="flex-1 text-center py-2 text-green-600 font-medium">
              ✓ You accepted this meeting
            </div>
          )}
        </div>
      )}

      {/* Start Meeting Button */}
      {canStart && onStartMeeting && (
        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 animate-pulse"
        >
          <Play size={20} />
          Start Meeting
        </button>
      )}

      {/* Completed/Cancelled Info */}
      {meeting.status === 'completed' && meeting.actualDuration && (
        <div className="text-sm text-gray-600 pt-2 border-t border-gray-200">
          Duration: {Math.floor(meeting.actualDuration / 60)} minutes
        </div>
      )}
    </div>
  );
}