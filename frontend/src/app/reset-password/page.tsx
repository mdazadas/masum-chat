'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsSessionValid(true);
            } else {
                setIsSessionValid(false);
                setError('Invalid or expired reset session. Please request a new password reset link.');
            }
        };
        checkSession();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password,
            });

            if (error) throw error;
            setSuccess(true);
            setTimeout(() => router.push('/'), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-black text-center space-y-6">
                <div className="p-6 rounded-full bg-green-500/10 border border-green-500/20">
                    <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
                </div>
                <h1 className="text-3xl font-bold">Password Updated!</h1>
                <p className="text-zinc-500 max-w-xs">Your password has been changed successfully. Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-black">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm space-y-8"
            >
                <div className="text-center space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight">Create New Password</h1>
                    <p className="text-zinc-500 text-sm">Please choose a strong password you haven't used before.</p>
                </div>

                {isSessionValid === null ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    </div>
                ) : (
                    <form onSubmit={handleUpdate} className="glass p-8 rounded-3xl space-y-6">
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-accent transition-colors" />
                            <input
                                type="password"
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-accent transition-all placeholder:text-zinc-600 font-medium"
                                required
                                minLength={6}
                            />
                        </div>

                        {error && <p className="text-sm text-red-500 animate-fade-in">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading || isSessionValid === false}
                            className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-2xl shadow-xl shadow-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
