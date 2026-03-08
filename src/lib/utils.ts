/**
 * Generates initials from a name string.
 * @param name The full name.
 * @returns 1-2 character initials.
 */
export const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Generates a stable background color based on a string hash.
 * @param str The string to hash (usually name or ID).
 * @returns A hex color string.
 */
export const getHashColor = (str: string | null | undefined): string => {
    const colors = [
        '#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3',
        '#FF3385', '#FF8F33', '#8A33FF', '#33A2FF', '#00a884'
    ];
    if (!str) return '#ccc';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};
