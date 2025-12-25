// frontend/src/components/UpcomingMeetingsPanel.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Phone, User, ChevronRight, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function UpcomingMeetingsPanel({ show, onClose }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (show) {
      fetchUpcomingMeetings();
    }
  }, [show]);

  const fetchUpcomingMeetings = async () => {
    try {
      setLoading(true);
      const response = await API.get('/meetings/upcoming');
      setMeetings(response.data.meetings || response.data);
    } catch (err) {
      console.error('Error fetching upcoming meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const canStartMeeting = (meeting) => {
    const now = new Date();
    const meetingDate = new Date(meeting.scheduledDate);
    const tenMinsBefore = new Date(meetingDate.getTime() - 10 * 60 * 1000);
    const oneHourAfter = new Date(meetingDate.getTime() + 60 * 60 * 1000);
    return now >= tenMinsBefore && now <= oneHourAfter && meeting.status === 'accepted';
  };

  const handleMeetingClick = (meeting) => {
    // Navigate to the conversation
    navigate(`/chat/${meeting.conversationId._id}`);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Upcoming Meetings</h2>
          <p className="text-sm text-gray-600 mt-1">{meetings.length} scheduled</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Meetings List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <Calendar size={64} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming meetings</h3>
            <p className="text-sm text-gray-600">
              Schedule a meeting from your chat conversations
            </p>
          </div>
        ) : (
          meetings.map((meeting) => {
            const meetingDate = new Date(meeting.scheduledDate);
            const otherParticipant = meeting.participants?.find(
              p => p._id !== JSON.parse(localStorage.getItem('user'))?.id
            );

            return (
              <div
                key={meeting._id}
                onClick={() => handleMeetingClick(meeting)}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition cursor-pointer"
              >
                {/* Meeting Title & Status */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 flex-1 pr-2">
                    {meeting.title}
                  </h3>
                  {meeting.status === 'accepted' && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded flex-shrink-0">
                      Confirmed
                    </span>
                  )}
                  {meeting.status === 'pending' && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded flex-shrink-0">
                      Pending
                    </span>
                  )}
                </div>

                {/* Participant */}
                <div className="flex items-center gap-2 mb-3">
                  <img
                    src={otherParticipant?.profile?.avatar || `https://ui-avatars.com/api/?name=${otherParticipant?.name}`}
                    alt={otherParticipant?.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    {otherParticipant?.name || 'Unknown'}
                  </span>
                </div>

                {/* Date & Time */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} className="text-blue-600" />
                    <span>
                      {meetingDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} className="text-blue-600" />
                    <span>
                      {meetingDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {' • '}
                      {meeting.duration} min
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {meeting.meetingType === 'video' ? (
                      <Video size={14} className="text-blue-600" />
                    ) : (
                      <Phone size={14} className="text-blue-600" />
                    )}
                    <span>{meeting.meetingType === 'video' ? 'Video' : 'Audio'}</span>
                  </div>
                </div>

                {/* Countdown */}
                <div className="bg-gray-50 rounded-lg p-2 mb-3">
                  <p className="text-xs text-center text-gray-700 font-medium">
                    ⏰ {formatDistanceToNow(meetingDate, { addSuffix: true })}
                  </p>
                </div>

                {/* Start Button */}
                {canStartMeeting(meeting) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMeetingClick(meeting);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium text-sm shadow-md"
                  >
                    🎥 Start Meeting
                  </button>
                )}

                {/* View Button */}
                {!canStartMeeting(meeting) && (
                  <div className="flex items-center justify-center text-blue-600 text-sm font-medium">
                    <span>View in chat</span>
                    <ChevronRight size={16} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}