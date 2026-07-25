import type { NextConfig } from "next";

// The blog is a static export: `next build` writes plain HTML/CSS/JS to out/,
// which any static host serves. There is no server runtime anywhere in openblog.
//
// Dev and build use separate output directories so a running `npm run dev` can
// never poison a production build's cache (and vice versa).
const isBuild = process.env.NEXT_BUILD_MODE === "1";

const nextConfig: NextConfig = {
  output: "export",
  distDir: isBuild ? ".next" : ".next-dev",
  // Every route becomes a directory with an index.html, which is what static
  // hosts expect — without it, /writing/hello would 404 on GitHub Pages.
  trailingSlash: true,
  // Next's image optimizer needs a server; a static export has none.
  images: { unoptimized: true }
};

export default nextConfig;
