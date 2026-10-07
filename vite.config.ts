import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon-192x192.png", "icon-512x512.png"],
      manifestFilename: "diet-memory.webmanifest",
      manifest: {
        name: "Diet Memory",
        short_name: "DietMemory",
        description: "식단, 몸무게, 운동과 일정을 기록하는 개인 건강 기록 앱",
        lang: "ko",
        theme_color: "#19448c",
        background_color: "#f8fafb",
        display: "standalone",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
    cloudflare(),
  ],
});
