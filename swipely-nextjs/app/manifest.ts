import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Swipely — AI-карусели",
    short_name: "Swipely",
    description: "AI-генератор каруселей для ВКонтакте, Instagram, Telegram и LinkedIn",
    start_url: "/generate",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0D0D14",
    theme_color: "#0D0D14",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
