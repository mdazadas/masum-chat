import { useState, useEffect, useMemo } from 'react';

interface BlurImageProps {
    src: string | null | undefined;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    previewColor?: string;
}

const BlurImage = ({ src, alt, className = '', style = {}, previewColor }: BlurImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);

    const initials = useMemo(() => {
        if (!alt) return '?';
        const parts = alt.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
    }, [alt]);

    const backgroundColor = useMemo(() => {
        if (previewColor) return previewColor;
        const colors = [
            '#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3',
            '#FF3385', '#FF8F33', '#8A33FF', '#33A2FF', '#00a884'
        ];
        if (!alt) return '#ccc';
        let hash = 0;
        for (let i = 0; i < alt.length; i++) {
            hash = alt.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }, [alt, previewColor]);

    useEffect(() => {
        if (!src) {
            setIsLoaded(false);
            setError(false);
            return;
        }
        setIsLoaded(false);
        setError(false);
        const img = new Image();
        img.src = src;
        img.onload = () => setIsLoaded(true);
        img.onerror = () => setError(true);
    }, [src]);

    return (
        <div
            className={`blur-image-container ${className}`}
            style={{
                position: 'relative',
                overflow: 'hidden',
                backgroundColor,
                ...style
            }}
        >
            {src && !error ? (
                <>
                    {!isLoaded && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            filter: 'blur(10px)',
                            backgroundColor,
                            opacity: 0.5
                        }} />
                    )}
                    <img
                        src={src}
                        alt={alt}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: isLoaded ? 1 : 0,
                            transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            filter: isLoaded ? 'none' : 'blur(10px)',
                            transform: isLoaded ? 'scale(1)' : 'scale(1.05)',
                            willChange: 'opacity, filter'
                        }}
                    />
                </>
            ) : (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 'calc(100% * 0.4)'
                }}>
                    {initials}
                </div>
            )}

            <style>{`
                .blur-image-container img {
                    display: block;
                }
            `}</style>
        </div>
    );
};

export default BlurImage;
