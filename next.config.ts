import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.DOCKER_BUILD === "true"
    ? { output: "standalone" }
    : {}),

  serverExternalPackages: ["sequelize", "pg", "pg-hstore"],
  allowedDevOrigins:[
    "192.168.0.11",
  ],
};

export default nextConfig;
