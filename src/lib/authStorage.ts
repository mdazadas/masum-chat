const INSFORGE_KEY_HINTS = ['insforge', 'masum_'];

export const clearAppAuthStorage = () => {
    const clearMatching = (storage: Storage) => {
        Object.keys(storage).forEach((key) => {
            const lower = key.toLowerCase();
            if (INSFORGE_KEY_HINTS.some((hint) => lower.includes(hint))) {
                storage.removeItem(key);
            }
        });
    };

    clearMatching(localStorage);
    clearMatching(sessionStorage);
};

export const hasOAuthCallbackParams = () => {
    const params = new URLSearchParams(window.location.search);
    return params.has('code') || params.has('state') || params.has('error') || params.has('error_description');
};
