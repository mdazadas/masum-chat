import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton instance - reuses same connection
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get Supabase client with connection pooling logic
 * Creates only ONE instance and reuses it across the app
 * Optimized to prevent multiple re-connections
 */
export const getSupabase = (): SupabaseClient => {
    // If instance already exists, reuse it
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // Create new instance only if it doesn't exist
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true, // Still set to true so it stays for current tab
            detectSessionInUrl: true,
            flowType: 'pkce',
            storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
        },
        global: {
            headers: {
                'x-client-info': 'masum-chat-web',
            },
        },
        db: {
            schema: 'public',
        },
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    });

    return supabaseInstance;
};

// Export singleton instance for easy import
export const supabase = getSupabase();

// Export function to reset connection if needed (e.g. for testing)
export const resetSupabaseConnection = () => {
    supabaseInstance = null;
};
