import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sequelize", "pg"],
  allowedDevOrigins:[
    "192.168.0.11",
  ],
};

export default nextConfig;
