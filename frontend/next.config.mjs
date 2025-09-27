/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
      lokijs: false,
      encoding: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      path: false,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
    };

    // Handle node: protocol imports
    config.resolve.alias = {
      ...config.resolve.alias,
      "node:crypto": "crypto-browserify",
      "node:stream": "stream-browserify",
      "node:path": "path-browserify",
      "node:fs": false,
      "node:net": false,
      "node:tls": false,
    };

    // Ignore warnings for these modules
    config.ignoreWarnings = [
      { module: /node_modules\/pino/ },
      { module: /node_modules\/@walletconnect/ },
      { module: /node_modules\/@0glabs/ },
    ];

    return config;
  },
};

export default nextConfig;
