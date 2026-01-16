import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Optimize for production
    reactStrictMode: true,

    // Standalone output is more efficient for deployment
    output: 'standalone',

    // Image optimization for Supabase storage
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'vmiblbbikkqxynutwucw.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
        formats: ['image/avif', 'image/webp'],
    },

    // Remove console logs in production
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Ignore ESLint errors during deployment
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Optimization for faster loads
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=*, microphone=*, geolocation=()'
                    }
                ],
            },
        ];
    },
};

export default nextConfig;
