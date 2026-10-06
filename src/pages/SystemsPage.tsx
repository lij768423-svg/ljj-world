import { Database } from "@phosphor-icons/react/Database";
import { GlobeHemisphereWest } from "@phosphor-icons/react/GlobeHemisphereWest";
import { HardDrives } from "@phosphor-icons/react/HardDrives";
import { OpenAiLogo } from "@phosphor-icons/react/OpenAiLogo";
import { Stack } from "@phosphor-icons/react/Stack";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { MobileServerStory } from "../components/MobileServerStory";

const ServerExplodedStory = lazy(() => import("../components/ServerExplodedStory").then((module) => ({ default: module.ServerExplodedStory })));
const serverFacts = [
  { label: "主机", value: "home-serve" },
  { label: "运行容器", value: "119" },
  { label: "内存", value: "59 GiB" },
  { label: "NVMe 存储", value: "5.4 TB" },
] as const;

type TopologyCategoryId = "network" | "hardware" | "agent" | "data" | "containers";

type TopologyService = {
  id: string;
  name: string;
  kind: string;
  description: string;
  connection: string;
  deployment: string;
  entryLabel: string;
  entryUrl?: string;
};

type TopologyCategory = {
  id: TopologyCategoryId;
  label: string;
  shortLabel: string;
  description: string;
  x: number;
  y: number;
  icon: ReactNode;
  services: TopologyService[];
};

const topologyCategories: TopologyCategory[] = [
  {
    id: "network",
    label: "网络与入口",
    shortLabel: "NETWORK",
    description: "把公开入口、私有接入、反向代理和端到端检查拆成不同边界。",
    x: 19,
    y: 25,
    icon: <GlobeHemisphereWest size={43} weight="thin" />,
    services: [
      {
        id: "tailscale",
        name: "Tailscale",
        kind: "私有接入",
        description: "远程开发、后台和管理端只在 Tailnet 内访问。",
        connection: "设备到主机的加密直连",
        deployment: "宿主机运行 tailscaled；双口 2.5G 网卡做 active-backup bonding，后台和管理端绑 Tailnet。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "cloudflare",
        name: "Cloudflare Tunnel",
        kind: "公开入口",
        description: "只把需要公开的项目域名送入公网，不直接暴露家庭网络端口。",
        connection: "公开域名到指定内网服务",
        deployment: "cloudflared 容器只建立出站隧道，公开域名按服务单独放行。",
        entryLabel: "查看公开项目",
        entryUrl: "https://quiz.hermesjj.com",
      },
      {
        id: "caddy",
        name: "Caddy",
        kind: "服务路由",
        description: "为代理面板注入后端地址，并把浏览器请求转发到内部服务。",
        connection: "9097 到 MetaCubeXD 与 Mihomo API",
        deployment: "management Compose 中运行独立 Caddy 容器，Caddyfile 只读挂载。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "uptime-kuma",
        name: "Uptime Kuma",
        kind: "可用性",
        description: "从用户视角持续检查网页和接口，而不只判断容器是否运行。",
        connection: "服务响应到状态记录",
        deployment: "Docker Compose 运行，持续探测关键网页与接口的真实响应。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "network-probe",
        name: "延迟探针",
        kind: "链路诊断",
        description: "并行测量节点延迟，并区分直连、DERP 与无响应状态。",
        connection: "Tailnet 多节点探测",
        deployment: "tailscale-latency 容器并行探测节点，结果在浏览器中实时刷新。",
        entryLabel: "仅 Tailnet 内可用",
      },
    ],
  },
  {
    id: "agent",
    label: "Agent 与 AI",
    shortLabel: "AGENT",
    description: "模型网关、代理任务和生成工作流共享同一套服务器能力。",
    x: 81,
    y: 25,
    icon: <OpenAiLogo size={43} weight="thin" />,
    services: [
      {
        id: "sub2api",
        name: "Sub2API",
        kind: "模型网关",
        description: "集中管理上游模型、兼容接口与调用配额。",
        connection: "客户端到多模型上游",
        deployment: "Docker Compose 连接 PostgreSQL、Redis 与兼容代理，管理端单独绑定 Tailnet。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "grok2api",
        name: "Grok2API",
        kind: "Grok 网关",
        description: "把 Grok 会话转成兼容接口，给编辑器和本地工具调用。",
        connection: "客户端到 Grok 上游与出口节点",
        deployment: "Compose 常驻，配合降智监视和会话轮换，管理端只绑 Tailnet。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "qwen38",
        name: "Qwen 3.8 27B",
        kind: "本地推理",
        description: "vLLM 加载 27B 权重，Open WebUI 提供 256K 上下文对话。",
        connection: "4090 到本机聊天与 OpenAI 兼容接口",
        deployment: "独立 Compose 管理模型推理与聊天界面；权重保存在本机，管理入口仅在私有网络开放，不用时整套停掉。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "comfyui",
        name: "ComfyUI",
        kind: "图像工作流",
        description: "本地编排图片生成和处理节点，生成结果回到自己的存储。",
        connection: "GPU 到生成结果与本地存储",
        deployment: "Docker Compose 直连 NVIDIA GPU，工作流与模型保存在独立数据卷。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "agent-console",
        name: "Agent Console",
        kind: "任务工作台",
        description: "在浏览器里管理项目分支、任务队列和执行记录。",
        connection: "仓库到代理进程",
        deployment: "Vite 工作台按需启动，只在 Tailnet 内提供配置与任务管理界面。",
        entryLabel: "仅 Tailnet 内可用",
      },
    ],
  },
  {
    id: "hardware",
    label: "硬件与算力",
    shortLabel: "HARDWARE",
    description: "计算、显存、存储和传感器共同构成可长期维护的本地底座。",
    x: 19,
    y: 70,
    icon: <HardDrives size={43} weight="thin" />,
    services: [
      {
        id: "cpu",
        name: "Ryzen 9 9950X",
        kind: "计算",
        description: "16 核 32 线程，跑容器、编译、转码和并行代理。",
        connection: "主机计算核心到全部工作负载",
        deployment: "装在 ASUS ProArt X870E-CREATOR WIFI 上，直接承载全部主机工作负载。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "gpu",
        name: "RTX 4090",
        kind: "GPU",
        description: "48 GB 显存，给本地推理、图片生成和媒体工作流供能。",
        connection: "NVIDIA 驱动到 vLLM、ComfyUI 与 Immich 机器学习",
        deployment: "宿主机驱动 595.84，按需向 vLLM、ComfyUI、Immich ML 等容器开放 GPU。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "nvme",
        name: "5.4 TB NVMe",
        kind: "存储",
        description: "三块 2 TB 盘分别承载系统、应用数据与扩展存储。",
        connection: "容器卷与个人数据",
        deployment: "990 EVO Plus 承载系统，990 PRO 承载应用数据，Kingston 用作扩展存储。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "beszel",
        name: "Beszel / Netdata",
        kind: "主机指标",
        description: "从轻量概览进入完整指标，观察资源变化和异常趋势。",
        connection: "传感器到两级监控面板",
        deployment: "Beszel Agent 提供轻量概览，Netdata 通过 host 网络采集深度指标。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "hw-control",
        name: "硬件控制",
        kind: "温度与风扇",
        description: "统一查看 hwmon 读数、风扇策略和安全阈值。",
        connection: "传感器到人工接管",
        deployment: "用户级 systemd 守护 Python 控制台，绑定 Tailnet 8770。",
        entryLabel: "仅 Tailnet 内可用",
      },
    ],
  },
  {
    id: "data",
    label: "个人数据",
    shortLabel: "DATA",
    description: "照片、文档、文件和网页快照保留在自己能备份与迁移的存储中。",
    x: 81,
    y: 70,
    icon: <Database size={43} weight="thin" />,
    services: [
      {
        id: "immich",
        name: "Immich",
        kind: "照片与视频",
        description: "手机原图自动回到自己的时间线和本地存储。",
        connection: "手机到相册主库与机器学习服务",
        deployment: "Compose 由应用、PostgreSQL、Redis 与 CUDA 机器学习容器组成，照片落在本地库。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "paperless",
        name: "Paperless-ngx",
        kind: "文档归档",
        description: "扫描件和 PDF 经过 OCR 后成为可搜索档案。",
        connection: "文件到 OCR 与全文索引",
        deployment: "Compose 中应用连接 PostgreSQL 与 Redis，OCR 结果和原文件写入独立数据卷。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "minio",
        name: "MinIO",
        kind: "对象存储",
        description: "为项目截图、生成图片和应用文件提供统一对象接口。",
        connection: "应用到 S3 兼容存储",
        deployment: "MinIO 容器分别提供 S3 API 与管理控制台，对象写入独立数据卷。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "syncthing",
        name: "Syncthing",
        kind: "设备同步",
        description: "连接 Mac、手机与服务器目录，保留真实文件结构。",
        connection: "设备间点对点同步",
        deployment: "Compose 分离 Web 管理界面与同步端口，文件保存在独立数据卷。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "linkwarden",
        name: "Linkwarden",
        kind: "网页收藏",
        description: "保存链接和网页快照，避免重要资料随原站消失。",
        connection: "浏览器到网页快照与全文索引",
        deployment: "Compose 中应用连接 PostgreSQL 与 Meilisearch，网页快照保存在本地数据卷。",
        entryLabel: "仅 Tailnet 内可用",
      },
    ],
  },
  {
    id: "containers",
    label: "容器与日常工具",
    shortLabel: "CONTAINERS",
    description: "119 个运行容器、49 套 Compose，按入口、状态和备份收成一组。",
    x: 50,
    y: 87,
    icon: <Stack size={43} weight="thin" />,
    services: [
      {
        id: "homepage",
        name: "Homepage",
        kind: "统一入口",
        description: "把常用服务、健康状态和主机资源放在同一屏。",
        connection: "人到全部服务与 Docker 状态",
        deployment: "固定镜像的 Compose 服务读取配置与 Docker 状态，绑定 Tailnet 3001。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "vaultwarden",
        name: "Vaultwarden",
        kind: "密码管理",
        description: "电脑与手机共用自己的 Bitwarden 兼容密码库。",
        connection: "设备到加密凭据与备份",
        deployment: "Docker 容器只监听本机回环地址，通过 Cloudflare Tunnel 提供受保护入口。",
        entryLabel: "打开密码库",
        entryUrl: "https://vault.hermesjj.com",
      },
      {
        id: "memos",
        name: "Memos",
        kind: "轻量记录",
        description: "快速保存灵感、命令和生活片段，再决定是否长期归档。",
        connection: "浏览器到本地数据卷与备份",
        deployment: "Docker Compose 使用本地数据卷，服务只绑定 Tailnet 5230。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "stirling",
        name: "Stirling PDF",
        kind: "本地工具",
        description: "合并、拆分、压缩和转换文件时不上传第三方网站。",
        connection: "文档到本地处理",
        deployment: "Docker Compose 在本机处理 PDF，Web UI 只绑定 Tailnet 8082。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "docker",
        name: "Docker",
        kind: "运行底座",
        description: "应用、数据库与依赖隔离运行，并按统一方式检查和备份。",
        connection: "Compose 项目到容器、网络与数据卷",
        deployment: "Compose 项目统一归档，Portainer 通过 Docker Socket 查看容器和数据卷。",
        entryLabel: "仅 Tailnet 内可用",
      },
    ],
  },
];

function ServerTopology() {
  const [isPhone, setIsPhone] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsPhone(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (isPhone) return <MobileServerStory categories={topologyCategories} facts={serverFacts} />;
  return (
      <Suspense fallback={<div className="server-three-loading" aria-label="正在加载服务器结构图" />}>
        <ServerExplodedStory categories={topologyCategories} facts={serverFacts} visualOnly />
      </Suspense>
  );
}

export function SystemsPage() {
  return <ServerTopology />;
}
