'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import BottomNav from '@/components/BottomNav';

interface CallLog {
    id: string;
    chat_id: string;
    caller_id: string;
    receiver_id: string;
    call_type: 'video' | 'audio';
    status: string;
    started_at: string;
    duration: number;
    caller_name: string;
    receiver_name: string;
    caller_avatar?: string;
    receiver_avatar?: string;
}

export default function CallsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [calls, setCalls] = useState<CallLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchCallHistory();
        }
    }, [user]);

    const fetchCallHistory = async () => {
        try {
            const { data: callsData, error } = await supabase
                .from('calls')
                .select(`
                    *,
                    caller:profiles!calls_caller_id_fkey(display_name, avatar_url),
                    receiver:profiles!calls_receiver_id_fkey(display_name, avatar_url)
                `)
                .or(`caller_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
                .order('started_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const formattedCalls = callsData.map(call => ({
                id: call.id,
                chat_id: call.chat_id,
                caller_id: call.caller_id,
                receiver_id: call.receiver_id,
                call_type: call.call_type,
                status: call.status,
                started_at: call.started_at,
                duration: call.duration || 0,
                caller_name: call.caller?.display_name || 'Unknown',
                receiver_name: call.receiver?.display_name || 'Unknown',
                caller_avatar: call.caller?.avatar_url,
                receiver_avatar: call.receiver?.avatar_url
            }));

            setCalls(formattedCalls);
        } catch (err) {
            console.error('Error fetching call history:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteCall = async (callId: string) => {
        try {
            await supabase.from('calls').delete().eq('id', callId);
            setCalls(calls.filter(call => call.id !== callId));
        } catch (err) {
            console.error('Error deleting call:', err);
        }
    };

    const formatDuration = (seconds: number) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else if (diffInHours < 168) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const getCallIcon = (call: CallLog) => {
        const isOutgoing = call.caller_id === user!.id;
        const Icon = call.call_type === 'video' ? Video : Phone;
        const color = call.status === 'connected' ? 'text-green-500' :
            call.status === 'missed' ? 'text-red-500' : 'text-zinc-500';

        return (
            <div className={`p-2 rounded-full ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
        );
    };

    const getCallStatus = (call: CallLog) => {
        const isOutgoing = call.caller_id === user!.id;

        if (call.status === 'connected') {
            return isOutgoing ? (
                <div className="flex items-center gap-1 text-zinc-500 text-xs">
                    <PhoneOutgoing className="w-3 h-3" />
                    <span>Outgoing • {formatDuration(call.duration)}</span>
                </div>
            ) : (
                <div className="flex items-center gap-1 text-zinc-500 text-xs">
                    <PhoneIncoming className="w-3 h-3" />
                    <span>Incoming • {formatDuration(call.duration)}</span>
                </div>
            );
        } else if (call.status === 'missed') {
            return (
                <div className="flex items-center gap-1 text-red-500 text-xs">
                    <PhoneMissed className="w-3 h-3" />
                    <span>Missed call</span>
                </div>
            );
        } else if (call.status === 'rejected') {
            return <span className="text-zinc-500 text-xs">Declined</span>;
        } else {
            return <span className="text-zinc-500 text-xs">Unavailable</span>;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-black pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 glass px-6 py-4 flex items-center gap-4 border-b border-white/5">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Calls</h1>
            </div>

            {/* Call List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
                    </div>
                ) : calls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                        <Phone className="w-16 h-16 text-zinc-700 mb-4" />
                        <p className="text-zinc-500 font-medium">No calls yet</p>
                        <p className="text-zinc-600 text-sm mt-2">Your call history will appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {calls.map((call) => {
                            const otherPerson = call.caller_id === user!.id
                                ? { name: call.receiver_name, avatar: call.receiver_avatar }
                                : { name: call.caller_name, avatar: call.caller_avatar };

                            return (
                                <motion.div
                                    key={call.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group"
                                >
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        {getCallIcon(call)}
                                    </div>

                                    {/* Call Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">{otherPerson.name}</p>
                                        {getCallStatus(call)}
                                    </div>

                                    {/* Time and Actions */}
                                    <div className="flex items-center gap-3">
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-xs text-zinc-500 font-medium whitespace-nowrap" suppressHydrationWarning>
                                                {formatDate(call.started_at)}
                                            </span>

                                            <div className="flex items-center gap-1 mt-1">
                                                {/* Call Back Button */}
                                                <motion.button
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => router.push(`/chat/${call.chat_id}`)}
                                                    className="p-1.5 hover:bg-zinc-800 rounded-lg transition-all text-accent"
                                                >
                                                    {call.call_type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                                                </motion.button>

                                                {/* Delete Button */}
                                                <motion.button
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => deleteCall(call.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
