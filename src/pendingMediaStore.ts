/**
 * In-memory store for pending media (avoids localStorage 5MB limit for videos).
 * Camera/gallery sets this before navigating back; Chat reads it on mount.
 */
export interface PendingMedia {
    url: string;        // blob: or data: URL
    type: 'image' | 'video';
    caption?: string;   // Optional text
    timestamp: number;
    file?: File | Blob; // Allow raw Blobs from Camera Recorder
}

let _pending: PendingMedia | null = null;

export const setPendingMedia = (media: PendingMedia): void => {
    _pending = media;
};

export const getPendingMedia = (): PendingMedia | null => {
    return _pending;
};

export const clearPendingMedia = (): void => {
    // Revoke blob URL to prevent memory leaks if it was a local blob
    if (_pending?.url.startsWith('blob:')) {
        URL.revokeObjectURL(_pending.url);
    }
    _pending = null;
};
