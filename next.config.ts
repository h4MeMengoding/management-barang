import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      },
    ],
  },
  // Ensure font files are available in serverless functions
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Copy font files to server build
      config.resolve.alias = {
        ...config.resolve.alias,
        '@fonts': require('path').join(__dirname, 'public/fonts'),
      };
      
      // Ensure font files are copied to build output
      config.module.rules.push({
        test: /\.(ttf|otf|woff|woff2)$/,
        use: {
          loader: 'file-loader',
          options: {
            outputPath: 'static/fonts/',
            publicPath: '/_next/static/fonts/',
          },
        },
      });

      // Try to add CopyPlugin if available
      try {
        const CopyPlugin = require('copy-webpack-plugin');
        config.plugins = config.plugins || [];
        config.plugins.push(
          new CopyPlugin({
            patterns: [
              {
                from: require('path').join(__dirname, 'public/fonts'),
                to: require('path').join(__dirname, '.next/static/fonts'),
              },
            ],
          })
        );
      } catch (error) {
        console.log('CopyPlugin not available, relying on build script for font copying');
      }
    }
    return config;
  },
  // PWA configuration
  headers: async () => {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
  // React strict mode to catch issues early
  reactStrictMode: true,
};

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development to avoid errors
  register: true,
  skipWaiting: true,
  sw: 'sw.js',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-static',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /\.(?:js|css|woff|woff2|ttf|otf)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    {
      urlPattern: /\/api\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60 // 5 minutes
        }
      }
    }
  ]
})(nextConfig);

export default pwaConfig;
