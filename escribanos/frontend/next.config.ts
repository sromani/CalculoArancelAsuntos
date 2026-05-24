import type { NextConfig } from "next";

/**
 * El navegador llama solo al front (mismo origen) bajo /nest-api/*;
 * Next reenvía al API Nest y evita CORS y mezclas localhost vs 127.0.0.1.
 * Definí NEST_INTERNAL_URL en .env.local si el API corre en otro host/puerto.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const base = (process.env.NEST_INTERNAL_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
    return [
      {
        source: "/nest-api/:path*",
        destination: `${base}/:path*`,
      },
    ];
  },
};

export default nextConfig;
