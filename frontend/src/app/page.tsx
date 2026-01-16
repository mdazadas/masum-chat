'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Loader2, MessageSquare, AtSign, Mail, Lock, User, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/home');
    }
  }, [user, authLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Login - support username or email? 
        // Supabase Auth usually uses Email. If the user enters a username, 
        // we'd need to fetch the email associated with that username first.
        let loginEmail = email;

        // Simple logic: if email doesn't contain @, assume it's a username
        if (!email.includes('@')) {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', email)
            .single();

          if (profileError || !data) {
            throw new Error('Username not found');
          }
          // Note: In a real app, you'd need a custom edge function to login by username 
          // or store email/username mapping. For now, we'll assume the user uses email.
          // Let's stick to Email login for simplicity but allow Username signup.
          throw new Error('Please login with your email address.');
        }

        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });
        if (loginErr) throw loginErr;

        // Force immediate redirect using window.location
        window.location.href = '/home';
      } else {
        // Signup
        if (!username || username.length < 3) {
          throw new Error('Username must be at least 3 characters');
        }

        const { error: signupErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.toLowerCase(),
              display_name: displayName || username,
            },
            emailRedirectTo: `${window.location.origin}/`,
          }
        });

        if (signupErr) throw signupErr;

        setError('Signup successful! Please check your email for verification.');
        // Switch to login
        setTimeout(() => setIsLogin(true), 3000);
      }
    } catch (err: any) {
      // Check if it's an email confirmation error
      if (err.message && err.message.toLowerCase().includes('email not confirmed')) {
        setError('Please verify your email first. Check your inbox for the confirmation link.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-black">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-accent/20 border border-accent/30">
              <MessageSquare className="w-10 h-10 text-accent" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-white">MASUM CHAT</h1>
          <p className="text-zinc-400 text-sm">Experience the next level of messaging</p>
        </div>

        <div className="glass p-8 rounded-3xl space-y-6">
          <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isLogin ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isLogin ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative group"
                  >
                    <AtSign className="absolute left-3 top-3 w-5 h-5 text-zinc-500 group-focus-within:text-accent transition-colors" />
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-zinc-600"
                      required
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative group"
                  >
                    <User className="absolute left-3 top-3 w-5 h-5 text-zinc-500 group-focus-within:text-accent transition-colors" />
                    <input
                      type="text"
                      placeholder="Display Name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-zinc-600"
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <div className="relative group">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-500 group-focus-within:text-accent transition-colors" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-zinc-600"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-500 group-focus-within:text-accent transition-colors" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-zinc-600"
                required
              />
            </div>

            {error && (
              <p className={`text-sm ${error.includes('successful') ? 'text-green-500' : 'text-red-500'} animate-fade-in`}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-xl shadow-xl shadow-accent/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isLogin ? 'Login to Account' : 'Create My Account'
              )}
            </button>
          </form>

          {isLogin && (
            <div className="text-center">
              <Link href="/forgot-password" title="Forgot Password" id="forgot-password-link" className="text-zinc-400 text-sm hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-zinc-500 text-xs">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
