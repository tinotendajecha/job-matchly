/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  experimental: {
    // Combine serverComponentsExternalPackages
    serverComponentsExternalPackages: ['html-docx-js', 'playwright-core'],
    
    // Add the Vercel-specific outputFileTracingIncludes
    outputFileTracingIncludes: {
      'app/api/export/pdf/route.ts': [
        './node_modules/@sparticuz/chromium/**'
      ],
    },
  },

  webpack(config, { isServer }) {
    // The webpack logic is already identical, so no changes are needed.
    if (isServer) {
      // Initialize externals if not present, then push new ones.
      config.externals = config.externals || [];
      
      // Ensure html-docx-js is left as a runtime require in server output
      if (!config.externals.includes('html-docx-js')) {
        config.externals.push('html-docx-js');
      }

      // Add electron to the list of externals for the server build
      config.externals.push({
        electron: 'commonjs electron',
      });
    }
    
    // belt-and-suspenders: if webpack ever sees the template files, don't parse them
    config.module.noParse = config.module.noParse || [];
    config.module.noParse.push(/html-docx-js[\\/]build[\\/]templates[\\/].*\.js$/);
    return config;
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
