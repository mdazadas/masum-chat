'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Mail, Loader2, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;
            setMessage('Reset link sent! Please check your email inbox.');
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-black">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm space-y-8"
            >
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Login</span>
                </button>

                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20">
                            <KeyRound className="w-10 h-10 text-amber-500" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Trouble logging in?</h1>
                    <p className="text-zinc-500 text-sm leading-relaxed px-4">
                        Enter your email and we'll send you a link to get back into your account.
                    </p>
                </div>

                <form onSubmit={handleReset} className="glass p-8 rounded-3xl space-y-6 border-white/5">
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-accent transition-colors" />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-accent transition-all placeholder:text-zinc-600 font-medium"
                            required
                        />
                    </div>

                    {message && (
                        <p className={`text-sm font-medium ${message.includes('sent') ? 'text-green-500' : 'text-red-500'} animate-fade-in text-center`}>
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-2xl shadow-xl shadow-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-zinc-600 text-xs font-medium">
                        Contact support if you're having more trouble.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
