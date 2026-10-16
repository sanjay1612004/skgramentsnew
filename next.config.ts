import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // The compiler API avoids an empty CLI capture seen with Node 24 during builds.
  experimental: { useTypeScriptCli: false },
};
export default config;
