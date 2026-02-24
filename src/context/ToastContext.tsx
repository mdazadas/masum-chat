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
            gap: '8px',
            width: '90%',
            maxWidth: '360px',
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
            icon: <CheckCircle size={16} color="#fff" />,
            bg: '#00a884', border: '#00c49a', accent: '#00c49a'
        },
        error: {
            icon: <XCircle size={16} color="#fff" />,
            bg: '#e53e3e', border: '#fc8181', accent: '#fc8181'
        },
        warning: {
            icon: <AlertCircle size={16} color="#fff" />,
            bg: '#d97706', border: '#fcd34d', accent: '#fcd34d'
        },
        info: {
            icon: <InfoIcon size={16} color="#fff" />,
            bg: '#3b82f6', border: '#93c5fd', accent: '#93c5fd'
        },
    };
    const c = config[toast.type];

    return (
        <div style={{
            background: 'var(--surface-color)',
            border: `1px solid ${c.border}30`,
            borderLeft: `4px solid ${c.bg}`,
            padding: '10px 12px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'auto',
            animation: 'toast-pop 0.28s cubic-bezier(0.34,1.56,0.64,1)'
        }}>
            {/* App logo icon */}
            <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: c.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: `0 3px 8px ${c.bg}55`
            }}>
                <MessageCircle size={17} color="white" fill="white" />
            </div>
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: c.bg, letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: 2 }}>
                    Masum Chat
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {toast.message}
                </div>
            </div>
            {/* Status icon */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {c.icon}
                </div>
            </div>
            <button
                onClick={onRemove}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '2px', cursor: 'pointer', display: 'flex', flexShrink: 0 }}
            >
                <X size={14} />
            </button>
            <style>{`
                @keyframes toast-pop {
                    from { transform: translateY(14px) scale(0.96); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};
