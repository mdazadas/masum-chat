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
    const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
    const [failedSrc, setFailedSrc] = useState<string | null>(null);

    const initials = useMemo(() => getInitials(alt), [alt]);

    const backgroundColor = useMemo(() => {
        if (previewColor) return previewColor;
        return getHashColor(alt);
    }, [alt, previewColor]);

    const isLoaded = !!src && loadedSrc === src;
    const error = !!src && failedSrc === src;

    useEffect(() => {
        if (!src) return;

        let cancelled = false;
        const img = new Image();
        img.src = src;

        img.onload = () => {
            if (cancelled) return;
            setLoadedSrc(src);
        };

        img.onerror = () => {
            if (cancelled) return;
            setFailedSrc(src);
        };

        return () => {
            cancelled = true;
        };
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
