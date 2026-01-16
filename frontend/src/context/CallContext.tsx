'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import IncomingCallModal from '@/components/IncomingCallModal';
import { AnimatePresence } from 'framer-motion';

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

        // Listen for incoming calls globally
        const callsChannel = supabase
            .channel('global-incoming-calls')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'calls',
                    filter: `receiver_id=eq.${user.id}`
                },
                async (payload: { new: any }) => {
                    const call = payload.new;

                    // Fetch caller details
                    const { data: callerProfile } = await supabase
                        .from('profiles')
                        .select('display_name, avatar_url')
                        .eq('id', call.caller_id)
                        .single();

                    if (callerProfile) {
                        setIncomingCall({
                            id: call.id,
                            caller_id: call.caller_id,
                            caller_name: callerProfile.display_name,
                            caller_avatar: callerProfile.avatar_url,
                            chat_id: call.chat_id,
                            call_type: call.call_type
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'calls',
                    filter: `receiver_id=eq.${user.id}`
                },
                (payload: { new: any }) => {
                    const call = payload.new;
                    // Clear incoming call if rejected or ended
                    if (call.status === 'rejected' || call.status === 'ended') {
                        setIncomingCall(null);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(callsChannel);
        };
    }, [user]);

    const handleAccept = () => {
        if (!incomingCall) return;
        const chatId = incomingCall.chat_id;
        const callId = incomingCall.id;
        setIncomingCall(null);
        // Redirect to chat page with autoAnswer flag
        router.push(`/chat/${chatId}?autoAnswer=${callId}`);
    };

    const handleReject = async () => {
        if (!incomingCall) return;
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
                        onAccept={handleAccept}
                        onReject={handleReject}
                    />
                )}
            </AnimatePresence>
        </CallContext.Provider>
    );
};

export const useCallContext = () => useContext(CallContext);
