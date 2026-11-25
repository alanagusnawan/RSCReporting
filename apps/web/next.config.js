/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@rsc/report-schema',
    '@rsc/expression-engine',
    '@rsc/reporting-engine',
    '@rsc/takumi-renderer',
  ],
};

module.exports = nextConfig;
