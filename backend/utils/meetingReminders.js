// backend/utils/meetingReminders.js
const Meeting = require('../models/Meeting');
const Notification = require('../models/Notification');

/**
 * Send meeting reminders at different time intervals
 * This function should be called periodically (e.g., every minute via cron job)
 */
const sendMeetingReminders = async (io) => {
  try {
    const now = new Date();
    
    // Get upcoming meetings that need reminders
    const upcomingMeetings = await Meeting.find({
      status: { $in: ['pending', 'accepted'] },
      scheduledDate: { $gte: now }
    }).populate('participants', 'name email')
      .populate('createdBy', 'name');

    for (const meeting of upcomingMeetings) {
      const timeUntilMeeting = meeting.scheduledDate - now;
      const hoursUntil = timeUntilMeeting / (1000 * 60 * 60);
      const minutesUntil = timeUntilMeeting / (1000 * 60);

      // 24 hours before
      if (hoursUntil <= 24 && hoursUntil > 23.75 && !meeting.remindersSent.twentyFourHours) {
        await sendReminder(meeting, '24 hours', io);
        meeting.remindersSent.twentyFourHours = true;
        await meeting.save();
      }

      // 1 hour before
      if (hoursUntil <= 1 && hoursUntil > 0.75 && !meeting.remindersSent.oneHour) {
        await sendReminder(meeting, '1 hour', io);
        meeting.remindersSent.oneHour = true;
        await meeting.save();
      }

      // 10 minutes before
      if (minutesUntil <= 10 && minutesUntil > 8 && !meeting.remindersSent.tenMinutes) {
        await sendReminder(meeting, '10 minutes', io);
        meeting.remindersSent.tenMinutes = true;
        await meeting.save();
      }
    }
  } catch (err) {
    console.error('Error sending meeting reminders:', err);
  }
};

/**
 * Send reminder notification to all participants
 */
const sendReminder = async (meeting, timeFrame, io) => {
  const message = `Meeting "${meeting.title}" starts in ${timeFrame}`;
  
  for (const participant of meeting.participants) {
    try {
      // Create notification
      await Notification.create({
        recipient: participant._id,
        type: 'meeting_reminder',
        title: 'Meeting Reminder',
        message,
        relatedId: meeting._id,
        relatedModel: 'Meeting'
      });

      // Emit socket notification
      if (io) {
        io.to(`user_${participant._id}`).emit('new_notification', {
          type: 'meeting_reminder',
          meetingId: meeting._id,
          message,
          timeFrame
        });
      }
    } catch (err) {
      console.error(`Error sending reminder to user ${participant._id}:`, err);
    }
  }

  console.log(`Sent ${timeFrame} reminder for meeting: ${meeting.title}`);
};

/**
 * Check for missed meetings and mark them
 */
const checkMissedMeetings = async () => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Find meetings that should have started but no one joined
    const missedMeetings = await Meeting.find({
      status: 'accepted',
      scheduledDate: { $gte: oneHourAgo, $lte: now },
      startedAt: null
    }).populate('participants', 'name');

    for (const meeting of missedMeetings) {
      meeting.status = 'missed';
      
      // Check who didn't join
      if (meeting.joinedUsers.length === 0) {
        // No one joined - both missed
        await meeting.save();
      } else {
        // Some joined, some didn't
        const joinedUserIds = meeting.joinedUsers.map(ju => ju.user.toString());
        const noShowUsers = meeting.participants.filter(
          p => !joinedUserIds.includes(p._id.toString())
        );
        
        if (noShowUsers.length === 1) {
          meeting.noShowUser = noShowUsers[0]._id;
        }
        
        await meeting.save();
      }

      console.log(`Marked meeting as missed: ${meeting.title}`);
    }
  } catch (err) {
    console.error('Error checking missed meetings:', err);
  }
};

/**
 * Initialize meeting reminder scheduler
 * Call this in your server.js or index.js
 */
const initializeMeetingReminders = (io) => {
  // Send reminders every minute
  setInterval(() => {
    sendMeetingReminders(io);
  }, 60 * 1000); // Every 1 minute

  // Check for missed meetings every 5 minutes
  setInterval(() => {
    checkMissedMeetings();
  }, 5 * 60 * 1000); // Every 5 minutes

  console.log('✓ Meeting reminder scheduler initialized');
};

module.exports = {
  sendMeetingReminders,
  checkMissedMeetings,
  initializeMeetingReminders
};