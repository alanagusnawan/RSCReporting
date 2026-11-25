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
};

module.exports = nextConfig;
