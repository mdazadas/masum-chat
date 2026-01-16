'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Search, Loader2, Send } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';

export default function SearchPage() {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [requesting, setRequesting] = useState<string | null>(null);

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .neq('id', user!.id)
                .ilike('username', `%${val}%`)
                .limit(10);

            if (error) throw error;
            setResults(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const startChat = async (otherUserId: string) => {
        setRequesting(otherUserId);
        try {
            // Check if chat already exists
            const { data: existingParticipations } = await supabase
                .from('chat_participants')
                .select('chat_id')
                .eq('user_id', user!.id);

            if (existingParticipations) {
                for (const participation of existingParticipations) {
                    const { data: otherParticipant } = await supabase
                        .from('chat_participants')
                        .select('user_id')
                        .eq('chat_id', participation.chat_id)
                        .eq('user_id', otherUserId)
                        .single();

                    if (otherParticipant) {
                        // Chat already exists, redirect to it
                        window.location.href = `/chat/${participation.chat_id}`;
                        return;
                    }
                }
            }

            // Create new chat
            const { data: newChat, error: chatError } = await supabase
                .from('chats')
                .insert({})
                .select()
                .single();

            if (chatError) throw chatError;

            // Add both participants
            const { error: participantsError } = await supabase
                .from('chat_participants')
                .insert([
                    { chat_id: newChat.id, user_id: user!.id },
                    { chat_id: newChat.id, user_id: otherUserId }
                ]);

            if (participantsError) throw participantsError;

            // Redirect to chat
            window.location.href = `/chat/${newChat.id}`;
        } catch (err) {
            console.error('Error creating chat:', err);
        } finally {
            setRequesting(null);
        }
    };

    return (
        <div className="flex flex-col min-h-screen pb-24 bg-black">
            {/* Search Header */}
            <div className="sticky top-0 z-40 glass p-6 border-b border-white/5">
                <h1 className="text-2xl font-bold mb-4 tracking-tight">Discover People</h1>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-accent transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by username..."
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-zinc-600 font-medium"
                    />
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-4">
                        {results.map((profile) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={profile.id}
                                className="glass p-4 rounded-2xl flex items-center justify-between border-white/5 hover:border-accent/30 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-lg overflow-hidden">
                                        {profile.avatar_url ? <img src={profile.avatar_url} /> : profile.display_name?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white leading-tight">{profile.display_name}</h3>
                                        <p className="text-sm text-zinc-500 font-medium">@{profile.username}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => startChat(profile.id)}
                                    disabled={requesting === profile.id}
                                    className="bg-accent hover:bg-accent/90 text-white font-bold px-5 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {requesting === profile.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    <span>Message</span>
                                </button>
                            </motion.div>
                        ))}
                    </div>
                ) : query.length >= 2 ? (
                    <div className="text-center py-20">
                        <p className="text-zinc-500 font-medium">No users found matching "{query}"</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-widest pl-1">Suggested for you</h2>
                        <div className="p-12 rounded-3xl bg-zinc-950/50 border border-dashed border-zinc-800 text-center">
                            <p className="text-zinc-600 text-sm font-medium">Search for friends to start chatting</p>
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
