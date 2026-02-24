import { useMemo } from 'react';

interface AvatarProps {
    src?: string | null;
    name?: string | null;
    size?: number | string;
    className?: string;
    style?: React.CSSProperties;
    priority?: 'high' | 'low' | 'auto';
}

const Avatar = ({ src, name, size = 40, className = '', style = {}, priority = 'auto' }: AvatarProps) => {
    const initials = useMemo(() => {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }, [name]);

    const backgroundColor = useMemo(() => {
        const colors = [
            '#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3',
            '#FF3385', '#FF8F33', '#8A33FF', '#33A2FF', '#00a884'
        ];
        if (!name) return '#ccc';
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }, [name]);

    const sizePx = typeof size === 'number' ? `${size}px` : size;

    if (src && src.trim() !== '' && !src.includes('pravatar.cc')) {
        return (
            <img
                src={src}
                alt={name || 'Avatar'}
                className={className}
                loading={priority === 'high' ? 'eager' : 'lazy'}
                // @ts-ignore - fetchPriority is the standard React property name
                fetchPriority={priority}
                style={{
                    width: sizePx,
                    height: sizePx,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    ...style
                }}
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement?.classList.add('avatar-fallback-active');
                }}
            />
        );
    }

    return (
        <div
            className={className}
            style={{
                width: sizePx,
                height: sizePx,
                borderRadius: '50%',
                backgroundColor,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `calc(${sizePx} * 0.4)`,
                fontWeight: 700,
                ...style
            }}
        >
            {initials}
        </div>
    );
};

export default Avatar;
