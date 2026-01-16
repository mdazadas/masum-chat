'use client';

import { useState, useEffect } from 'react';

export function useMobileViewport() {
    const [viewportHeight, setViewportHeight] = useState('100dvh');
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.visualViewport) return;

        const handleResize = () => {
            const vv = window.visualViewport;
            if (!vv) return;

            // Set height to actual visible height
            setViewportHeight(`${vv.height}px`);

            // Heuristic for keyboard: if viewport is significantly smaller than window height
            const isKeyboard = vv.height < window.innerHeight * 0.85;
            setIsKeyboardOpen(isKeyboard);
        };

        window.visualViewport.addEventListener('resize', handleResize);
        window.visualViewport.addEventListener('scroll', handleResize);

        handleResize();

        return () => {
            window.visualViewport?.removeEventListener('resize', handleResize);
            window.visualViewport?.removeEventListener('scroll', handleResize);
        };
    }, []);

    return { viewportHeight, isKeyboardOpen };
}
