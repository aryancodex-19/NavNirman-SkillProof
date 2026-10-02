import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // pdf-parse bundles pdfjs-dist which references browser Canvas APIs (DOMMatrix).
  // Marking as serverExternalPackages prevents Next.js from bundling it at build time;
  // Node.js require() loads it at runtime where those APIs are polyfilled/absent.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
