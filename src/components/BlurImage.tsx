import { useState, useEffect, useMemo } from 'react';
import { getInitials, getHashColor } from '../lib/utils';

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

    const initials = useMemo(() => getInitials(alt), [alt]);

    const backgroundColor = useMemo(() => {
        if (previewColor) return previewColor;
        return getHashColor(alt);
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
