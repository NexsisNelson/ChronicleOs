/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.walrus-testnet-gateway.sui.io',
      },
      {
        protocol: 'https',
        hostname: '**.walrus.io',
      },
    ],
  },
}

module.exports = nextConfig
