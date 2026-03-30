import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info as InfoIcon, X, MessageCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

const MAX_TOASTS = 3;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts(prev => {
            // Enforce max 3: trim oldest if needed
            const trimmed = prev.length >= MAX_TOASTS ? prev.slice(prev.length - MAX_TOASTS + 1) : prev;
            return [...trimmed, { id, message, type }];
        });
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
        </ToastContext.Provider>
    );
};

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: number) => void }) => {
    if (toasts.length === 0) return null;
    return (
        <div style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            width: '90%',
            maxWidth: '280px',
            pointerEvents: 'none'
        }}>
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const ToastItem = ({ toast, onRemove }: { toast: Toast, onRemove: () => void }) => {
    const config: Record<ToastType, { icon: React.ReactElement; bg: string; border: string; accent: string }> = {
        success: {
            icon: <CheckCircle size={14} color="#fff" />,
            bg: 'var(--primary-color)', border: 'var(--primary-color)', accent: 'var(--primary-dark)'
        },
        error: {
            icon: <XCircle size={14} color="#fff" />,
            bg: '#e53e3e', border: '#fc8181', accent: '#fc8181'
        },
        warning: {
            icon: <AlertCircle size={14} color="#fff" />,
            bg: '#d97706', border: '#fcd34d', accent: '#fcd34d'
        },
        info: {
            icon: <InfoIcon size={14} color="#fff" />,
            bg: '#3b82f6', border: '#93c5fd', accent: '#93c5fd'
        },
    };
    const c = config[toast.type];

    return (
        <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
            WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(180%)',
            border: `1px solid var(--glass-border)`,
            borderLeft: `3px solid ${c.bg}`,
            padding: '6px 10px',
            borderRadius: '24px',
            boxShadow: 'var(--glass-shadow)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'auto',
            animation: 'toast-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
            {/* App logo icon */}
            <div style={{
                width: 22, height: 22, borderRadius: 11,
                background: `linear-gradient(135deg, ${c.bg}, ${c.accent})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: `0 2px 6px var(--primary-glow)`
            }}>
                <MessageCircle size={12} color="white" fill="white" />
            </div>
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '8px', fontWeight: 800, color: c.bg, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 1 }}>
                    Notification
                </div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2, opacity: 0.95 }}>
                    {toast.message}
                </div>
            </div>
            {/* Status icon or Close */}
            <button
                onClick={onRemove}
                style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    padding: '4px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                }}
            >
                <X size={12} />
            </button>
            <style>{`
                @keyframes toast-pop {
                    from { transform: translateY(20px) scale(0.9); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};
