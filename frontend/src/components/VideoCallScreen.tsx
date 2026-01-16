'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone,
    PhoneOff,
    Video,
    VideoOff,
    Mic,
    MicOff,
    SwitchCamera,
    Maximize2
} from 'lucide-react';

interface VideoCallScreenProps {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    callStatus: string;
    recipientName: string;
    isMuted: boolean;
    isVideoOff: boolean;
    callDuration: number;
    onEndCall: () => void;
    onToggleMute: () => void;
    onToggleVideo: () => void;
    onSwitchCamera?: () => void;
}

export default function VideoCallScreen({
    localStream,
    remoteStream,
    callStatus,
    recipientName,
    isMuted,
    isVideoOff,
    callDuration,
    onEndCall,
    onToggleMute,
    onToggleVideo,
    onSwitchCamera
}: VideoCallScreenProps) {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Set up video streams
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Format call duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black flex flex-col"
        >
            {/* Remote Video (Full Screen) */}
            <div className="relative flex-1 bg-zinc-900">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <div className="w-32 h-32 rounded-full bg-accent/20 border-4 border-accent/30 flex items-center justify-center mx-auto">
                                <span className="text-5xl font-bold text-accent">
                                    {recipientName[0]?.toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">{recipientName}</h2>
                                <p className="text-zinc-400 text-lg">
                                    {callStatus === 'calling' && 'Calling...'}
                                    {callStatus === 'connected' && formatDuration(callDuration)}
                                    {callStatus === 'ringing' && 'Ringing...'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Call Status Overlay */}
                {callStatus === 'connected' && (
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-lg px-6 py-3 rounded-full">
                        <p className="text-white font-bold text-sm">{formatDuration(callDuration)}</p>
                    </div>
                )}

                {/* Local Video (Picture in Picture) */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-6 right-6 w-32 h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-zinc-800"
                >
                    {localStream && !isVideoOff ? (
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover mirror"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                            <VideoOff className="w-8 h-8 text-zinc-600" />
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Call Controls */}
            <div className="p-8 bg-gradient-to-t from-black via-black/95 to-transparent">
                <div className="flex items-center justify-center gap-6">
                    {/* Mute Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onToggleMute}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted
                            ? 'bg-red-500/20 border-2 border-red-500'
                            : 'bg-white/10 border-2 border-white/20'
                            }`}
                    >
                        {isMuted ? (
                            <MicOff className="w-6 h-6 text-red-500" />
                        ) : (
                            <Mic className="w-6 h-6 text-white" />
                        )}
                    </motion.button>

                    {/* Video Toggle Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onToggleVideo}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff
                            ? 'bg-red-500/20 border-2 border-red-500'
                            : 'bg-white/10 border-2 border-white/20'
                            }`}
                    >
                        {isVideoOff ? (
                            <VideoOff className="w-6 h-6 text-red-500" />
                        ) : (
                            <Video className="w-6 h-6 text-white" />
                        )}
                    </motion.button>

                    {/* Camera Switch Button */}
                    {onSwitchCamera && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={onSwitchCamera}
                            className="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-white/10 border-2 border-white/20"
                        >
                            <SwitchCamera className="w-6 h-6 text-white" />
                        </motion.button>
                    )}

                    {/* End Call Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onEndCall}
                        className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-2xl hover:bg-red-600 transition-all"
                    >
                        <PhoneOff className="w-7 h-7 text-white" />
                    </motion.button>
                </div>
            </div>

            {/* CSS for mirror effect */}
            <style jsx>{`
                .mirror {
                    transform: scaleX(-1);
                }
            `}</style>
        </motion.div>
    );
}
