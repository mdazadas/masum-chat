'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// WebRTC Configuration
const PEER_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
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

    // Initialize peer connection
    const initializePeerConnection = useCallback((stream: MediaStream, callId: string) => {
        if (peerConnection.current) {
            peerConnection.current.close();
        }

        const pc = new RTCPeerConnection(PEER_CONFIG);
        peerConnection.current = pc;

        // Add local stream tracks
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('Remote stream received');
            setRemoteStream(event.streams[0]);
        };

        // Handle ICE candidates
        pc.onicecandidate = async (event) => {
            if (event.candidate) {
                await supabase.from('call_signals').insert({
                    call_id: callId,
                    sender_id: userId,
                    signal_type: 'ice-candidate',
                    signal_data: event.candidate.toJSON()
                });
            }
        };

        return pc;
    }, [userId]);

    // Start call timer
    const startCallTimer = useCallback(() => {
        if (callTimerRef.current) return;
        callTimerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    }, []);

    // Stop call timer
    const stopCallTimer = useCallback(() => {
        if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
            callTimerRef.current = null;
        }
    }, []);

    // Start video call
    const startCall = useCallback(async () => {
        try {
            // Get local media stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: true
            });
            setLocalStream(stream);
            setCallStatus('calling');

            // Create call in database
            const { data: call, error } = await supabase
                .from('calls')
                .insert({
                    chat_id: chatId,
                    caller_id: userId,
                    receiver_id: recipientId,
                    status: 'calling',
                    call_type: 'video'
                })
                .select()
                .single();

            if (error) throw error;
            setCurrentCallId(call.id);

            // Initialize peer connection and create offer
            const pc = initializePeerConnection(stream, call.id);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Send offer via database
            await supabase.from('call_signals').insert({
                call_id: call.id,
                sender_id: userId,
                signal_type: 'offer',
                signal_data: offer
            });

        } catch (error) {
            console.error('Error starting call:', error);
            setCallStatus('idle');
            localStream?.getTracks().forEach(t => t.stop());
        }
    }, [userId, chatId, recipientId, initializePeerConnection]);

    // Answer incoming call
    const answerCall = useCallback(async (callId: string, offer: RTCSessionDescriptionInit) => {
        try {
            console.log('Answering call:', callId);
            // Get local media stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: true
            });
            setLocalStream(stream);
            setCurrentCallId(callId);

            // Initialize peer connection
            const pc = initializePeerConnection(stream, callId);

            // Set remote description
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            // Process buffered ICE candidates
            while (iceCandidatesBuffer.current.length > 0) {
                const candidate = iceCandidatesBuffer.current.shift();
                if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }

            // Create answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Update call status in DB
            await supabase.from('calls').update({
                status: 'connected',
                connected_at: new Date().toISOString()
            }).eq('id', callId);

            // Send answer signal
            await supabase.from('call_signals').insert({
                call_id: callId,
                sender_id: userId,
                signal_type: 'answer',
                signal_data: answer
            });

            setCallStatus('connected');
            startCallTimer();

        } catch (error) {
            console.error('Error answering call:', error);
            // reset local stream if it was started
            setLocalStream(null);
            setCallStatus('ended');
        }
    }, [userId, initializePeerConnection, startCallTimer]);

    // End call
    const endCall = useCallback(async () => {
        // Stop all tracks
        localStream?.getTracks().forEach(track => track.stop());
        remoteStream?.getTracks().forEach(track => track.stop());

        // Close peer connection
        peerConnection.current?.close();
        peerConnection.current = null;

        // Stop timer
        stopCallTimer();

        // Update call in database
        if (currentCallId) {
            await supabase.from('calls').update({
                status: 'ended',
                ended_at: new Date().toISOString()
            }).eq('id', currentCallId);
        }

        // Reset state
        setLocalStream(null);
        setRemoteStream(null);
        setCallStatus('ended');
        setCurrentCallId(null);
        setCallDuration(0);
        setIsMuted(false);
        setIsVideoOff(false);

        // Reset to idle after delay
        setTimeout(() => setCallStatus('idle'), 2000);
    }, [localStream, remoteStream, currentCallId, stopCallTimer]);

    // Reject call
    const rejectCall = useCallback(async (callId: string) => {
        await supabase.from('calls').update({
            status: 'rejected',
            ended_at: new Date().toISOString()
        }).eq('id', callId);
        setCallStatus('idle');
    }, []);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, [localStream]);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    }, [localStream]);

    // Listen for incoming calls and signals
    useEffect(() => {
        if (!userId || !chatId) return;

        // Check for existing active calls on mount
        const checkActiveCall = async () => {
            const { data: activeCalls } = await supabase
                .from('calls')
                .select('*')
                .eq('chat_id', chatId)
                .in('status', ['calling', 'ringing'])
                .order('created_at', { ascending: false })
                .limit(1);

            if (activeCalls && activeCalls.length > 0) {
                const call = activeCalls[0];
                // Only set as ringing if it's for me
                if (call.receiver_id === userId) {
                    setCurrentCallId(call.id);
                    setCallStatus('ringing');
                }
            }
        };

        checkActiveCall();

        // Subscribe to incoming calls
        const callsChannel = supabase
            .channel('incoming-calls')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'calls',
                    filter: `receiver_id=eq.${userId}`
                },
                (payload: { new: any }) => {
                    const call = payload.new;
                    setCurrentCallId(call.id);
                    setCallStatus('ringing');
                }
            )
            .subscribe();

        // Subscribe to call signals
        const signalsChannel = supabase
            .channel('call-signals')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'call_signals'
                },
                async (payload: { new: any }) => {
                    const signal = payload.new;

                    if (signal.call_id !== currentCallId) return;
                    if (signal.sender_id === userId) return; // Ignore own signals

                    const pc = peerConnection.current;
                    if (!pc) return;

                    if (signal.signal_type === 'answer') {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal.signal_data));
                        setCallStatus('connected');
                        startCallTimer();
                    } else if (signal.signal_type === 'ice-candidate') {
                        if (pc.remoteDescription) {
                            await pc.addIceCandidate(new RTCIceCandidate(signal.signal_data));
                        } else {
                            iceCandidatesBuffer.current.push(signal.signal_data);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(callsChannel);
            supabase.removeChannel(signalsChannel);
        };
    }, [userId, currentCallId, startCallTimer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            localStream?.getTracks().forEach(track => track.stop());
            remoteStream?.getTracks().forEach(track => track.stop());
            peerConnection.current?.close();
            stopCallTimer();
        };
    }, [localStream, remoteStream, stopCallTimer]);

    // Switch camera (front/back)
    const switchCamera = useCallback(async () => {
        if (!localStream) return;

        try {
            const currentVideoTrack = localStream.getVideoTracks()[0];
            const currentFacingMode = currentVideoTrack.getSettings().facingMode;

            currentVideoTrack.stop();

            const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: newFacingMode },
                audio: false
            });

            const newVideoTrack = newStream.getVideoTracks()[0];
            const senders = peerConnection.current?.getSenders();
            const videoSender = senders?.find(sender => sender.track?.kind === 'video');

            if (videoSender) {
                await videoSender.replaceTrack(newVideoTrack);
            }

            const updatedStream = new MediaStream([
                newVideoTrack,
                ...localStream.getAudioTracks()
            ]);
            setLocalStream(updatedStream);

        } catch (error) {
            console.error('Error switching camera:', error);
        }
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
