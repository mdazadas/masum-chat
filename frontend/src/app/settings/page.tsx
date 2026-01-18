'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Bell, Phone, Video, Shield, Moon, Sun, Volume2, VolumeX, Vibrate } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { motion } from 'framer-motion';

export default function SettingsPage() {
    const { user, profile, signOut } = useAuth();
    const router = useRouter();
    const {
        settings,
        updateNotificationSettings,
        updateCallSettings,
        updatePrivacySettings,
        setTheme,
        requestNotificationPermission
    } = useSettings();

    const [requesting, setRequesting] = useState(false);

    const handleNotificationToggle = async () => {
        if (!settings.notifications.enabled) {
            setRequesting(true);
            const granted = await requestNotificationPermission();
            setRequesting(false);

            if (granted) {
                updateNotificationSettings({ enabled: true });
            } else {
                alert('Please allow notifications in your browser settings.');
            }
        } else {
            updateNotificationSettings({ enabled: false });
        }
    };

    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 glass px-6 py-4 flex items-center gap-4 border-b border-white/5">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-xl font-bold">Settings</h1>
                    <p className="text-xs text-zinc-500">@{profile?.username}</p>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Notifications Section */}
                <div className="glass rounded-3xl p-6 border border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="text-lg font-bold">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Enable Notifications */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">Enable Notifications</p>
                                <p className="text-sm text-zinc-500">Receive message and call alerts</p>
                            </div>
                            <button
                                onClick={handleNotificationToggle}
                                disabled={requesting}
                                className={`relative w-14 h-8 rounded-full transition-colors ${settings.notifications.enabled ? 'bg-accent' : 'bg-zinc-700'
                                    } disabled:opacity-50`}
                            >
                                <motion.div
                                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                                    animate={{ left: settings.notifications.enabled ? '28px' : '4px' }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            </button>
                        </div>

                        {/* Sound */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {settings.notifications.sound ? (
                                    <Volume2 className="w-5 h-5 text-zinc-400" />
                                ) : (
                                    <VolumeX className="w-5 h-5 text-zinc-400" />
                                )}
                                <div>
                                    <p className="font-semibold">Sound</p>
                                    <p className="text-sm text-zinc-500">Play notification sounds</p>
                                </div>
                            </div>
                            <button
                                onClick={() => updateNotificationSettings({ sound: !settings.notifications.sound })}
                                disabled={!settings.notifications.enabled}
                                className={`relative w-14 h-8 rounded-full transition-colors ${settings.notifications.sound ? 'bg-accent' : 'bg-zinc-700'
                                    } disabled:opacity-30`}
                            >
                                <motion.div
                                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                                    animate={{ left: settings.notifications.sound ? '28px' : '4px' }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            </button>
                        </div>

                        {/* Vibration */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Vibrate className="w-5 h-5 text-zinc-400" />
                                <div>
                                    <p className="font-semibold">Vibration</p>
                                    <p className="text-sm text-zinc-500">Vibrate on notifications</p>
                                </div>
                            </div>
                            <button
                                onClick={() => updateNotificationSettings({ vibration: !settings.notifications.vibration })}
                                disabled={!settings.notifications.enabled}
                                className={`relative w-14 h-8 rounded-full transition-colors ${settings.notifications.vibration ? 'bg-accent' : 'bg-zinc-700'
                                    } disabled:opacity-30`}
                            >
                                <motion.div
                                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                                    animate={{ left: settings.notifications.vibration ? '28px' : '4px' }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Calls Section */}
                <div className="glass rounded-3xl p-6 border border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-green-400" />
                        </div>
                        <h2 className="text-lg font-bold">Calls</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Video Quality */}
                        <div>
                            <p className="font-semibold mb-3">Video Quality</p>
                            <div className="grid grid-cols-3 gap-2">
                                {(['low', 'medium', 'high'] as const).map((quality) => (
                                    <button
                                        key={quality}
                                        onClick={() => updateCallSettings({ videoQuality: quality })}
                                        className={`px-4 py-2 rounded-xl font-semibold capitalize transition-colors ${settings.calls.videoQuality === quality
                                                ? 'bg-accent text-white'
                                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                            }`}
                                    >
                                        {quality}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Privacy Section */}
                <div className="glass rounded-3xl p-6 border border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-lg font-bold">Privacy</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Read Receipts */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">Read Receipts</p>
                                <p className="text-sm text-zinc-500">Show blue ticks when read</p>
                            </div>
                            <button
                                onClick={() => updatePrivacySettings({ readReceipts: !settings.privacy.readReceipts })}
                                className={`relative w-14 h-8 rounded-full transition-colors ${settings.privacy.readReceipts ? 'bg-accent' : 'bg-zinc-700'
                                    }`}
                            >
                                <motion.div
                                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                                    animate={{ left: settings.privacy.readReceipts ? '28px' : '4px' }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            </button>
                        </div>

                        {/* Online Status */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">Online Status</p>
                                <p className="text-sm text-zinc-500">Show when you're online</p>
                            </div>
                            <button
                                onClick={() => updatePrivacySettings({ onlineStatus: !settings.privacy.onlineStatus })}
                                className={`relative w-14 h-8 rounded-full transition-colors ${settings.privacy.onlineStatus ? 'bg-accent' : 'bg-zinc-700'
                                    }`}
                            >
                                <motion.div
                                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                                    animate={{ left: settings.privacy.onlineStatus ? '28px' : '4px' }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sign Out */}
                <button
                    onClick={signOut}
                    className="w-full px-6 py-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
