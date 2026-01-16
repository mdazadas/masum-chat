'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ArrowLeft, Send, Phone, Video, Info, Check, CheckCheck, Trash2, MoreVertical, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoCall } from '@/hooks/useVideoCall';
import { useMobileViewport } from '@/hooks/useMobileViewport';
import VideoCallScreen from '@/components/VideoCallScreen';
import IncomingCallModal from '@/components/IncomingCallModal';

export default function ChatScreen() {
    const { id: chatId } = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [recipient, setRecipient] = useState<any>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isRecipientTyping, setIsRecipientTyping] = useState(false);
    const [isRecipientOnline, setIsRecipientOnline] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Video call hook
    const { viewportHeight, isKeyboardOpen } = useMobileViewport();

    const {
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
    } = useVideoCall(user?.id || '', chatId as string, recipient?.id || '');

    useEffect(() => {
        if (user && chatId) {
            fetchChatDetails();
            fetchMessages();

            // Subscribe to new messages, status updates, typing events, and presence
            const channel = supabase
                .channel(`chat:${chatId}`, {
                    config: {
                        presence: { key: user.id },
                        broadcast: { self: false }
                    }
                })
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
                    (payload: { new: any }) => {
                        setMessages((prev) => [...prev, payload.new]);
                        scrollToBottom();
                        if (payload.new.sender_id !== user!.id) {
                            markMessagesAsRead();
                        }
                    }
                )
                .on(
                    'broadcast',
                    { event: 'typing' },
                    (payload) => {
                        if (payload.payload.userId !== user.id) {
                            setIsRecipientTyping(payload.payload.isTyping);
                        }
                    }
                )
                .on('presence', { event: 'sync' }, () => {
                    const state = channel.presenceState();
                    const recipientOnline = Object.values(state).some(
                        (presence: any) => presence[0]?.key === recipient?.id
                    );
                    setIsRecipientOnline(recipientOnline);
                })
                .on('presence', { event: 'join' }, ({ key }) => {
                    if (key === recipient?.id) setIsRecipientOnline(true);
                })
                .on('presence', { event: 'leave' }, ({ key }) => {
                    if (key === recipient?.id) setIsRecipientOnline(false);
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.track({ key: user.id, online_at: new Date().toISOString() });
                    }
                });

            // Subscribe to profile updates for the recipient (to catch last_seen changes)
            const profileChannel = supabase
                .channel(`profile:${chatId}`)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${recipient?.id}` },
                    (payload: { new: any }) => {
                        setRecipient(payload.new);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
                supabase.removeChannel(profileChannel);
            };
        }
    }, [user, chatId, recipient?.id]);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom(!loading);
        }
    }, [messages, loading]);

    const fetchChatDetails = async () => {
        const { data } = await supabase
            .from('chat_participants')
            .select('profiles(*)')
            .eq('chat_id', chatId)
            .neq('user_id', user!.id)
            .single();

        if (data) setRecipient(data.profiles);
    };

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            const msgs = (data || []).reverse();
            const unread = msgs.find(m => m.sender_id !== user!.id && m.status !== 'read');
            if (unread) setFirstUnreadId(unread.id);
            setMessages(msgs);
            // Instant scroll on load
            scrollToBottom(true);
            await markMessagesAsRead();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleAutoAnswer = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const autoAnswerId = urlParams.get('autoAnswer');

            if (autoAnswerId && callStatus === 'ringing' && currentCallId === autoAnswerId) {
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);

                const { data: signals } = await supabase
                    .from('call_signals')
                    .select('*')
                    .eq('call_id', autoAnswerId)
                    .eq('signal_type', 'offer')
                    .single();

                if (signals) {
                    await answerCall(autoAnswerId, signals.signal_data);
                }
            }
        };
        handleAutoAnswer();
    }, [callStatus, currentCallId, answerCall]);

    const markMessagesAsRead = async () => {
        try {
            await supabase
                .from('messages')
                .update({ status: 'read' })
                .eq('chat_id', chatId)
                .neq('sender_id', user!.id)
                .neq('status', 'read');
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const msg = inputText;
        setInputText('');

        const { error } = await supabase
            .from('messages')
            .insert({
                chat_id: chatId,
                sender_id: user!.id,
                content: msg,
                status: 'sent'
            });

        if (error) console.error(error);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setInputText(text);

        if (!isTyping && text.length > 0) {
            setIsTyping(true);
            supabase.channel(`chat:${chatId}`).send({
                type: 'broadcast',
                event: 'typing',
                payload: { chatId, userId: user!.id, isTyping: true }
            });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            supabase.channel(`chat:${chatId}`).send({
                type: 'broadcast',
                event: 'typing',
                payload: { chatId, userId: user!.id, isTyping: false }
            });
        }, 3000);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
        setShowScrollBottom(!isAtBottom);
    };

    const formatLastSeen = (date: string) => {
        if (!date) return 'away';
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();

        if (diff < 1000 * 60) return 'just now';
        if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m ago`;

        const isToday = d.toDateString() === now.toDateString();
        if (isToday) return `at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const scrollToBottom = (instant = false) => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({
                behavior: instant ? 'auto' : 'smooth',
                block: 'end'
            });
        }, instant ? 0 : 100);
    };

    const deleteMessage = async (messageId: string) => {
        try {
            await supabase.from('messages').delete().eq('id', messageId);
            setMessages(messages.filter(msg => msg.id !== messageId));
        } catch (err) {
            console.error('Error deleting message:', err);
        }
    };

    const deleteAllMessages = async () => {
        if (!confirm('Are you sure you want to delete all messages in this chat?')) return;
        try {
            await supabase.from('messages').delete().eq('chat_id', chatId);
            setMessages([]);
            setShowMenu(false);
        } catch (err) {
            console.error('Error deleting all messages:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div
            className="flex flex-col bg-black relative overflow-hidden transition-[height] duration-200"
            style={{ height: viewportHeight }}
        >
            {/* Header */}
            <div className="sticky top-0 z-50 glass px-3 py-3 flex items-center justify-between border-b border-white/5 safe-top">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold overflow-hidden">
                            {recipient?.avatar_url ? <img src={recipient.avatar_url} alt="" /> : recipient?.display_name?.[0]}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm leading-tight">{recipient?.display_name}</span>
                            <div className="flex items-center gap-1.5">
                                {isRecipientTyping ? (
                                    <span className="text-[11px] text-accent font-bold animate-pulse">is typing...</span>
                                ) : (
                                    <>
                                        <div className={`w-1.5 h-1.5 rounded-full ${isRecipientOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-zinc-600'}`}></div>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                            {isRecipientOnline ? 'online' : `last seen ${formatLastSeen(recipient?.last_seen)}`}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-zinc-400 hover:text-white transition-colors"><Phone className="w-5 h-5" /></button>
                    <button
                        onClick={startCall}
                        disabled={callStatus !== 'idle'}
                        className="p-2 text-zinc-400 hover:text-accent transition-colors disabled:opacity-50"
                    >
                        <Video className="w-5 h-5" />
                    </button>

                    <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-zinc-400 hover:text-white transition-colors">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-56 glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
                                >
                                    <button onClick={deleteAllMessages} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-left group">
                                        <Trash className="w-5 h-5 text-red-500" />
                                        <div>
                                            <p className="font-medium text-red-500">Delete All Messages</p>
                                            <p className="text-xs text-zinc-500">Clear entire chat history</p>
                                        </div>
                                    </button>
                                    <div className="border-t border-white/5"></div>
                                    <button onClick={() => setShowMenu(false)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left">
                                        <Info className="w-5 h-5 text-zinc-400" />
                                        <div>
                                            <p className="font-medium text-white">Chat Info</p>
                                            <p className="text-xs text-zinc-500">View details</p>
                                        </div>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-hide relative" onScroll={handleScroll}>
                {messages.map((msg) => {
                    const isMe = msg.sender_id === user!.id;
                    const isUnreadMarker = msg.id === firstUnreadId;

                    return (
                        <div key={msg.id} className="space-y-4">
                            {isUnreadMarker && (
                                <div className="flex justify-center my-6">
                                    <div className="bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full">
                                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest text-center">Unread Messages</span>
                                    </div>
                                </div>
                            )}
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                            >
                                <div className={`relative max-w-[80%] px-4 py-3 shadow-xl ${isMe ? 'bubble-out' : 'bubble-in'}`}>
                                    <p className="text-[15px] leading-relaxed select-text">{msg.content}</p>
                                    <div className="flex items-center justify-between gap-3 mt-1">
                                        <div className={`flex items-center gap-1 ${isMe ? 'text-white/60' : 'text-zinc-500'}`}>
                                            <span className="text-[9px] font-bold uppercase tracking-tighter" suppressHydrationWarning>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMe && (
                                                <span className="text-white/80">
                                                    {msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-400" /> : <Check className="w-3 h-3" />}
                                                </span>
                                            )}
                                        </div>
                                        {isMe && (
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => deleteMessage(msg.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3 text-red-400 hover:text-red-300" />
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    );
                })}
                <div ref={scrollRef} className="h-4" />

                <AnimatePresence>
                    {showScrollBottom && (
                        <motion.button
                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.8 }}
                            onClick={() => scrollToBottom()}
                            className="absolute bottom-6 right-8 w-12 h-12 glass rounded-full flex items-center justify-center text-accent shadow-2xl border border-white/10 hover:bg-white/5 transition-all z-20"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
                            </svg>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className={`p-4 glass border-t border-white/5 backdrop-blur-2xl transition-all ${isKeyboardOpen ? 'pb-4' : 'safe-bottom'}`}>
                <form onSubmit={sendMessage} className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Message..."
                            value={inputText}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-900 border border-zinc-700/50 rounded-2xl py-3 px-5 text-[15px] text-white focus:outline-none focus:border-accent transition-all placeholder:text-zinc-600 shadow-inner"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="w-14 h-14 bg-accent hover:bg-accent/90 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90"
                    >
                        <Send className="w-6 h-6 ml-1" />
                    </button>
                </form>
            </div>

            {/* Video Call Modals */}
            <AnimatePresence>
                {callStatus === 'ringing' && recipient && (
                    <IncomingCallModal
                        callerName={recipient.display_name}
                        callerAvatar={recipient.avatar_url}
                        onAccept={async () => {
                            console.log('Accepting call button clicked');
                            const { data: signals, error } = await supabase
                                .from('call_signals')
                                .select('*')
                                .eq('call_id', currentCallId)
                                .eq('signal_type', 'offer')
                                .maybeSingle();

                            if (signals) {
                                await answerCall(currentCallId!, signals.signal_data);
                            } else {
                                console.error('No offer signal found for call:', currentCallId, error);
                                // Fallback: wait a bit and try again or end call
                                rejectCall(currentCallId!);
                            }
                        }}
                        onReject={() => rejectCall(currentCallId!)}
                    />
                )}

                {(callStatus === 'calling' || callStatus === 'connected') && recipient && (
                    <VideoCallScreen
                        localStream={localStream}
                        remoteStream={remoteStream}
                        callStatus={callStatus}
                        recipientName={recipient.display_name}
                        isMuted={isMuted}
                        isVideoOff={isVideoOff}
                        callDuration={callDuration}
                        onEndCall={endCall}
                        onToggleMute={toggleMute}
                        onToggleVideo={toggleVideo}
                        onSwitchCamera={switchCamera}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
