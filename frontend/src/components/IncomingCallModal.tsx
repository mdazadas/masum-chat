'use client';

import { motion } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface IncomingCallModalProps {
    callerName: string;
    callerAvatar?: string;
    onAccept: () => void;
    onReject: () => void;
}

export default function IncomingCallModal({
    callerName,
    callerAvatar,
    onAccept,
    onReject
}: IncomingCallModalProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-8"
            >
                {/* Caller Avatar */}
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: 'easeInOut'
                    }}
                    className="relative mx-auto"
                >
                    {/* Pulsing rings */}
                    <motion.div
                        animate={{
                            scale: [1, 1.5],
                            opacity: [0.5, 0]
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: 'easeOut'
                        }}
                        className="absolute inset-0 w-40 h-40 rounded-full bg-accent/30 -z-10"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.5],
                            opacity: [0.5, 0]
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            delay: 0.5,
                            ease: 'easeOut'
                        }}
                        className="absolute inset-0 w-40 h-40 rounded-full bg-accent/30 -z-10"
                    />

                    {/* Avatar */}
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 border-4 border-accent/50 flex items-center justify-center overflow-hidden">
                        {callerAvatar ? (
                            <img src={callerAvatar} alt={callerName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-6xl font-bold text-accent">{callerName[0]?.toUpperCase()}</span>
                        )}
                    </div>
                </motion.div>

                {/* Caller Info */}
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-white">{callerName}</h2>
                    <div className="flex items-center justify-center gap-2 text-accent">
                        <Video className="w-5 h-5" />
                        <p className="text-lg font-medium">Incoming video call...</p>
                    </div>
                </div>

                {/* Call Actions */}
                <div className="flex items-center justify-center gap-8 pt-12">
                    {/* Reject Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onReject}
                        className="group relative"
                    >
                        <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-2xl hover:bg-red-600 transition-all">
                            <PhoneOff className="w-8 h-8 text-white" />
                        </div>
                        <p className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-zinc-400 font-medium whitespace-nowrap">
                            Decline
                        </p>
                    </motion.button>

                    {/* Accept Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onAccept}
                        className="group relative"
                        animate={{
                            scale: [1, 1.05, 1],
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 1.5,
                            ease: 'easeInOut'
                        }}
                    >
                        <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-2xl hover:bg-green-600 transition-all">
                            <Phone className="w-8 h-8 text-white" />
                        </div>
                        <p className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-zinc-400 font-medium whitespace-nowrap">
                            Accept
                        </p>
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}
