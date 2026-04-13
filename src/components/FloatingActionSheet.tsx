import React from 'react';
import { createPortal } from 'react-dom';

interface FloatingActionSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
}

const FloatingActionSheet: React.FC<FloatingActionSheetProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children
}) => {
    return createPortal(
        <div className={`fas-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div
                className={`fas-container ${isOpen ? 'open' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="fas-handle-bar" />

                <div className="fas-header">
                    <div className="fas-header-text">
                        {title && <h3>{title}</h3>}
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                </div>

                <div className="fas-body">
                    {children}
                </div>
            </div>

            <style>{`
                .fas-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0);
                    backdrop-filter: blur(0px);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 5000;
                    pointer-events: none;
                    visibility: hidden;
                }
                .fas-overlay.open {
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(var(--glass-blur));
                    pointer-events: auto;
                    visibility: visible;
                }

                .fas-container {
                    position: fixed;
                    bottom: -100%;
                    left: 0;
                    right: 0;
                    margin: 0 auto;
                    max-width: 450px;
                    background: var(--glass-bg);
                    backdrop-filter: blur(var(--glass-blur));
                    -webkit-backdrop-filter: blur(var(--glass-blur));
                    border-top: 1px solid var(--glass-border);
                    border-radius: 20px 20px 0 0;
                    padding: 8px 16px calc(20px + env(safe-area-inset-bottom));
                    transition: bottom 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: var(--glass-shadow);
                    z-index: 5001;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                }
                .fas-container.open {
                    bottom: 0;
                }

                .fas-body {
                    overflow-y: auto;
                    flex: 1;
                    padding-bottom: 10px;
                }

                .fas-handle-bar {
                    width: 40px;
                    height: 4px;
                    background: var(--border-color);
                    border-radius: 10px;
                    margin: 0 auto 12px;
                    opacity: 0.5;
                }

                .fas-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    padding: 0 4px;
                }
                .fas-header-text h3 {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0;
                }
                .fas-header-text p {
                    font-size: 13px;
                    color: var(--text-secondary);
                    font-weight: 500;
                    margin: 2px 0 0;
                    opacity: 0.8;
                }

                .fas-close-btn {
                    background: var(--secondary-color);
                    border: 1px solid var(--border-color);
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-primary);
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: var(--shadow-sm);
                }
                .fas-close-btn:active { transform: scale(0.9); }
                .fas-close-btn:hover { background: var(--input-bg); }

                .fas-body > * {
                    animation: slideUpContent 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes slideUpContent {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default FloatingActionSheet;
