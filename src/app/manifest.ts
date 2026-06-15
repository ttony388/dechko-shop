import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Дечко",
    short_name: "Дечко",
    description: "Красиви неща за детството",
    start_url: "/",
    display: "standalone",
    background_color: "#fffaf2",
    theme_color: "#20c4c8",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
