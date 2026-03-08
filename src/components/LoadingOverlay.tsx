

interface LoadingOverlayProps {
    message?: string;
    transparent?: boolean;
}

const LoadingOverlay = ({ message = 'Loading...', transparent = false }: LoadingOverlayProps) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: transparent ? 'transparent' : 'var(--surface-color)',
            backdropFilter: transparent ? 'none' : 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            gap: '20px'
        }}>
            <div className="spinner" style={{
                width: 44,
                height: 44,
                borderWidth: 3,
                borderColor: 'var(--primary-glow)',
                borderTopColor: 'var(--primary-color)',
                boxShadow: '0 0 15px var(--primary-glow)'
            }} />
            {message && (
                <p style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                    animation: 'loading-pulse 1.8s ease-in-out infinite'
                }}>
                    {message}
                </p>
            )}
            <style>{`
                @keyframes loading-pulse {
                    0%, 100% { opacity: 0.4; transform: scale(0.98); }
                    50% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default LoadingOverlay;
