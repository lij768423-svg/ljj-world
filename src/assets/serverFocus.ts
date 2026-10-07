/**
 * Focus-view media per server module. Light-effect modules play a flicker-free VP9-alpha loop over
 * their poster; fan modules show the original drawing with its fans spun live (ServerFocusOverlay).
 */
export const serverFocusMedia: Record<string, { poster: string; video?: string; alt: string }> = {
  network: { poster: "/assets/server-focus/network-poster-9b81e097caea.webp", video: "/assets/server-focus/network-8e77606adfcb.webm", alt: "服务器双口网卡线稿" },
  hardware: { poster: "/assets/server-focus/hardware-poster-a8f3fbed558f.webp", video: "/assets/server-focus/hardware-332a29a5b407.webm", alt: "服务器处理器线稿" },
  agent: { poster: "/assets/server-parts/gpu-line-0e53f203a509.webp", alt: "服务器显卡线稿" },
  data: { poster: "/assets/server-focus/data-poster-c22fb6c186b6.webp", video: "/assets/server-focus/data-0e08c6aae137.webm", alt: "服务器 NVMe 存储线稿" },
  containers: { poster: "/assets/server-parts/container-line-4f12e6e02f85.webp", alt: "服务器容器运行核心线稿" },
};
