import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Optimize for production
    reactStrictMode: true,

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

    // TypeScript errors
    typescript: {
        ignoreBuildErrors: true,
    },

    // Webpack configuration for better chunk loading
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        commons: {
                            name: 'commons',
                            chunks: 'all',
                            minChunks: 2,
                        },
                    },
                },
            };
        }
        return config;
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
                    },
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*'
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, OPTIONS'
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization'
                    }
                ],
            },
        ];
    },
};

export default nextConfig;
