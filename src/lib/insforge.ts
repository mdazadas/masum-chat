import { createClient } from '@insforge/sdk';

const BASE_URL = import.meta.env.VITE_INSFORGE_BASE_URL as string;

export const insforge = createClient({
    baseUrl: BASE_URL,
    anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY as string,
    storage: localStorage, // Switched to localStorage for better persistence
    persistSession: true,
    autoRefreshToken: true // Enabled to prevent 403 Forbidden errors on token expiry
});

// Storage bucket names
export const BUCKETS = {
    avatars: 'avatars',
    chatImages: 'chat-images',
    chatMedia: 'chat-media',
} as const;

// Helper: get public URL for a storage file
export const getStorageUrl = (bucket: string, path: string) =>
    `${BASE_URL}/storage/v1/object/public/${bucket}/${path}`;
