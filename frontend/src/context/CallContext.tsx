'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import IncomingCallModal from '@/components/IncomingCallModal';
import { AnimatePresence } from 'framer-motion';
import { getSocket } from '@/lib/socket';

interface IncomingCall {
    id: string;
    caller_id: string;
    caller_name: string;
    caller_avatar?: string;
    chat_id: string;
    call_type: 'video' | 'audio';
}

interface CallContextType {
    incomingCall: IncomingCall | null;
    setIncomingCall: (call: IncomingCall | null) => void;
}

const CallContext = createContext<CallContextType>({
    incomingCall: null,
    setIncomingCall: () => { },
});

export const CallProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

    useEffect(() => {
        if (!user) return;

        const socket = getSocket(user.id);

        const handleIncomingCall = async (data: any) => {
            const { from, offer, callerName, type, chatId, callId } = data;

            // Fetch avatar
            const { data: p } = await supabase.from('profiles').select('avatar_url').eq('id', from).single();

            setIncomingCall({
                id: callId || 'temp',
                caller_id: from,
                caller_name: callerName || 'Unknown',
                caller_avatar: p?.avatar_url,
                chat_id: chatId,
                call_type: type
            });

            // Play ringtone
            const ringtone = new Audio('https://assets.mixkit.co/active_storage/sfx/1344/1344-preview.mp3');
            ringtone.loop = true;
            (window as any).currentRingtone = ringtone;
            ringtone.play().catch(e => console.log('Audio error:', e));
        };

        const handleCallEnded = () => {
            setIncomingCall(null);
            if ((window as any).currentRingtone) {
                (window as any).currentRingtone.pause();
                (window as any).currentRingtone = null;
            }
        };

        socket.on('incoming-call', handleIncomingCall);
        socket.on('call-ended', handleCallEnded);
        socket.on('call-rejected', handleCallEnded);

        return () => {
            socket.off('incoming-call', handleIncomingCall);
            socket.off('call-ended', handleCallEnded);
            socket.off('call-rejected', handleCallEnded);
        };
    }, [user]);

    const handleAccept = () => {
        if (!incomingCall) return;
        if ((window as any).currentRingtone) {
            (window as any).currentRingtone.pause();
            (window as any).currentRingtone = null;
        }
        const chatId = incomingCall.chat_id;
        const callId = incomingCall.id;
        setIncomingCall(null);
        router.push(`/chat/${chatId}?autoAnswer=${callId}`);
    };

    const handleReject = async () => {
        if (!incomingCall) return;
        if ((window as any).currentRingtone) {
            (window as any).currentRingtone.pause();
            (window as any).currentRingtone = null;
        }

        const socket = getSocket(user!.id);
        socket.emit('reject-call', { to: incomingCall.caller_id });

        const callId = incomingCall.id;
        setIncomingCall(null);
        await supabase.from('calls').update({
            status: 'rejected',
            ended_at: new Date().toISOString()
        }).eq('id', callId);
    };

    // Don't show global modal if already on the chat page for this call
    const isAlreadyOnChatPage = pathname === `/chat/${incomingCall?.chat_id}`;

    return (
        <CallContext.Provider value={{ incomingCall, setIncomingCall }}>
            {children}
            <AnimatePresence>
                {incomingCall && !isAlreadyOnChatPage && (
                    <IncomingCallModal
                        callerName={incomingCall.caller_name}
                        callerAvatar={incomingCall.caller_avatar}
                        type={incomingCall.call_type}
                        onAccept={handleAccept}
                        onReject={handleReject}
                    />
                )}
            </AnimatePresence>
        </CallContext.Provider>
    );
};

export const useCallContext = () => useContext(CallContext);
