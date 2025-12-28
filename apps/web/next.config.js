/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@selnet/shared'],

  // Image optimization - optimized sizes
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: ['selnet.bg', 'api.selnet.bg', 'images.unsplash.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Reduced from 3840
    imageSizes: [16, 32, 48, 64, 96, 128, 256], // Reduced from 384
  },

  // Production build optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: false, // не пращаме source maps към клиента
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false
  },

  // Security headers (fallback ако middleware не се изпълни)
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          // Допълнителни безп. заглавки, ако middleware не се изпълни (fallback)
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
        ]
      }
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), notification=(self)'
          }
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          }
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      {
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      }
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Rewrites for clean URLs
  async rewrites() {
    return [
      {
        source: '/signal',
        destination: '/signal.html',
      },
      {
        source: '/signals',
        destination: '/signals.html',
      },
      {
        source: '/login',
        destination: '/login.html',
      },
      {
        source: '/register',
        destination: '/login.html',
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '2.0.0',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
