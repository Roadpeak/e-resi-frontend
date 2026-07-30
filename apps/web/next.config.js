//@ts-check
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone bundle for docker deploy — self-contained server.js under
  // .next/standalone that we copy into the runtime image.
  output: 'standalone',
  // pnpm workspace: hoisted node_modules live at the workspace root, two
  // levels up from apps/web. Set explicitly so Next's file tracer picks
  // them up instead of tracing from apps/web/ alone.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'eresi-media.fra1.digitaloceanspaces.com' },
      { protocol: 'https', hostname: 'media.e-resi.co.ke' },
    ],
  },
};

module.exports = nextConfig;
