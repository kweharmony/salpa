import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Отключаем Next Dev Tools UI и индикаторы в dev-режиме
  devIndicators: false,
  // Заголовки для SharedArrayBuffer (необходимо для ffmpeg.wasm)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
