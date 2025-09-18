/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  experimental: {
    // tell Next to treat this package as an external (don’t bundle it)
    serverComponentsExternalPackages: ['html-docx-js'],
  },

   webpack(config, { isServer }) {
    if (isServer) {
      // ensure it's left as a runtime require in server output
      config.externals = config.externals || [];
      if (!config.externals.includes('html-docx-js')) {
        config.externals.push('html-docx-js');
      }
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
