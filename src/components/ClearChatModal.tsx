import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';

interface ClearChatModalProps {
    contactName: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Shared "Clear Chat" confirmation modal used by both Chat.tsx (three-dot menu)
 * and UserProfile.tsx (profile page danger section).
 * Fully responsive — scales between small (320px) and large (480px) screens.
 */
const ClearChatModal = ({ contactName, isLoading = false, onConfirm, onCancel }: ClearChatModalProps) => {
    return createPortal(
        <div
            className="clear-chat-modal-backdrop"
            onClick={onCancel}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                padding: '16px',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: 'min(340px, calc(100vw - 32px))',
                    backgroundColor: 'var(--surface-color)',
                    borderRadius: '24px',
                    padding: 'clamp(20px, 5vw, 32px) clamp(16px, 5vw, 28px)',
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
                    animation: 'clearModalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'clamp(6px, 2vw, 10px)',
                }}
            >
                <style>{`
                    @keyframes clearModalIn {
                        from { opacity: 0; transform: scale(0.88) translateY(12px); }
                        to   { opacity: 1; transform: scale(1)    translateY(0); }
                    }
                `}</style>

                {/* Icon */}
                <div style={{
                    width: 'clamp(52px, 12vw, 68px)',
                    height: 'clamp(52px, 12vw, 68px)',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '4px',
                }}>
                    <Trash2
                        size={28}
                        color="#ef4444"
                        strokeWidth={2.5}
                        style={{ flexShrink: 0 }}
                    />
                </div>

                {/* Title */}
                <h3 style={{
                    margin: 0,
                    fontSize: 'clamp(17px, 4.5vw, 21px)',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1.25,
                }}>
                    Clear Chat?
                </h3>

                {/* Description */}
                <p style={{
                    margin: '2px 0 12px',
                    fontSize: 'clamp(13px, 3.5vw, 15px)',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.55,
                    maxWidth: '280px',
                }}>
                    All messages with <strong style={{ color: 'var(--text-primary)' }}>{contactName}</strong> will be permanently deleted. This cannot be undone.
                </p>

                {/* Buttons */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: 'clamp(12px, 3.5vw, 15px)',
                            borderRadius: '16px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            fontSize: 'clamp(14px, 3.5vw, 16px)',
                            fontWeight: 700,
                            border: 'none',
                            cursor: isLoading ? 'default' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            transition: 'all 0.2s',
                            letterSpacing: '0.2px',
                        }}
                    >
                        {isLoading ? 'Clearing...' : 'Clear History'}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: 'clamp(12px, 3.5vw, 15px)',
                            borderRadius: '16px',
                            backgroundColor: 'transparent',
                            color: 'var(--text-secondary)',
                            fontSize: 'clamp(14px, 3.5vw, 16px)',
                            fontWeight: 600,
                            border: '1.5px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
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

export default ClearChatModal;
