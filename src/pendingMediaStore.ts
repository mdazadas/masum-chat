/**
 * In-memory store for pending media (avoids localStorage 5MB limit for videos).
 * Camera/gallery sets this before navigating back; Chat reads it on mount.
 */
export interface PendingMedia {
    url: string;       // blob: or data: URL — stays valid within the same page session
    type: 'image' | 'video';
    timestamp: number;
}

let _pending: PendingMedia | null = null;

export const setPendingMedia = (media: PendingMedia): void => {
    _pending = media;
};

export const getPendingMedia = (): PendingMedia | null => {
    return _pending;
};

export const clearPendingMedia = (): void => {
    _pending = null;
};
