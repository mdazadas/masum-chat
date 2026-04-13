import { useMemo, useState } from 'react';
import { getInitials, getHashColor } from '../lib/utils';

interface AvatarProps {
    src?: string | null;
    name?: string | null;
    size?: number | string;
    className?: string;
    style?: React.CSSProperties;
    priority?: 'high' | 'low' | 'auto';
}

const Avatar = ({ src, name, size = 40, className = '', style = {}, priority = 'auto' }: AvatarProps) => {
    const initials = useMemo(() => getInitials(name), [name]);
    const backgroundColor = useMemo(() => getHashColor(name), [name]);
    const [failedSrc, setFailedSrc] = useState<string | null>(null);

    const sizePx = typeof size === 'number' ? `${size}px` : size;

    if (src && src.trim() !== '' && !src.includes('pravatar.cc') && failedSrc !== src) {
        return (
            <img
                src={src}
                alt={name || 'Avatar'}
                className={className}
                loading={priority === 'high' ? 'eager' : 'lazy'}
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
                    setFailedSrc(src);
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
