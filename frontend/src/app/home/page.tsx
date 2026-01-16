'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Settings, MessageCircle, Check, CheckCheck } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';

export default function HomePage() {
    const { user, profile, loading: authLoading } = useAuth();
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [typingChats, setTypingChats] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (user) {
            fetchChats();

            // Subscribe to real-time message updates
            const channel = supabase
                .channel('home-messages')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'messages' },
                    () => {
                        // Refresh chat list when new message arrives
                        fetchChats();
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'messages' },
                    () => {
                        // Refresh when message status changes (read receipts)
                        fetchChats();
                    }
                )
                .on(
                    'broadcast',
                    { event: 'typing' },
                    (payload) => {
                        const { chatId, isTyping, userId } = payload.payload;
                        if (userId !== user.id) {
                            setTypingChats(prev => ({
                                ...prev,
                                [chatId]: isTyping
                            }));
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    const fetchChats = async () => {
        try {
            // Get all chat IDs the user is part of
            const { data: participations, error: pError } = await supabase
                .from('chat_participants')
                .select('chat_id')
                .eq('user_id', user!.id);

            if (pError) throw pError;

            if (!participations || participations.length === 0) {
                setChats([]);
                return;
            }

            const chatIds = participations.map(p => p.chat_id);

            // Get chat details, other participants, and messages
            const { data: chatData, error: cError } = await supabase
                .from('chats')
                .select(`
          id,
          chat_participants (
            user_id,
            profiles (username, display_name, avatar_url, last_seen)
          ),
          messages (
            id,
            content,
            created_at,
            sender_id,
            status
          )
        `)
                .in('id', chatIds);

            if (cError) throw cError;

            // Filter and format chats with unread count
            const formattedChats = chatData.map(chat => {
                const otherParticipant = chat.chat_participants.find(
                    (p: any) => p.user_id !== user!.id
                );
                const lastMessage = chat.messages?.[chat.messages.length - 1];

                // Count unread messages (messages from other user that are not 'read')
                const unreadCount = chat.messages?.filter(
                    (msg: any) => msg.sender_id !== user!.id && msg.status !== 'read'
                ).length || 0;

                return {
                    id: chat.id,
                    recipient: otherParticipant?.profiles || { username: 'Deleted User', display_name: 'Unknown' },
                    lastMessage,
                    unreadCount,
                };
            }).sort((a, b) => {
                const timeA = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0;
                const timeB = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0;
                return timeB - timeA;
            });

            setChats(formattedChats);
        } catch (err) {
            console.error('Error fetching chats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex flex-col min-h-screen pb-24 bg-black">
                <div className="px-6 py-8 space-y-4">
                    <div className="h-8 bg-zinc-900 rounded-full w-48 animate-pulse" />
                    <div className="space-y-6 mt-10">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-900" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 bg-zinc-900 rounded-lg w-1/3" />
                                    <div className="h-3 bg-zinc-900 rounded-lg w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <BottomNav />
            </div>
        );
    }

    const totalUnread = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);

    return (
        <div className="flex flex-col min-h-screen pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 glass px-6 py-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                        <span className="text-accent font-bold">{profile?.display_name?.[0] || '?'}</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight">Messages</h1>
                            {totalUnread > 0 && (
                                <div className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {totalUnread > 99 ? '99+' : totalUnread}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">@{profile?.username}</p>
                    </div>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400">
                    <Settings className="w-6 h-6" />
                </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 w-full mt-2">
                {chats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center px-8 space-y-4">
                        <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800">
                            <MessageCircle className="w-12 h-12 text-zinc-700" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-zinc-400 font-medium">No active chats yet</p>
                            <Link href="/search" className="text-accent text-sm font-bold hover:underline">
                                Find people to chat with
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-900">
                        {chats.map((chat) => (
                            <Link
                                key={chat.id}
                                href={`/chat/${chat.id}`}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-900/40 active:bg-zinc-950 transition-all group"
                            >
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700 overflow-hidden">
                                        {chat.recipient.avatar_url ? (
                                            <img src={chat.recipient.avatar_url} alt={chat.recipient.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl font-bold text-zinc-500">{chat.recipient.display_name?.[0]}</span>
                                        )}
                                    </div>
                                    {/* Online indicator - always show logic or just keep static green if simplified */}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-black shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-white truncate">{chat.recipient.display_name}</h3>
                                        <div className="flex items-center gap-2">
                                            {chat.unreadCount > 0 && (
                                                <div className="bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                                </div>
                                            )}
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider" suppressHydrationWarning>
                                                {chat.lastMessage ? new Date(chat.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        {typingChats[chat.id] ? (
                                            <p className="text-sm text-accent font-bold animate-pulse truncate">is typing...</p>
                                        ) : (
                                            <>
                                                {chat.lastMessage?.sender_id === user!.id && (
                                                    <span className="flex-shrink-0">
                                                        {chat.lastMessage.status === 'read' ? (
                                                            <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                                                        ) : (
                                                            <Check className="w-3.5 h-3.5 text-zinc-600" />
                                                        )}
                                                    </span>
                                                )}
                                                <p className={`text-sm truncate font-medium flex-1 ${chat.unreadCount > 0 ? 'text-zinc-200' : 'text-zinc-500'}`}>
                                                    {chat.lastMessage?.content || 'No messages yet'}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
