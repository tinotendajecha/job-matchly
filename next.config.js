/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do NOT use `output: 'export'` (breaks API routes)

  experimental: {
    // Keep these as externals so Next doesn't try to bundle them
    serverComponentsExternalPackages: [
      'html-docx-js',
      'playwright-core',
      '@sparticuz/chromium',
    ],

    // Ensure chromium brotli binaries are included in the serverless function
    outputFileTracingIncludes: {
      // Must match the route path for app router
      '/api/export/pdf/route': ['node_modules/@sparticuz/chromium/bin/**'],
    },
  },

  webpack(config, { isServer }) {
    if (isServer) {
      // Ensure externals exists and is an array before pushing
      if (!config.externals) config.externals = [];
      if (Array.isArray(config.externals)) {
        // Leave these to be required at runtime server-side
        for (const pkg of ['html-docx-js', 'playwright-core', '@sparticuz/chromium']) {
          if (!config.externals.includes(pkg)) config.externals.push(pkg);
        }

        // (Optional) keep electron external if you reference it anywhere server-side
        config.externals.push({ electron: 'commonjs electron' });
      }
    }

    // Don’t parse html-docx-js template files
    config.module.noParse = config.module.noParse || [];
    config.module.noParse.push(/html-docx-js[\\/]build[\\/]templates[\\/].*\.js$/);

    return config;
  },

  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
};

module.exports = nextConfig;
