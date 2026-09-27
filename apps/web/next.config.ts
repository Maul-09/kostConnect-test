import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Matikan telemetry & optimize routing
  poweredByHeader: false,
  reactStrictMode: false,
};

export default nextConfig;
