// frontend/src/components/VideoCallModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff } from 'lucide-react';
import { socket } from '../socket';
import API from '../api';

export default function VideoCallModal({ 
  conversationId, 
  otherUser, 
  isIncoming = false,
  incomingOffer = null,
  onClose,
  callType = 'video' // 'video' or 'audio'
}) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'calling');
  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const incomingOfferRef = useRef(null);
  const ringtoneRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // ICE servers configuration (using free STUN servers)
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    console.log('VideoCallModal mounted', { isIncoming, callType, conversationId, hasIncomingOffer: !!incomingOffer });

    // Store incoming offer if provided
    if (incomingOffer) {
      incomingOfferRef.current = incomingOffer;
      console.log('Stored incoming offer');
    }

    // Create ringtone audio
    ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    ringtoneRef.current.loop = true;

    // Play ringtone for incoming or outgoing calls
    if (isIncoming || callStatus === 'calling') {
      playRingtone();
    }

    // Socket listeners
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:incoming', handleIncomingCall);
    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);

    if (!isIncoming) {
      // Outgoing call - start immediately
      console.log('Starting outgoing call');
      initializeCall();
    }

    return () => {
      console.log('VideoCallModal unmounting - cleaning up');
      stopRingtone();
      cleanup();
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:incoming', handleIncomingCall);
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
    };
  }, []);

  const playRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.play().catch(err => console.log('Could not play ringtone:', err));
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  const initializeCall = async (isAnswering = false) => {
    try {
      console.log('Initializing call, isAnswering:', isAnswering);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });

      console.log('Got local stream');
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = peerConnection;

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate');
          socket.emit('webrtc:ice-candidate', {
            conversationId,
            candidate: event.candidate,
            to: otherUser._id
          });
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote track');
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Connection state change
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setCallStatus('connected');
          startCallTimer();
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
          console.log('Connection failed or disconnected');
          endCall();
        }
      };

      if (isAnswering && incomingOfferRef.current) {
        // Answering incoming call
        console.log('Setting remote description from incoming offer');
        await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));
        
        console.log('Creating answer');
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        console.log('Sending answer to caller');
        socket.emit('call:accept', {
          conversationId,
          to: otherUser._id,
          answer
        });
        
        setCallStatus('connecting');
      } else if (!isIncoming) {
        // Creating outgoing call
        console.log('Creating offer for outgoing call');
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        console.log('Sending call initiate');
        socket.emit('call:initiate', {
          conversationId,
          callType,
          offer,
          from: user.id,
          to: otherUser._id
        });
        
        setCallStatus('calling');
      }
    } catch (error) {
      console.error('Error initializing call:', error);
      alert('Could not access camera/microphone. Please check permissions.');
      onClose();
    }
  };

  const handleIncomingCall = ({ offer }) => {
    console.log('Received incoming call with offer');
    incomingOfferRef.current = offer;
  };

  const acceptCall = async () => {
    console.log('Accepting call');
    stopRingtone();
    setCallStatus('connecting');
    await initializeCall(true);
  };

  const rejectCall = () => {
    console.log('Rejecting call');
    stopRingtone();
    socket.emit('call:reject', { conversationId, to: otherUser._id });
    onClose();
  };

  const handleCallAccepted = async ({ answer }) => {
    console.log('Call accepted, received answer');
    setCallStatus('connecting');
    
    if (peerConnectionRef.current && answer) {
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Remote description set successfully');
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    }
  };

  const handleCallRejected = async () => {
    console.log('Call rejected');
    stopRingtone();
    
    // Save missed/declined call record
    try {
      await API.post(`/chat/conversations/${conversationId}/call-record`, {
        callType,
        duration: 0,
        status: 'declined'
      });
    } catch (error) {
      console.error('Error saving call record:', error);
    }
    
    alert('Call was rejected');
    onClose();
  };

  const handleCallEnded = () => {
    console.log('Call ended by other user');
    stopRingtone();
    onClose();
  };

  const handleOffer = async ({ offer }) => {
    console.log('Received WebRTC offer');
    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        socket.emit('webrtc:answer', {
          conversationId,
          answer,
          to: otherUser._id
        });
        console.log('Sent answer');
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    }
  };

  const handleAnswer = async ({ answer }) => {
    console.log('Received WebRTC answer');
    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Remote description set from answer');
      } catch (error) {
        console.error('Error setting remote description from answer:', error);
      }
    }
  };

  const handleIceCandidate = async ({ candidate }) => {
    console.log('Received ICE candidate');
    if (peerConnectionRef.current && candidate) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('ICE candidate added');
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  const startCallTimer = () => {
    console.log('Starting call timer');
    stopRingtone(); // Stop ringtone when call connects
    callStartTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
    }, 1000);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track in peer connection
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          toggleScreenShare(); // Stop sharing when user stops from browser
        };

        setIsScreenSharing(true);
      } else {
        // Switch back to camera
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const endCall = async () => {
    console.log('Ending call');
    stopRingtone();
    
    // Save call record if call was connected
    if (callStatus === 'connected' && callDuration > 0) {
      try {
        await API.post(`/chat/conversations/${conversationId}/call-record`, {
          callType,
          duration: callDuration,
          status: 'completed'
        });
        console.log('Call record saved');
      } catch (error) {
        console.error('Error saving call record:', error);
      }
    }
    
    socket.emit('call:end', { conversationId, to: otherUser._id });
    cleanup();
    onClose();
  };

  const cleanup = () => {
    console.log('Cleaning up resources');
    stopRingtone();
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      {/* Header - Messenger style */}
      {callStatus !== 'incoming' && (
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
          <div className="flex items-center justify-center pt-8">
            <div className="bg-black/40 backdrop-blur-md rounded-full px-6 py-3 pointer-events-auto">
              <div className="text-center">
                <h3 className="font-semibold text-white text-lg">{otherUser?.name}</h3>
                <p className="text-sm text-white/80 mt-0.5">
                  {callStatus === 'calling' && 'Ringing...'}
                  {callStatus === 'connecting' && 'Connecting...'}
                  {callStatus === 'connected' && formatDuration(callDuration)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimize/Close buttons */}
      {callStatus !== 'incoming' && (
        <div className="absolute top-6 right-6 z-20 flex gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-10 h-10 bg-black/40 backdrop-blur-md hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-all"
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Video Area */}
      <div className="flex-1 relative bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />

        {/* No remote stream placeholder */}
        {!remoteStream && callStatus !== 'incoming' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center animate-pulse">
              <div className="w-40 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-sm border-4 border-white/10">
                <span className="text-6xl font-bold text-white/90">
                  {otherUser?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) - Messenger style */}
        {callType === 'video' && callStatus !== 'incoming' && !isMinimized && (
          <div className="absolute top-24 right-6 w-36 h-48 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 transition-all duration-300 hover:scale-105">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audio-only mode - Messenger style */}
        {callType === 'audio' && callStatus !== 'incoming' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-48 h-48 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center mx-auto backdrop-blur-md border-4 border-white/20 shadow-2xl">
                  <span className="text-8xl font-bold text-white">
                    {otherUser?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Animated rings */}
                {callStatus === 'connected' && (
                  <>
                    <div className="absolute inset-0 w-48 h-48 mx-auto rounded-full border-4 border-white/20 animate-ping"></div>
                    <div className="absolute inset-0 w-48 h-48 mx-auto rounded-full border-2 border-white/10 animate-pulse"></div>
                  </>
                )}
              </div>
              <h3 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">{otherUser?.name}</h3>
              {callStatus === 'connected' && (
                <p className="text-2xl text-white/90 font-medium">{formatDuration(callDuration)}</p>
              )}
            </div>
          </div>
        )}

        {/* Incoming call UI - Messenger style */}
        {callStatus === 'incoming' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
            <div className="text-center px-4 max-w-md">
              {/* Animated avatar */}
              <div className="relative mb-10">
                <div className="w-48 h-48 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md border-4 border-white/40 shadow-2xl">
                  <span className="text-8xl font-bold text-white">
                    {otherUser?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Pulsing rings */}
                <div className="absolute inset-0 w-48 h-48 mx-auto rounded-full border-4 border-white/30 animate-ping"></div>
                <div className="absolute inset-0 w-56 h-56 mx-auto -m-4 rounded-full border-2 border-white/20 animate-pulse"></div>
              </div>
              
              <h3 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">{otherUser?.name}</h3>
              <p className="text-xl text-white/90 mb-16 font-medium">
                Incoming {callType} call
              </p>
              
              {/* Call action buttons */}
              <div className="flex gap-8 justify-center items-center">
                <div className="text-center">
                  <button
                    onClick={rejectCall}
                    className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-2xl hover:scale-110 active:scale-95 mb-2"
                    title="Decline"
                  >
                    <PhoneOff size={32} className="text-white" />
                  </button>
                  <span className="text-sm text-white/80 font-medium">Decline</span>
                </div>
                
                <div className="text-center">
                  <button
                    onClick={acceptCall}
                    className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-all shadow-2xl animate-bounce hover:animate-none hover:scale-110 active:scale-95 mb-2"
                    title="Accept"
                  >
                    {callType === 'video' ? (
                      <Video size={40} className="text-white" />
                    ) : (
                      <Mic size={40} className="text-white" />
                    )}
                  </button>
                  <span className="text-sm text-white/90 font-semibold">Accept</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls - Messenger style */}
      {(callStatus === 'connected' || callStatus === 'calling' || callStatus === 'connecting') && callStatus !== 'incoming' && (
        <div className="absolute bottom-0 left-0 right-0 pb-10">
          <div className="flex items-center justify-center gap-4">
            {/* Mute */}
            <div className="text-center">
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 ${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <MicOff size={22} className="text-white" />
                ) : (
                  <Mic size={22} className="text-white" />
                )}
              </button>
            </div>

            {/* Video Toggle */}
            {callType === 'video' && (
              <div className="text-center">
                <button
                  onClick={toggleVideo}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 ${
                    isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30'
                  }`}
                  title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                >
                  {isVideoOff ? (
                    <VideoOff size={22} className="text-white" />
                  ) : (
                    <Video size={22} className="text-white" />
                  )}
                </button>
              </div>
            )}

            {/* End Call */}
            <div className="text-center">
              <button
                onClick={endCall}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-2xl hover:scale-110 active:scale-95"
                title="End call"
              >
                <PhoneOff size={28} className="text-white" />
              </button>
            </div>

            {/* Screen Share */}
            {callType === 'video' && callStatus === 'connected' && (
              <div className="text-center">
                <button
                  onClick={toggleScreenShare}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 ${
                    isScreenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30'
                  }`}
                  title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                  {isScreenSharing ? (
                    <MonitorOff size={22} className="text-white" />
                  ) : (
                    <Monitor size={22} className="text-white" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}