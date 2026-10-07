/** Focus-view drawing per server module: a transparent poster and its seamless VP9-alpha loop. */
export const serverFocusMedia = {
  network: { poster: "/assets/server-focus/network-poster-67708c372b5e.webp", video: "/assets/server-focus/network-af16fb4d6a92.webm", alt: "服务器双口网卡线稿" },
  hardware: { poster: "/assets/server-focus/hardware-poster-41abb5a8e3e3.webp", video: "/assets/server-focus/hardware-a51f3fd7ce71.webm", alt: "服务器处理器线稿" },
  agent: { poster: "/assets/server-focus/agent-poster-eb48f1410342.webp", video: "/assets/server-focus/agent-ae3fbabc79d5.webm", alt: "服务器显卡线稿" },
  data: { poster: "/assets/server-focus/data-poster-ca269656e99f.webp", video: "/assets/server-focus/data-79b3f4040d30.webm", alt: "服务器 NVMe 存储线稿" },
  containers: { poster: "/assets/server-focus/containers-poster-e9fea781cd60.webp", video: "/assets/server-focus/containers-8fd20a0e5d05.webm", alt: "服务器容器运行核心线稿" },
} as const;
