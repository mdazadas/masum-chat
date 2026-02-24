

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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            gap: '16px'
        }}>
            <div className="spinner" style={{
                width: 48,
                height: 48,
                borderWidth: 4,
                borderColor: 'var(--secondary-color)',
                borderTopColor: 'var(--primary-color)'
            }} />
            {message && (
                <p style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.3px',
                    animation: 'pulse 2s infinite'
                }}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default LoadingOverlay;
