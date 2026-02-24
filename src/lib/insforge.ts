import { createClient } from '@insforge/sdk';

const BASE_URL = (import.meta.env.VITE_PB_URL || import.meta.env.VITE_INSFORGE_BASE_URL) as string;

// Prevent multiple initializations in HMR / production
let instance: ReturnType<typeof createClient> | null = null;

export const insforge = (() => {
    if (!instance) {
        console.log('Initializing Insforge client singleton with URL:', BASE_URL);
        instance = createClient({
            baseUrl: BASE_URL,
            anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY as string,
            storage: localStorage, // Official persistence mechanism
            persistSession: true,
            autoRefreshToken: true
        });
    }
    return instance;
})();

// Storage bucket names
export const BUCKETS = {
    avatars: 'avatars',
    chatImages: 'chat-images',
    chatMedia: 'chat-media',
} as const;

// Helper: get public URL for a storage file
export const getStorageUrl = (bucket: string, path: string) =>
    `${BASE_URL}/storage/v1/object/public/${bucket}/${path}`;
