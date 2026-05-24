import type { NextConfig } from "next";

/**
 * El navegador llama a /nest-api/*; el proxy en app/nest-api/[...path]/route.ts
 * reenvía a NEST_INTERNAL_URL (runtime: http://api:3001 en Docker).
 */
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
