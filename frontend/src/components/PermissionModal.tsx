'use client';

import { useState } from 'react';
import { Video, Mic, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PermissionModalProps {
    type: 'video' | 'audio';
    onAllow: () => void;
    onDeny: () => void;
}

export default function PermissionModal({ type, onAllow, onDeny }: PermissionModalProps) {
    const [checking, setChecking] = useState(false);

    const handleAllow = async () => {
        setChecking(true);
        try {
            // Request permission explicitly
            const stream = await navigator.mediaDevices.getUserMedia({
                video: type === 'video',
                audio: true
            });

            // Stop tracks immediately - we just needed permission
            stream.getTracks().forEach(track => track.stop());

            onAllow();
        } catch (error: any) {
            console.error('Permission error:', error);
            if (error.name === 'NotAllowedError') {
                alert('Permission denied. Please allow camera/microphone access in your browser settings.');
            } else if (error.name === 'NotFoundError') {
                alert('No camera or microphone found. Please connect a device.');
            } else {
                alert('Error accessing media devices: ' + error.message);
            }
            onDeny();
        } finally {
            setChecking(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="glass rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl"
                >
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center">
                            {type === 'video' ? (
                                <Video className="w-10 h-10 text-accent" />
                            ) : (
                                <Mic className="w-10 h-10 text-accent" />
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white text-center mb-3">
                        Allow {type === 'video' ? 'Camera & Microphone' : 'Microphone'} Access
                    </h2>

                    {/* Description */}
                    <p className="text-zinc-400 text-center mb-6">
                        Masum Chat needs access to your {type === 'video' ? 'camera and microphone' : 'microphone'} to make {type === 'video' ? 'video' : 'audio'} calls.
                    </p>

                    {/* Browser Info */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-200">
                                <p className="font-semibold mb-1">Browser Permission Required</p>
                                <p className="text-blue-300/80">
                                    Your browser will ask for permission. Please click <strong>"Allow"</strong> when prompted.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onDeny}
                            disabled={checking}
                            className="flex-1 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAllow}
                            disabled={checking}
                            className="flex-1 px-6 py-3 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {checking ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                'Allow Access'
                            )}
                        </button>
                    </div>

                    {/* Help Text */}
                    <p className="text-xs text-zinc-500 text-center mt-4">
                        If you accidentally blocked access, click the lock icon in your browser's address bar to reset permissions.
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
