// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- Existing Configurations (Intact) ---
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
    // 1. Client-Side (isServer === false) Fix: 
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        puppeteer: false,
        // Remove the old package, but keep 'puppeteer' false for the browser side
        'chrome-aws-lambda': false, 
        '@sparticuz/chromium': false, // Add the new package to the browser-side ignore list
      };
    }

    // ---
    // 2. Server-Side (isServer === true) Fixes
    // ---

    if (isServer) {
      // 🚨 CRITICAL FIX UPDATED: Externalize the new package name.
      // This solves the 'Module not found' errors by preventing Webpack 
      // from bundling the packages needed for the serverless environment.
      config.externals.push('@sparticuz/chromium', 'puppeteer-core');


      // Server-Side Map File Fix (Left intact, although usually not necessary 
      // for @sparticuz/chromium, it ensures compatibility if needed.)
      // Note: If you encounter new build warnings, you may choose to remove this block later.
      config.module.rules.push({
        test: /\.js\.map$/,
        // This path is technically for the old package, but leaving for robustness.
        include: /node_modules[\\/]chrome-aws-lambda[\\/]build/, 
        type: 'asset/source', 
      });
    }

    return config;
  },
};

export default nextConfig;
