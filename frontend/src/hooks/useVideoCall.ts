'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getSocket } from '@/lib/socket';

// WebRTC Configuration with STUN and TURN servers for high reliability
const PEER_CONFIG: RTCConfiguration = {
    iceServers: [
        // Google STUN servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },

        // Free public TURN servers for NAT traversal
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ],
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all' as RTCIceTransportPolicy
};

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'rejected' | 'busy';

export function useVideoCall(userId: string, chatId: string, recipientId: string) {
    const [callStatus, setCallStatus] = useState<CallStatus>('idle');
    const [currentCallId, setCurrentCallId] = useState<string | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const callTimerRef = useRef<NodeJS.Timeout | null>(null);
    const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]);

    // Register socket
    useEffect(() => {
        if (userId) {
            getSocket(userId);
        }
    }, [userId]);

    // ICE Candidate management
    const handleRemoteCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        const pc = peerConnection.current;
        if (pc && pc.remoteDescription) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('Error adding ICE candidate:', e);
            }
        } else {
            iceCandidatesBuffer.current.push(candidate);
        }
    }, []);

    const initializePeerConnection = useCallback((stream: MediaStream) => {
        if (peerConnection.current) {
            peerConnection.current.close();
        }

        const pc = new RTCPeerConnection(PEER_CONFIG);
        peerConnection.current = pc;

        // Add local tracks
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        // Remote stream
        pc.ontrack = (event) => {
            console.log('Remote stream received');
            setRemoteStream(event.streams[0]);
        };

        // Emit local ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                const socket = getSocket(userId);
                socket.emit('ice-candidate', {
                    to: recipientId,
                    candidate: event.candidate.toJSON()
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('ICE Connection State:', pc.iceConnectionState);
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                // Handle reconnect or close
            }
        };

        return pc;
    }, [userId, recipientId]);

    const startCallTimer = useCallback(() => {
        if (callTimerRef.current) return;
        callTimerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    }, []);

    const stopCallTimer = useCallback(() => {
        if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
            callTimerRef.current = null;
        }
    }, []);

    // Initiation
    const startCall = useCallback(async (type: 'video' | 'audio' = 'video') => {
        try {
            setCallStatus('calling');

            // Check if navigator.mediaDevices is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Your browser does not support video/audio calls. Please use a modern browser like Chrome, Firefox, or Safari.');
                setCallStatus('idle');
                return;
            }

            // Request media permissions
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: type === 'video' ? {
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    } : false,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
            } catch (mediaError: any) {
                console.error('Media access error:', mediaError);
                if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
                    alert('Camera/Microphone permission denied. Please allow access in your browser settings.');
                } else if (mediaError.name === 'NotFoundError') {
                    alert('No camera or microphone found. Please connect a device and try again.');
                } else {
                    alert('Could not access camera/microphone: ' + mediaError.message);
                }
                setCallStatus('idle');
                return;
            }

            setLocalStream(stream);

            const socket = getSocket(userId);
            const pc = initializePeerConnection(stream);

            // Create offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Fetch caller name
            const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', userId).single();

            // Create record in Supabase for history FIRST
            const { data: call } = await supabase
                .from('calls')
                .insert({
                    chat_id: chatId,
                    caller_id: userId,
                    receiver_id: recipientId,
                    status: 'calling',
                    call_type: type
                })
                .select()
                .single();

            if (call) {
                setCurrentCallId(call.id);

                // Now emit with complete data including callId
                socket.emit('call-user', {
                    to: recipientId,
                    from: userId,
                    offer: offer,
                    callerName: profile?.display_name || 'Anonymous',
                    type,
                    chatId,
                    callId: call.id
                });
            }

        } catch (error) {
            console.error('Error starting call:', error);
            setCallStatus('idle');
            setLocalStream(null);
            alert('Failed to start call. Please try again.');
        }
    }, [userId, recipientId, chatId, initializePeerConnection]);

    // Receiving Answer
    const answerCall = useCallback(async (callId: string, incomingOffer: RTCSessionDescriptionInit, type: 'video' | 'audio' = 'video') => {
        try {
            setCurrentCallId(callId);

            // Check if navigator.mediaDevices is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Your browser does not support video/audio calls.');
                return;
            }

            // Request media permissions
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: type === 'video' ? {
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    } : false,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
            } catch (mediaError: any) {
                console.error('Media access error:', mediaError);
                if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
                    alert('Camera/Microphone permission denied. Please allow access to answer the call.');
                } else {
                    alert('Could not access camera/microphone: ' + mediaError.message);
                }
                return;
            }

            setLocalStream(stream);
            setCallStatus('connected');

            const pc = initializePeerConnection(stream);
            await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));

            // Process buffered ICE
            while (iceCandidatesBuffer.current.length > 0) {
                const candidate = iceCandidatesBuffer.current.shift();
                if (candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Send answer via socket
            const socket = getSocket(userId);
            socket.emit('answer-call', {
                to: recipientId,
                answer: answer
            });

            // Update call status in Supabase
            await supabase
                .from('calls')
                .update({ status: 'connected', connected_at: new Date().toISOString() })
                .eq('id', callId);

            startCallTimer();
        } catch (error) {
            console.error('Error answering call:', error);
            alert('Failed to answer call. Please try again.');
        }
    }, [userId, recipientId, initializePeerConnection, startCallTimer]);

    const endCall = useCallback(() => {
        const socket = getSocket(userId);
        socket.emit('end-call', { to: recipientId });

        localStream?.getTracks().forEach(t => t.stop());
        remoteStream?.getTracks().forEach(t => t.stop());
        peerConnection.current?.close();
        peerConnection.current = null;

        stopCallTimer();

        if (currentCallId) {
            supabase.from('calls').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', currentCallId);
        }

        setLocalStream(null);
        setRemoteStream(null);
        setCallStatus('ended');
        setTimeout(() => setCallStatus('idle'), 2000);
    }, [userId, recipientId, localStream, remoteStream, currentCallId, stopCallTimer]);

    // Socket listeners
    useEffect(() => {
        if (!userId) return;
        const socket = getSocket(userId);

        const onIncomingCall = async (data: any) => {
            if (data.from === recipientId) {
                // If we are already here, we might just use the incoming offer if needed
                // But usually this is handled by CallContext global modal
            }
        };

        const onCallAnswered = async (data: any) => {
            const { answer } = data;
            const pc = peerConnection.current;
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                setCallStatus('connected');
                startCallTimer();
            }
        };

        const onIceCandidate = (data: any) => {
            handleRemoteCandidate(data.candidate);
        };

        const onCallEnded = () => {
            setCallStatus('ended');
            localStream?.getTracks().forEach(t => t.stop());
            peerConnection.current?.close();
            peerConnection.current = null;
            setTimeout(() => setCallStatus('idle'), 2000);
        };

        const onCallRejected = () => {
            setCallStatus('rejected');
            localStream?.getTracks().forEach(t => t.stop());
            setTimeout(() => setCallStatus('idle'), 2000);
        };

        socket.on('incoming-call', onIncomingCall);
        socket.on('call-answered', onCallAnswered);
        socket.on('ice-candidate', onIceCandidate);
        socket.on('call-ended', onCallEnded);
        socket.on('call-rejected', onCallRejected);

        return () => {
            socket.off('incoming-call', onIncomingCall);
            socket.off('call-answered', onCallAnswered);
            socket.off('ice-candidate', onIceCandidate);
            socket.off('call-ended', onCallEnded);
            socket.off('call-rejected', onCallRejected);
        };
    }, [userId, recipientId, localStream, handleRemoteCandidate, startCallTimer]);

    const toggleMute = useCallback(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
            setIsMuted(!localStream.getAudioTracks()[0].enabled);
        }
    }, [localStream]);

    const toggleVideo = useCallback(() => {
        if (localStream) {
            localStream.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
            setIsVideoOff(!localStream.getVideoTracks()[0].enabled);
        }
    }, [localStream]);

    const rejectCall = useCallback(async (callId?: string) => {
        const socket = getSocket(userId);
        socket.emit('reject-call', { to: recipientId });
        setCallStatus('idle');

        if (callId) {
            await supabase.from('calls').update({ status: 'rejected', ended_at: new Date().toISOString() }).eq('id', callId);
        }
    }, [userId, recipientId]);

    const switchCamera = useCallback(async () => {
        // Implementation for camera switch
    }, [localStream]);

    return {
        callStatus,
        currentCallId,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        callDuration,
        startCall,
        answerCall,
        endCall,
        rejectCall,
        toggleMute,
        toggleVideo,
        switchCamera
    };
}
