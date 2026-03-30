import { createPortal } from 'react-dom';
import { Ban } from 'lucide-react';

interface BlockUserModalProps {
    contactName: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Shared "Block User" confirm modal used by both Chat.tsx and UserProfile.tsx.
 * Compact, responsive — scales between 320px and 480px screens using clamp().
 */
const BlockUserModal = ({ contactName, isLoading = false, onConfirm, onCancel }: BlockUserModalProps) => {
    return createPortal(
        <div
            onClick={onCancel}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                padding: '16px',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: 'min(320px, calc(100vw - 32px))',
                    backgroundColor: 'var(--surface-color)',
                    borderRadius: '20px',
                    padding: 'clamp(16px, 4vw, 24px) clamp(14px, 4vw, 22px)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                    animation: 'blockModalIn 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'clamp(4px, 1.5vw, 8px)',
                }}
            >
                <style>{`
                    @keyframes blockModalIn {
                        from { opacity: 0; transform: scale(0.88) translateY(10px); }
                        to   { opacity: 1; transform: scale(1) translateY(0); }
                    }
                `}</style>

                {/* Icon */}
                <div style={{
                    width: 'clamp(44px, 10vw, 56px)',
                    height: 'clamp(44px, 10vw, 56px)',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '2px',
                }}>
                    <Ban size={24} color="#ef4444" strokeWidth={2.5} />
                </div>

                {/* Title */}
                <h3 style={{
                    margin: 0,
                    fontSize: 'clamp(15px, 4vw, 18px)',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1.25,
                }}>
                    Block {contactName}?
                </h3>

                {/* Description */}
                <p style={{
                    margin: '2px 0 10px',
                    fontSize: 'clamp(12px, 3vw, 13px)',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    maxWidth: '260px',
                }}>
                    Blocked contacts won't be able to call you or send messages. They won't be notified.
                </p>

                {/* Buttons */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: 'clamp(10px, 3vw, 13px)',
                            borderRadius: '14px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            fontSize: 'clamp(13px, 3.5vw, 15px)',
                            fontWeight: 700,
                            border: 'none',
                            cursor: isLoading ? 'default' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        {isLoading ? 'Blocking...' : 'Block User'}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: 'clamp(10px, 3vw, 13px)',
                            borderRadius: '14px',
                            backgroundColor: 'transparent',
                            color: 'var(--text-secondary)',
                            fontSize: 'clamp(13px, 3.5vw, 15px)',
                            fontWeight: 600,
                            border: '1.5px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BlockUserModal;
