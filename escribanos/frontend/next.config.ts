import type { NextConfig } from "next";

/**
 * El navegador llama a /nest-api/*; el proxy en app/nest-api/[...path]/route.ts
 * reenvía a BACKEND_API_URL (runtime: http://api:4000/api/v1 en Docker).
 */
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
