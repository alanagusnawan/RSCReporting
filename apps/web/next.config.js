/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@rsc/report-schema',
    '@rsc/expression-engine',
    '@rsc/reporting-engine',
    '@rsc/takumi-renderer',
  ],
  allowedDevOrigins: [
    '200.200.100.148',
    '200.200.100.148:5499',
    'http://200.200.100.148',
    'http://200.200.100.148:5499',
  ],
  async rewrites() {
    const backendHost = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:5488';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendHost}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
