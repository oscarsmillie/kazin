// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  // THIS LINE IS THE FIX — REQUIRED FOR DOCKER + STANDALONE BUILD
  output: "standalone",

  // --- Your existing (perfect) config ---
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  webpack: (config, { isServer }) => {
    // 1. Client-side: prevent bundling server-only packages
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        puppeteer: false,
        "puppeteer-core": false,
        "@sparticuz/chromium": false,
        "chrome-aws-lambda": false,
      };
    }

    // 2. Server-side: externalize heavy Chromium packages
    if (isServer) {
      // This prevents Webpack from trying to bundle them → fixes Module not found
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push(
          "puppeteer-core",
          "@sparticuz/chromium"
        );
      } else if (typeof config.externals === "object") {
        config.externals["puppeteer-core"] = "commonjs puppeteer-core";
        config.externals["@sparticuz/chromium"] = "commonjs @sparticuz/chromium";
      }
    }

    return config;
  },
};

export default nextConfig;