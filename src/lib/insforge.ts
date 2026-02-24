import { createClient } from '@insforge/sdk';

const BASE_URL = (import.meta.env.VITE_PB_URL || import.meta.env.VITE_INSFORGE_BASE_URL) as string;

/**
 * Robust Singleton Pattern for InsForge (PocketBase) client.
 * Ensures only one instance exists even during HMR or multiple imports.
 * Prioritizes VITE_PB_URL for production builds.
 */
class InsforgeClient {
    private static instance: ReturnType<typeof createClient> | null = null;

    public static getInstance(): ReturnType<typeof createClient> {
        if (!InsforgeClient.instance) {
            console.log('Initializing Insforge client singleton with URL:', BASE_URL);

            InsforgeClient.instance = createClient({
                baseUrl: BASE_URL,
                anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY as string,
                storage: localStorage, // Official PocketBase authStore persistence
                persistSession: true,
                autoRefreshToken: true
            });
        }
        return InsforgeClient.instance;
    }
}

export const insforge = InsforgeClient.getInstance();

// Storage bucket names
export const BUCKETS = {
    AVATARS: 'avatars',
    CHAT_IMAGES: 'chat-images',
    CHAT_MEDIA: 'chat-media'
} as const;

// Helper: get public URL for a storage file
export const getStorageUrl = (bucket: string, path: string) =>
    `${BASE_URL}/storage/v1/object/public/${bucket}/${path}`;
