/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    // Server-only packages that webpack should NOT bundle
    // (use dynamic require, native modules, or have heavy/conflicting deps)
    serverComponentsExternalPackages: [
      "@prisma/client",
      "bcrypt",
      "playwright",
      "playwright-core",
      "playwright-extra",
      "puppeteer-extra-plugin",
      "puppeteer-extra-plugin-stealth",
    ],
  },
};

export default nextConfig;
