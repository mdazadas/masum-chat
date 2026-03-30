import { createClient } from '@insforge/sdk';

// ─── Environment Configuration ─────────────────────────────────────────────
const baseUrl = (import.meta.env.VITE_INSFORGE_BASE_URL || import.meta.env.VITE_PB_URL || '') as string;
const anonKey = (import.meta.env.VITE_INSFORGE_ANON_KEY || '') as string;

if (!baseUrl || !anonKey) {
    console.warn('InsForge configuration missing. Check your .env file.');
}
// ────────────────────────────────────────────────────────────────────────────

// ─── Global JWT-expiry interceptor ──────────────────────────────────────────
// (Optional: Removed as autoRefreshToken is now enabled in the SDK client)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Global InsForge Client Singleton
 */
export const insforge = createClient({
    baseUrl,
    anonKey,
    autoRefreshToken: true,
    persistSession: true,
    storage: window.localStorage,
});
