/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude problematic packages from client-side bundling
  transpilePackages: [],
  
  webpack: (config, { isServer }) => {
    // Add fallbacks for node modules that coffee-script expects
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: require.resolve('path-browserify'),
      file: false, // Explicitly mark 'file' as a missing module
      system: false, // Add fallback for 'system' module
    };
    
    // For client-side builds, ignore problematic Node.js modules from coffee-script
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'coffee-script': false,
        'schematic/lib/Compiler': false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig; 