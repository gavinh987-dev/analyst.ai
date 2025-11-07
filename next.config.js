/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for deployment
  output: 'export',
  // Disable server-side features for static export
  trailingSlash: true,
}

module.exports = nextConfig
