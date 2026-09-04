import type { NextConfig } from "next";

const rootDir = process.cwd();

const nextConfig: NextConfig = {
  turbopack: {
    root: rootDir,
  },
  outputFileTracingRoot: rootDir,

  // For Capacitor Android: allow serving from the app's origin
  // so that Supabase auth cookies work properly
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Permissive CSP for Capacitor WebView (local assets served via file:// or android://)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.razorpay.com https://checkout.razorpay.com https://api.groq.com wss://*.supabase.co wss://*.supabase.in",
              "frame-src 'self' https://*.razorpay.com https://checkout.razorpay.com https://accounts.google.com",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://accounts.google.com",
              "img-src 'self' data: blob: https: http:",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
            ].join("; "),
          },
          // Allow cross-origin for API calls
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      {
        source: "/cmaps/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  // Image optimization for external URLs
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
    ],
  },
};

export default nextConfig;
