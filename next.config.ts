import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Make sure the course material files are shipped with the server code on Vercel.
  outputFileTracingIncludes: {
    "/api/ask": ["./materials/**/*"],
  },
};

export default nextConfig;
