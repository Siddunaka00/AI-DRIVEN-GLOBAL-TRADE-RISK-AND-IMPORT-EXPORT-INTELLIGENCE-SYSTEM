/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: undefined,
  experimental: { serverComponentsExternalPackages: ["better-sqlite3"] },
};
export default nextConfig;
