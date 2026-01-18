'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Settings, User, Mail, AtSign, LogOut, Camera, Shield, Bell, HelpCircle } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';

export default function ProfilePage() {
    const { user, profile, signOut, loading: authLoading } = useAuth();
    const router = useRouter();

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    const menuItems = [
        { icon: Settings, label: 'App Settings', color: 'text-zinc-400', path: '/settings' },
        { icon: User, label: 'Edit Profile', color: 'text-blue-400' },
        { icon: Shield, label: 'Privacy & Security', color: 'text-green-400' },
        { icon: Bell, label: 'Notifications', color: 'text-purple-400' },
        { icon: HelpCircle, label: 'Help Center', color: 'text-amber-400' },
    ];

    const stats = [
        { label: 'Messages', value: '1.2k' },
        { label: 'Calls', value: '45' },
        { label: 'Member', value: new Date(user?.created_at || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
    ];

    return (
        <div className="flex flex-col min-h-screen pb-24 bg-black">
            {/* Profile Header */}
            <div className="p-8 pb-12 flex flex-col items-center space-y-4 bg-gradient-to-b from-zinc-900/50 to-transparent">
                <div className="relative group cursor-pointer">
                    <div className="w-28 h-28 rounded-3xl bg-zinc-800 border-2 border-zinc-700 p-1 flex items-center justify-center font-bold text-4xl shadow-2xl overflow-hidden group-hover:border-accent transition-all">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-zinc-500">{profile?.display_name?.[0]}</span>
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 p-2 bg-accent rounded-xl shadow-lg border-2 border-black group-hover:scale-110 transition-transform">
                        <Camera className="w-4 h-4 text-white" />
                    </div>
                </div>

                <div className="text-center space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-white">{profile?.display_name}</h1>
                    <p className="text-zinc-500 font-medium">@{profile?.username}</p>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-8 py-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <p className="text-lg font-bold text-white">{stat.value}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Cards */}
            <div className="px-6 space-y-6">
                <div className="glass p-6 rounded-3xl space-y-4 border-white/5 shadow-xl">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6">Account Info</h2>
                    <div className="flex items-center gap-4 group">
                        <div className="p-3 rounded-2xl bg-zinc-900 group-hover:bg-zinc-800 transition-colors">
                            <Mail className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div className="flex-1 border-b border-zinc-800/50 pb-4">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Email</p>
                            <p className="text-zinc-200 font-medium">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                        <div className="p-3 rounded-2xl bg-zinc-900 group-hover:bg-zinc-800 transition-colors">
                            <AtSign className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div className="flex-1 pb-2">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Username</p>
                            <p className="text-zinc-200 font-medium">@{profile?.username}</p>
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="glass rounded-3xl overflow-hidden border-white/5 shadow-xl">
                    {menuItems.map((item, i) => (
                        <button
                            key={item.label}
                            onClick={() => item.path && router.push(item.path)}
                            className={`w-full p-5 flex items-center justify-between hover:bg-white/5 transition-all text-left ${i !== menuItems.length - 1 ? 'border-b border-white/5' : ''}`}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className={`w-5 h-5 ${item.color}`} />
                                <span className="font-bold text-zinc-300">{item.label}</span>
                            </div>
                            <div className="w-5 h-5 text-zinc-600">›</div>
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => signOut()}
                    className="w-full glass p-5 rounded-3xl flex items-center justify-center gap-3 text-red-500 font-bold hover:bg-red-500/10 border-red-500/10 transition-all hover:border-red-500/30 mb-4"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out Securely
                </button>
            </div>

            <BottomNav />
        </div>
    );
}
