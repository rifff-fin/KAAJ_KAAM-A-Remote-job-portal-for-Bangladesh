// backend/controllers/meetingController.js
const Meeting = require("../models/Meeting");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

// ────── Create Meeting ──────
const createMeeting = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title, agenda, scheduledDate, duration, meetingType } = req.body;
    const userId = req.user.id;

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.some((p) => p.toString() === userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Create meeting
    const meeting = await Meeting.create({
      conversationId,
      createdBy: userId,
      participants: conversation.participants,
      title,
      agenda,
      scheduledDate: new Date(scheduledDate),
      duration,
      meetingType: meetingType || "video",
    });

    await meeting.populate("createdBy", "name profile.avatar");
    await meeting.populate("participants", "name profile.avatar");

    // Create meeting invite message
    const message = await Message.create({
      conversationId,
      sender: userId,
      text: `Meeting scheduled: ${title}`,
      messageType: "meeting",
      meetingId: meeting._id,
    });

    // Send notifications to other participants
    const io = req.app.get("io");
    const otherParticipants = conversation.participants.filter(
      (p) => p.toString() !== userId
    );

    for (const participantId of otherParticipants) {
      await Notification.create({
        recipient: participantId,
        type: "meeting_invite",
        title: "New Meeting Invitation",
        message: `${req.user.name} invited you to: ${title}`,
        relatedId: meeting._id,
        relatedModel: "Meeting",
      });

      if (io) {
        io.to(`user_${participantId}`).emit("meeting:invite", {
          meeting,
          message,
        });
      }
    }

    res.status(201).json(meeting);
  } catch (err) {
    console.error("Error creating meeting:", err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Get Meetings for Conversation ──────
const getMeetings = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { status } = req.query;
    const userId = req.user.id;

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (
      !conversation ||
      !conversation.participants.some((p) => p.toString() === userId)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const query = { conversationId };
    if (status) query.status = status;

    const meetings = await Meeting.find(query)
      .populate("createdBy", "name profile.avatar")
      .populate("participants", "name profile.avatar")
      .sort({ scheduledDate: -1 });

    res.json(meetings);
  } catch (err) {
    console.error("Error fetching meetings:", err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Get Upcoming Meetings for User ──────
const getUpcomingMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const meetings = await Meeting.find({
      participants: userId,
      scheduledDate: { $gte: now },
      status: { $in: ["pending", "accepted"] },
    })
      .populate("createdBy", "name profile.avatar")
      .populate("participants", "name profile.avatar")
      .populate("conversationId")
      .sort({ scheduledDate: 1 })
      .limit(20);

    res.json(meetings);
  } catch (err) {
    console.error("Error fetching upcoming meetings:", err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Accept Meeting ──────
const acceptMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (!meeting.participants.some((p) => p.toString() === userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Add or update response
    const existingResponse = meeting.responses.find(
      (r) => r.userId.toString() === userId
    );
    if (existingResponse) {
      existingResponse.status = "accepted";
      existingResponse.respondedAt = new Date();
    } else {
      meeting.responses.push({
        userId: userId,
        status: "accepted",
        respondedAt: new Date(),
      });
    }

    // If all participants accepted, change status to accepted
    if (
      meeting.responses.filter((r) => r.status === "accepted").length ===
      meeting.participants.length
    ) {
      meeting.status = "accepted";
    }

    await meeting.save();
    await meeting.populate("createdBy", "name profile.avatar");
    await meeting.populate("participants", "name profile.avatar");

    // Create system message
    await Message.create({
      conversationId: meeting.conversationId,
      sender: userId,
      text: `accepted the meeting: ${meeting.title}`,
      messageType: "system",
    });

    // Notify other participants
    const io = req.app.get("io");
    const otherParticipants = meeting.participants.filter(
      (p) => p.toString() !== userId
    );

    for (const participantId of otherParticipants) {
      await Notification.create({
        recipient: participantId,
        type: "meeting_accepted",
        title: "Meeting Accepted",
        message: `${req.user.name} accepted the meeting: ${meeting.title}`,
        relatedId: meeting._id,
        relatedModel: "Meeting",
      });

      if (io) {
        io.to(`user_${participantId}`).emit("meeting:accepted", meeting);
      }
    }

    res.json(meeting);
  } catch (err) {
    console.error("Error accepting meeting:", err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Decline Meeting ──────
const declineMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (!meeting.participants.some((p) => p.toString() === userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Add or update response
    const existingResponse = meeting.responses.find(
      (r) => r.userId.toString() === userId
    );
    if (existingResponse) {
      existingResponse.status = "declined";
      existingResponse.respondedAt = new Date();
      if (reason) existingResponse.reason = reason;
    } else {
      meeting.responses.push({
        userId: userId,
        status: "declined",
        respondedAt: new Date(),
        reason,
      });
    }

    // If any participant declined, change status to declined
    meeting.status = "declined";

    await meeting.save();
    await meeting.populate("createdBy", "name profile.avatar");

    // Create system message
    await Message.create({
      conversationId: meeting.conversationId,
      sender: userId,
      text: `declined the meeting: ${meeting.title}`,
      messageType: "system",
    });

    // Notify other participants
    const io = req.app.get("io");
    const otherParticipants = meeting.participants.filter(
      (p) => p.toString() !== userId
    );

    for (const participantId of otherParticipants) {
      await Notification.create({
        recipient: participantId,
        type: "meeting_declined",
        title: "Meeting Declined",
        message: `${req.user.name} declined the meeting: ${meeting.title}`,
        relatedId: meeting._id,
        relatedModel: "Meeting",
      });

      if (io) {
        io.to(`user_${participantId}`).emit("meeting:declined", meeting);
      }
    }

    res.json(meeting);
  } catch (err) {
    console.error("Error declining meeting:", err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Start Meeting ──────
const startMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (!meeting.participants.some((p) => p.toString() === userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (meeting.status !== "accepted") {
      return res
        .status(400)
        .json({ message: "Meeting must be accepted first" });
    }

    meeting.startedAt = new Date();
    meeting.joinedUsers.push({
      user: userId,
      joinedAt: new Date(),
    });

    await meeting.save();
    await meeting.populate("participants", "name profile.avatar");

    // Notify other participants
    const io = req.app.get("io");
    const otherParticipants = meeting.participants.filter(
      (p) => p.toString() !== userId
    );

    for (const participantId of otherParticipants) {
      await Notification.create({
        recipient: participantId,
        type: "meeting_started",
        title: "Meeting Started",
        message: `${req.user.name} started the meeting: ${meeting.title}`,
        relatedId: meeting._id,
        relatedModel: "Meeting",
      });

      if (io) {
        io.to(`user_${participantId}`).emit("meeting:started", {
          meeting,
          startedBy: userId,
        });
      }
    }

    res.json(meeting);
  } catch (err) {
    console.error("Error starting meeting:", err);
    res.status(500).json({ message: err.message });
  }
};

// ────── End Meeting ──────
const endMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (!meeting.participants.some((p) => p.toString() === userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    meeting.endedAt = new Date();
    meeting.status = "completed";
    if (notes) meeting.notes = notes;

    // Calculate actual duration
    if (meeting.startedAt) {
      meeting.actualDuration = Math.floor(
        (meeting.endedAt - meeting.startedAt) / 1000
      );
    }

    // Mark user as left
    const joinedUser = meeting.joinedUsers.find(
      (ju) => ju.user.toString() === userId
    );
    if (joinedUser) {
      joinedUser.leftAt = new Date();
    }

    await meeting.save();

    // Create system message
    const durationText = meeting.actualDuration
      ? `(${Math.floor(meeting.actualDuration / 60)} minutes)`
      : "";

    await Message.create({
      conversationId: meeting.conversationId,
      sender: userId,
      text: `Meeting ended ${durationText}`,
      messageType: "system",
    });

    res.json(meeting);
  } catch (err) {
    console.error("Error ending meeting:", err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Cancel Meeting ──────
const cancelMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (meeting.createdBy.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Only meeting creator can cancel" });
    }

    meeting.status = "cancelled";
    await meeting.save();

    // Create system message
    await Message.create({
      conversationId: meeting.conversationId,
      sender: userId,
      text: `cancelled the meeting: ${meeting.title}${
        reason ? ` - ${reason}` : ""
      }`,
      messageType: "system",
    });

    // Notify participants
    const io = req.app.get("io");
    for (const participantId of meeting.participants) {
      if (participantId.toString() !== userId) {
        await Notification.create({
          recipient: participantId,
          type: "meeting_cancelled",
          title: "Meeting Cancelled",
          message: `${req.user.name} cancelled the meeting: ${meeting.title}`,
          relatedId: meeting._id,
          relatedModel: "Meeting",
        });

        if (io) {
          io.to(`user_${participantId}`).emit("meeting:cancelled", meeting);
        }
      }
    }

    res.json(meeting);
  } catch (err) {
    console.error("Error cancelling meeting:", err);
    res.status(500).json({ message: err.message });
  }
};

// ────── Propose New Time ──────
const proposeNewTime = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { proposedTime, reason } = req.body;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (!meeting.participants.some((p) => p.toString() === userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Add response with proposed time
    const existingResponseIndex = meeting.responses.findIndex(
      (r) => r.userId.toString() === userId
    );

    const response = {
      userId,
      status: "tentative",
      respondedAt: new Date(),
      proposedTime: new Date(proposedTime),
      reason: reason || "Proposed new time",
    };

    if (existingResponseIndex >= 0) {
      meeting.responses[existingResponseIndex] = response;
    } else {
      meeting.responses.push(response);
    }

    await meeting.save();
    await meeting.populate("createdBy", "name profile.avatar");
    await meeting.populate("participants", "name profile.avatar");

    // Create system message
    const messageText = `${req.user.name} proposed a new time: ${new Date(
      proposedTime
    ).toLocaleString()}`;

    await Message.create({
      conversationId: meeting.conversationId,
      sender: userId,
      text: messageText,
      messageType: "system",
    });

    // Notify participants
    const io = req.app.get("io");
    const otherParticipants = meeting.participants.filter(
      (p) => p._id.toString() !== userId
    );

    for (const participant of otherParticipants) {
      await Notification.create({
        recipient: participant._id,
        type: "meeting_response",
        title: "New time proposed",
        message: messageText,
        relatedId: meeting._id,
        relatedModel: "Meeting",
      });

      if (io) {
        io.to(`user_${participant._id}`).emit("meeting:time-proposed", {
          meeting,
          proposedBy: userId,
          proposedTime,
        });
      }
    }

    res.json(meeting);
  } catch (err) {
    console.error("Error proposing new time:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getUpcomingMeetings,
  acceptMeeting,
  declineMeeting,
  startMeeting,
  endMeeting,
  cancelMeeting,
  proposeNewTime,
};
