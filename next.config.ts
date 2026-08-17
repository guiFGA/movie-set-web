import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  serverExternalPackages: ["sequelize", "pg", "pg-hstore"],
  allowedDevOrigins:[
    "192.168.0.11",
  ],
};

export default nextConfig;
