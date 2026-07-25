import { ArrowLeft } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { ArrowsOutSimple } from "@phosphor-icons/react/ArrowsOutSimple";
import { Books } from "@phosphor-icons/react/Books";
import { BracketsCurly } from "@phosphor-icons/react/BracketsCurly";
import { Browser } from "@phosphor-icons/react/Browser";
import { ChatCircleDots } from "@phosphor-icons/react/ChatCircleDots";
import { CloudArrowUp } from "@phosphor-icons/react/CloudArrowUp";
import { Code } from "@phosphor-icons/react/Code";
import { Cpu } from "@phosphor-icons/react/Cpu";
import { Database } from "@phosphor-icons/react/Database";
import { DeviceMobile } from "@phosphor-icons/react/DeviceMobile";
import { FilePdf } from "@phosphor-icons/react/FilePdf";
import { FileText } from "@phosphor-icons/react/FileText";
import { GithubLogo } from "@phosphor-icons/react/GithubLogo";
import { GlobeHemisphereWest } from "@phosphor-icons/react/GlobeHemisphereWest";
import { HardDrives } from "@phosphor-icons/react/HardDrives";
import { ImagesSquare } from "@phosphor-icons/react/ImagesSquare";
import { LinkSimple } from "@phosphor-icons/react/LinkSimple";
import { LockKey } from "@phosphor-icons/react/LockKey";
import { Moon } from "@phosphor-icons/react/Moon";
import { MouseSimple } from "@phosphor-icons/react/MouseSimple";
import { Notepad } from "@phosphor-icons/react/Notepad";
import { OpenAiLogo } from "@phosphor-icons/react/OpenAiLogo";
import { Pulse } from "@phosphor-icons/react/Pulse";
import { Robot } from "@phosphor-icons/react/Robot";
import { ShareNetwork } from "@phosphor-icons/react/ShareNetwork";
import { SquaresFour } from "@phosphor-icons/react/SquaresFour";
import { Stack } from "@phosphor-icons/react/Stack";
import { Sun } from "@phosphor-icons/react/Sun";
import { X } from "@phosphor-icons/react/X";
import { animate, AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";
import { Link, Route, Router as BrowserRouter, Switch as Routes, useLocation as useWouterLocation, useParams } from "wouter";
import { BlurText } from "./components/effects/BlurText";
import { DecryptedText } from "./components/effects/DecryptedText";
import { GlobalFlowingLights } from "./components/effects/GlobalFlowingLights";
import { GlobalPixelTrail } from "./components/effects/GlobalPixelTrail";
import { InteractiveDotGrid } from "./components/effects/InteractiveDotGrid";
import { Magnetic } from "./components/effects/Magnetic";
import { PixelReveal, type PixelRevealHandle } from "./components/effects/PixelReveal";
import { SceneLineOrnaments } from "./components/effects/SceneLineOrnaments";
import { MobileServerStory } from "./components/MobileServerStory";

const ProjectHelix = lazy(() => import("./components/ProjectHelix").then((module) => ({ default: module.ProjectHelix })));
const ServerExplodedStory = lazy(() => import("./components/ServerExplodedStory").then((module) => ({ default: module.ServerExplodedStory })));

type Category = "product" | "ai" | "system";
type Filter = "all" | Category;
type ThemeMode = "light" | "dark";

function useLocation() {
  const [pathname] = useWouterLocation();
  return { pathname };
}

function NavLink({ to, end = false, children }: { to: string; end?: boolean; children: ReactNode }) {
  const { pathname } = useLocation();
  const active = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  return <Link to={to} aria-current={active ? "page" : undefined}>{children}</Link>;
}

type ProjectPreview = {
  image: string;
  alt: string;
  width: number;
  height: number;
  srcSet?: string;
  sizes?: string;
  fit?: "cover" | "contain";
  position?: string;
};

type ProjectStory = {
  problem: string;
  approach: string;
  outcome: string;
  highlights: Array<{
    title: string;
    description: string;
  }>;
};

type Project = {
  id: string;
  title: string;
  description: string;
  category: Category;
  kind: string;
  status: string;
  year: string;
  tags: string[];
  site?: string;
  repo?: string;
  detail?: string;
  icon: ReactNode;
  cardPreview: ProjectPreview;
  preview?: ProjectPreview;
  story: ProjectStory;
};

type GalleryShot = {
  id: string;
  label: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  width: number;
  height: number;
  srcSet?: string;
  sizes?: string;
  fit?: "cover" | "contain";
  position?: string;
};

type FlagshipCaseStudy = {
  projectId: "408-web" | "law-site";
  statement: string;
  overview: string;
  heroShot: GalleryShot;
  tourShots: GalleryShot[];
  facts: Array<{ label: string; value: string }>;
  flowTitle: string;
  flow: Array<{ title: string; description: string }>;
  decisionsTitle: string;
  decisionsIntro: string;
  decisions: Array<{ title: string; description: string; note: string }>;
  resultTitle: string;
  resultBody: string;
  results: Array<{ value: string; label: string; detail: string }>;
  resultNote?: string;
  nextProjectId: "408-web" | "law-site";
};

function projectCardPreview(id: string, title: string): ProjectPreview {
  return {
    image: `/assets/project-covers/${id}.webp`,
    alt: `${title} AI 生成概念海报`,
    width: 1200,
    height: 750,
  };
}

const projects: Project[] = [
  {
    id: "408-web",
    title: "408 刷题库",
    description: "把刷题、错题复盘、间隔复习、AI 讲题和 Markdown 知识库串成一条学习路径。",
    category: "product",
    kind: "学习产品",
    status: "开源 / 在线",
    year: "2026",
    tags: ["JavaScript", "Local-first", "AI"],
    story: {
      problem: "备考者往往在不同页面间做题、查解析、记错题，复习节奏也容易断开。",
      approach: "以本地优先网页应用连接四科题库、即时判分、间隔复习、AI 追问和 Markdown 笔记，并保留可选账号同步。",
      outcome: "形成可直接静态部署的 408 学习产品，题库、复习、统计与知识沉淀在同一工作流中运行。",
      highlights: [
        { title: "多模式答题", description: "顺序、随机、错题、收藏和今日复习共享同一套作答与反馈界面。" },
        { title: "间隔复习", description: "根据连续答题结果延长复习周期，把错题状态变成可执行的日程。" },
        { title: "AI 与知识库", description: "流式追问连接 Markdown 笔记，让一次讲题可以继续沉淀和检索。" },
      ],
    },
    site: "https://quiz.hermesjj.com/",
    repo: "https://github.com/lij768423-svg/408-",
    detail: "/projects/408",
    icon: <Books size={22} weight="duotone" />,
    cardPreview: projectCardPreview("408-web", "408 刷题库"),
    preview: {
      image: "/assets/408-quiz.webp",
      alt: "408 刷题库桌面答题真实界面",
      width: 3200,
      height: 2000,
      srcSet: "/assets/408-quiz-800.webp 800w, /assets/408-quiz-1600.webp 1600w, /assets/408-quiz.webp 3200w",
      sizes: "(max-width: 680px) calc(100vw - 76px), 408px",
      position: "left top",
    },
  },
  {
    id: "408-harmony",
    title: "408 for HarmonyOS",
    description: "面向 HarmonyOS NEXT 的原生刷题端，支持离线题库、手势答题、KaTeX 与可选 AI 讲题。",
    category: "product",
    kind: "原生应用",
    status: "开源",
    year: "2026",
    tags: ["ArkTS", "HarmonyOS NEXT", "Offline"],
    story: {
      problem: "移动端备考需要在断网时仍能刷题、看解析，并保持与桌面端相同的复习节奏。",
      approach: "用 ArkTS 与 ArkUI 重做交互，题库、公式渲染和进度保存全部本地化，AI 仅作为可选能力。",
      outcome: "得到可构建安装的 HarmonyOS NEXT 原生端，基础刷题不依赖账号或网络。",
      highlights: [
        { title: "连续手势切题", description: "Swiper 与 LazyForEach 让用户在题目任意区域自然滑动切换。" },
        { title: "本地富文本", description: "Markdown、表格与 KaTeX 公式均在设备侧完成解析和渲染。" },
        { title: "隐私与迁移", description: "进度支持导入导出，不配置 AI 也不会影响核心刷题流程。" },
      ],
    },
    repo: "https://github.com/lij768423-svg/408-for-harmony",
    detail: "/projects/harmonyos",
    icon: <DeviceMobile size={22} weight="duotone" />,
    cardPreview: projectCardPreview("408-harmony", "408 for HarmonyOS"),
    preview: {
      image: "/assets/408-harmony.webp",
      alt: "408 for HarmonyOS 沉浸式刷题真实界面",
      width: 1920,
      height: 1080,
      srcSet: "/assets/408-harmony-800.webp 800w, /assets/408-harmony-1600.webp 1600w, /assets/408-harmony.webp 1920w",
      sizes: "(max-width: 680px) calc(100vw - 76px), 408px",
      fit: "contain",
    },
  },
  {
    id: "ioschat",
    title: "Hermes for iOS",
    description: "从 ArkTS 迁移到 SwiftUI 的个人 AI 客户端，补齐 SSE、多会话、附件、Markdown 与公式。",
    category: "ai",
    kind: "AI 客户端",
    status: "开源 / 真机运行",
    year: "2026",
    tags: ["SwiftUI", "UIKit", "SSE"],
    story: {
      problem: "已有 ArkTS 客户端无法直接迁移到 iOS，中文输入、流式消息与公式渲染都需要原生重做。",
      approach: "以 SwiftUI 重建会话界面，用 UIKit 补齐输入法边界，URLSession 处理 SSE，Keychain 与本地存储管理状态。",
      outcome: "完成真机运行版本，消息、附件、引用、Markdown 与公式链路均通过定向测试。",
      highlights: [
        { title: "中文输入法", description: "读取真实 marked text，修复候选词确认时吞字和重复提交。" },
        { title: "流式会话", description: "URLSession.bytes 接收 SSE，并处理会话、消息与中断状态。" },
        { title: "富内容消息", description: "图片、附件、引用、Markdown 与 MathJax 进入统一消息模型。" },
      ],
    },
    repo: "https://github.com/lij768423-svg/ioschat",
    detail: "/projects/hermes-ios",
    icon: <ChatCircleDots size={22} weight="duotone" />,
    cardPreview: projectCardPreview("ioschat", "Hermes for iOS"),
    preview: {
      image: "/assets/ioschat-drawer.webp",
      alt: "Hermes iOS 会话抽屉真实界面",
      width: 1206,
      height: 2622,
      srcSet: "/assets/ioschat-drawer-603.webp 603w, /assets/ioschat-drawer.webp 1206w",
      sizes: "(max-width: 680px) 210px, 250px",
      fit: "contain",
    },
  },
  {
    id: "law-site",
    title: "根旺律所数字站",
    description: "机构官网、在线咨询、AI 摘要、人工接管与 CMS 后台组成的真实客户交付。",
    category: "product",
    kind: "客户项目",
    status: "在线 / 私有源码",
    year: "2026",
    tags: ["Next.js", "Payload CMS", "Playwright"],
    story: {
      problem: "律所公开内容分散，咨询入口、案例展示与后台维护缺少统一且可信的数字载体。",
      approach: "用 Next.js 与 Payload CMS 重建内容体系，将团队、服务、脱敏案例、咨询和隐私流程接入同一后台。",
      outcome: "正式站已上线，机构内容、咨询提交、后台维护和生产部署形成一套可持续交付。",
      highlights: [
        { title: "真实内容迁移", description: "团队资料、服务说明、脱敏案例和 PDF 被整理成可维护结构。" },
        { title: "咨询与隐私", description: "提交数据加密保存、定期清理，并为人工通知和接管留出接口。" },
        { title: "生产部署", description: "PostgreSQL、Valkey 与媒体卷经 Tailscale 和 Caddy 对外服务。" },
      ],
    },
    site: "https://lawweb.hermesjj.com/",
    detail: "/projects/law-site",
    icon: <Browser size={22} weight="duotone" />,
    cardPreview: projectCardPreview("law-site", "根旺律所数字站"),
    preview: {
      image: "/assets/law-home.webp",
      alt: "根旺律所数字站首页真实界面",
      width: 3200,
      height: 2000,
      srcSet: "/assets/law-home-800.webp 800w, /assets/law-home-1600.webp 1600w, /assets/law-home.webp 3200w",
      sizes: "(max-width: 680px) calc(100vw - 76px), 408px",
      position: "left top",
    },
  },
  {
    id: "mineradio",
    title: "Mineradio",
    description: "参与沉浸式音乐播放器的视觉与工程迭代，并完成 Web 迁移、访问保护与发布链路重建。",
    category: "product",
    kind: "协作项目",
    status: "公开仓库 / 受限演示",
    year: "2026",
    tags: ["React", "Three.js", "Electron"],
    story: {
      problem: "天气、电台、搜索播放、歌词和视觉效果分散在不同模式，沉浸感容易被操作流程打断。",
      approach: "在 Electron 与 Web 壳之间统一播放状态，接入天气与音乐搜索，并把歌词、粒子、节奏和 3D 歌单架组成同一舞台。",
      outcome: "协作迭代到可发布的桌面版本，并保留受限 Web 预览与公开仓库。",
      highlights: [
        { title: "天气情绪队列", description: "天气信息参与电台选择，让环境状态直接影响播放内容。" },
        { title: "多层视觉舞台", description: "歌词、粒子、节奏和电影镜头根据播放模式切换。" },
        { title: "桌面与 Web", description: "桌面安装包保留完整能力，Web 版本承担访问和展示入口。" },
      ],
    },
    site: "https://mineradio.hermesjj.com/",
    repo: "https://github.com/English-worse/Mineradio",
    detail: "/projects/mineradio",
    icon: <GlobeHemisphereWest size={22} weight="duotone" />,
    cardPreview: projectCardPreview("mineradio", "Mineradio"),
    preview: {
      image: "/assets/mineradio-app.webp",
      alt: "Mineradio 现代 Web 外壳真实界面",
      width: 3200,
      height: 2000,
      srcSet: "/assets/mineradio-app-800.webp 800w, /assets/mineradio-app-1600.webp 1600w, /assets/mineradio-app.webp 3200w",
      sizes: "(max-width: 680px) calc(100vw - 76px), 408px",
      position: "left top",
    },
  },
  {
    id: "agent-console",
    title: "Agent Console",
    description: "在浏览器里启动、观察和配置本机 coding agents，统一任务、日志、Git 与 Provider 状态。",
    category: "ai",
    kind: "开发者工具",
    status: "私有构建",
    year: "2026",
    tags: ["React", "Vite", "Codex CLI"],
    story: {
      problem: "本机多个 coding agents 的任务、日志、Provider 与 Git 配置散落在终端和配置文件中。",
      approach: "以 React 操作台连接本地 API，真实启动 Codex 进程，并把任务、日志和配置状态统一落盘。",
      outcome: "形成可排队、启动、停止和追踪结果的本地代理工作台，配置变更也进入可恢复流程。",
      highlights: [
        { title: "真实任务队列", description: "任务从排队到完成或失败都有明确状态，并可停止底层进程。" },
        { title: "Provider 与 MCP", description: "读取真实配置，切换前先备份，再同步到对应客户端。" },
        { title: "安全配置分支", description: "Git dirty 状态会阻止危险切换，并提供 dry-run 预检。" },
      ],
    },
    detail: "/projects/agent-console",
    icon: <BracketsCurly size={22} weight="duotone" />,
    cardPreview: projectCardPreview("agent-console", "Agent Console"),
    preview: {
      image: "/assets/agent-console-branches.webp",
      alt: "Agent Console 配置分支管理真实界面",
      width: 2024,
      height: 1206,
      srcSet: "/assets/agent-console-branches-800.webp 800w, /assets/agent-console-branches-1600.webp 1600w, /assets/agent-console-branches.webp 2024w",
      sizes: "(max-width: 680px) calc(100vw - 76px), 408px",
      position: "center top",
    },
  },
  {
    id: "codex-api",
    title: "Codex API",
    description: "把 Codex CLI 包装成 OpenAI 兼容接口，提供 SSE 生命周期事件与会话级安全控制。",
    category: "ai",
    kind: "AI 基础服务",
    status: "私有运行",
    year: "2026",
    tags: ["Python", "OpenAI API", "SSE"],
    story: {
      problem: "OpenAI 兼容客户端无法直接调用 Codex CLI，也缺少工作目录和高权限执行的明确边界。",
      approach: "用无依赖 Python HTTP 服务解析兼容请求，校验 cwd 与沙盒模式后执行 codex exec --json，并映射流式事件。",
      outcome: "形成仅在 Tailnet 内运行的受控网关，同时支持健康检查、模型列表、同步和流式会话。",
      highlights: [
        { title: "兼容客户端接入", description: "提供 chat completions、models 与 health 端点，降低客户端改造成本。" },
        { title: "执行安全边界", description: "工作目录必须位于白名单，高权限模式还需要显式环境开关。" },
        { title: "生命周期映射", description: "解析 Codex JSON 事件并回传正文、阶段状态与用量信息。" },
      ],
    },
    detail: "/projects/codex-api",
    icon: <Robot size={22} weight="duotone" />,
    cardPreview: projectCardPreview("codex-api", "Codex API"),
  },
  {
    id: "wiki-api",
    title: "Wiki Question API",
    description: "将刷题笔记可靠写入 WebDAV / Obsidian Markdown 知识库，支持幂等保存、更新与搜索。",
    category: "system",
    kind: "知识库服务",
    status: "私有运行",
    year: "2026",
    tags: ["FastAPI", "WebDAV", "Obsidian"],
    story: {
      problem: "刷题后的错题与解释需要可靠进入 Obsidian，而重复请求和多用户路径容易产生冲突。",
      approach: "用 FastAPI 接收结构化题目，生成 Markdown、更新索引和日志，再以本地文件为真源进行可选同步。",
      outcome: "得到可幂等保存、按用户隔离并可追踪更新记录的知识库写入服务。",
      highlights: [
        { title: "幂等写入", description: "Idempotency-Key 与 SQLite 记录避免同一次保存产生重复笔记。" },
        { title: "路径与用户隔离", description: "学科别名、slug 和用户 vault 都经过约束后再落盘。" },
        { title: "本地真源", description: "Markdown、索引和日志先在本地完成，再按需要回写 WebDAV。" },
      ],
    },
    detail: "/projects/wiki-api",
    icon: <Database size={22} weight="duotone" />,
    cardPreview: projectCardPreview("wiki-api", "Wiki Question API"),
    preview: {
      image: "/assets/wiki-api-docs.webp",
      alt: "Wiki Question API Swagger 文档真实界面",
      width: 3200,
      height: 2000,
      srcSet: "/assets/wiki-api-docs-800.webp 800w, /assets/wiki-api-docs-1600.webp 1600w, /assets/wiki-api-docs.webp 3200w",
      sizes: "(max-width: 680px) calc(100vw - 76px), 408px",
      position: "left top",
    },
  },
  {
    id: "writing-studio",
    title: "Writing Studio",
    description: "把调研、选题确认、大纲、审校、配图和归档组织成有门禁的内容生产线。",
    category: "ai",
    kind: "内容工作流",
    status: "开源",
    year: "2026",
    tags: ["JavaScript", "Markdown", "AI Workflow"],
    story: {
      problem: "多平台长文每次都从零组织调研、审校和配图，过程难以复用，也容易留下明显 AI 痕迹。",
      approach: "把选题、调研、写作、三遍审校、配图和归档做成带门禁的状态化工作区。",
      outcome: "形成 fast、standard 与 strict 三种执行路径，可重复产出 Markdown 和明暗双版 PDF。",
      highlights: [
        { title: "状态门禁", description: "初始化、校验和归档脚本让每一步都有输入、输出与完成条件。" },
        { title: "资料核查", description: "Tavily 与 last30days 负责补充来源和近期讨论，再进入正文。" },
        { title: "三遍审校", description: "内容、风格和细节分开检查，最后由 pandoc 与浏览器生成成品。" },
      ],
    },
    repo: "https://github.com/lij768423-svg/writing-studio",
    detail: "/projects/writing-studio",
    icon: <Code size={22} weight="duotone" />,
    cardPreview: projectCardPreview("writing-studio", "Writing Studio"),
    preview: {
      image: "/assets/writing-studio-github.webp",
      alt: "Writing Studio 公开仓库与工作流文件真实界面",
      width: 3200,
      height: 2000,
      srcSet: "/assets/writing-studio-github-800.webp 800w, /assets/writing-studio-github-1600.webp 1600w, /assets/writing-studio-github.webp 3200w",
      sizes: "(max-width: 680px) calc(100vw - 76px), 408px",
      position: "left top",
    },
  },
  {
    id: "hardware-control",
    title: "Hardware Control",
    description: "将本机风扇与 Linux hwmon 传感器做成带安全确认的轻量 Web 控制台。",
    category: "system",
    kind: "硬件工具",
    status: "局域网运行",
    year: "2026",
    tags: ["Python", "hwmon", "systemd"],
    story: {
      problem: "服务器风扇控制和温度传感器分散在命令行，误操作还可能让低速策略越过安全边界。",
      approach: "用 Python 标准库提供窄接口，读取 Linux hwmon，并只允许调用预定义的风扇通道与模式。",
      outcome: "网页可以查看传感器、切换自动或固定转速，并由守护逻辑恢复长期运行策略。",
      highlights: [
        { title: "受限硬件 API", description: "接口只接受四个风扇通道和明确模式，不开放任意 shell。" },
        { title: "低速二次确认", description: "低于安全阈值的占空比必须再次确认后才会写入。" },
        { title: "策略恢复", description: "quiet guard 负责应用夜间策略并同步四通道的当前状态。" },
      ],
    },
    icon: <Cpu size={22} weight="duotone" />,
    detail: "/projects/hardware-control",
    cardPreview: projectCardPreview("hardware-control", "Hardware Control"),
    preview: {
      image: "/assets/hardware-control.webp",
      alt: "Home Serve 硬件控制台真实界面",
      width: 3200,
      height: 2000,
      srcSet: "/assets/hardware-control-800.webp 800w, /assets/hardware-control-1600.webp 1600w, /assets/hardware-control.webp 3200w",
      sizes: "(max-width: 680px) calc(100vw - 76px), 408px",
      position: "left top",
    },
  },
  {
    id: "tailscale-latency",
    title: "Tailscale 延迟测试",
    description: "把 Tailnet 节点间延迟、直连或 DERP 路径与探针状态汇总成可切换的网络拓扑。",
    category: "system",
    kind: "网络诊断工具",
    status: "Tailnet 内运行",
    year: "2026",
    tags: ["Python", "Tailscale", "Three.js"],
    story: {
      problem: "Tailnet 节点是否直连、经过哪个 DERP，以及延迟是否稳定，原始命令输出不适合持续比较。",
      approach: "Python 服务解析 tailscale status 与 ping JSON，并发采集多次样本后映射到可视化拓扑。",
      outcome: "形成内网可访问的只读诊断页，可以快速比较节点延迟、路径类型和探针状态。",
      highlights: [
        { title: "路径识别", description: "根据 ping 返回明确区分点对点直连与 DERP 中继。" },
        { title: "并发采样", description: "限制并发与超时，同时计算多次探测的平均、最低和最高值。" },
        { title: "容器收口", description: "只读挂载 Tailscale socket，并移除额外 Linux capabilities。" },
      ],
    },
    detail: "/projects/tailscale-latency",
    icon: <ShareNetwork size={22} weight="duotone" />,
    cardPreview: projectCardPreview("tailscale-latency", "Tailscale 延迟测试"),
    preview: {
      image: "/assets/tailscale-latency.webp",
      alt: "Tailscale 延迟测试多节点网络拓扑真实界面",
      width: 3200,
      height: 2000,
      srcSet: "/assets/tailscale-latency-800.webp 800w, /assets/tailscale-latency-1600.webp 1600w, /assets/tailscale-latency.webp 3200w",
      sizes: "(max-width: 680px) calc(100vw - 76px), 408px",
      position: "left top",
    },
  },
  {
    id: "home-lab",
    title: "Home Lab 基础设施",
    description: "围绕 Docker、Tailscale、Cloudflare、对象存储、监控与备份维护个人服务底座。",
    category: "system",
    kind: "自托管系统",
    status: "长期运行",
    year: "持续",
    tags: ["Docker", "Tailscale", "MinIO"],
    story: {
      problem: "持续增加的自建服务如果缺少统一入口、监控和备份，很快会变成难以判断状态的容器集合。",
      approach: "以 Docker 统一运行方式，Tailscale 管理私网连接，再用 Homepage、监控和备份工具组织日常维护。",
      outcome: "形成长期运行的个人服务底座，公开服务、内网工具、存储和恢复流程拥有清晰边界。",
      highlights: [
        { title: "统一服务入口", description: "Homepage 汇总应用、日志、存储、可用性和硬件观察入口。" },
        { title: "网络边界", description: "Tailscale 负责私网互联，公开域名再经过独立反向代理路径。" },
        { title: "观察与恢复", description: "Uptime Kuma、Beszel、Netdata 与备份任务覆盖日常状态和故障恢复。" },
      ],
    },
    detail: "/projects/home-lab",
    icon: <HardDrives size={22} weight="duotone" />,
    cardPreview: projectCardPreview("home-lab", "Home Lab 基础设施"),
  },
];

const reviewFlowShot: GalleryShot = {
  id: "review-flow",
  label: "刷题复盘闭环",
  title: "从作答到复习与知识沉淀",
  description: "用一张流程图说明选题、作答、判分、错题回炉、AI 讲题与本地保存如何连续发生。",
  image: "/assets/408-review-flow.webp",
  alt: "408 刷题库从选题、作答到错题复盘与 AI 讲题的完整流程图",
  width: 1400,
  height: 788,
  fit: "contain",
  position: "center",
};

const galleryShots: GalleryShot[] = [
  {
    id: "dashboard",
    label: "学习仪表盘",
    title: "先知道今天该复习什么",
    description: "把 14 天学习节奏、待复习章节和四科掌握度放在同一张仪表盘上。",
    image: "/assets/408-dashboard.webp",
    alt: "408 刷题库学习仪表盘真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/408-dashboard-800.webp 800w, /assets/408-dashboard-1600.webp 1600w, /assets/408-dashboard.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) calc(100vw - 72px), 60vw",
    position: "center top",
  },
  {
    id: "quiz",
    label: "真实答题",
    title: "题库、导航与学习记录共处一屏",
    description: "顺序、随机、今日复习、错题与收藏都从同一套题库导航进入。",
    image: "/assets/408-quiz.webp",
    alt: "408 刷题库桌面答题真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/408-quiz-800.webp 800w, /assets/408-quiz-1600.webp 1600w, /assets/408-quiz.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) calc(100vw - 72px), 60vw",
  },
  {
    id: "feedback",
    label: "错题反馈",
    title: "答错后立刻进入复盘路径",
    description: "答案、题库解析与 AI 分析入口在提交后同时出现，错题自动进入复习计划。",
    image: "/assets/408-feedback.webp",
    alt: "408 刷题库错题反馈真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/408-feedback-800.webp 800w, /assets/408-feedback-1600.webp 1600w, /assets/408-feedback.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) calc(100vw - 72px), 60vw",
  },
  {
    id: "ai",
    label: "AI 讲题",
    title: "让解释落在具体题目上下文里",
    description: "AI 面板保留题号、章节和作答上下文，回答可以继续追问或保存进知识库。",
    image: "/assets/408-ai.webp",
    alt: "408 刷题库 AI 讲题真实界面",
    width: 1440,
    height: 1000,
    srcSet: "/assets/408-ai-800.webp 800w, /assets/408-ai.webp 1440w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) calc(100vw - 72px), 60vw",
    fit: "contain",
    position: "center top",
  },
  {
    id: "search",
    label: "全库搜索",
    title: "从 2378 道题里直接定位知识点",
    description: "题干、选项和解析都可检索，并按真题、模拟题、课后题与年份继续筛选。",
    image: "/assets/408-search.webp",
    alt: "408 刷题库全库搜索真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/408-search-800.webp 800w, /assets/408-search-1600.webp 1600w, /assets/408-search.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) calc(100vw - 72px), 60vw",
  },
  {
    id: "wiki",
    label: "个人知识库",
    title: "把一次解释沉淀成可继续编辑的笔记",
    description: "题目与概念笔记写入 Markdown 知识库，可搜索、按科目浏览，也能继续向 AI 追问。",
    image: "/assets/408-wiki.webp",
    alt: "408 刷题库个人知识库真实界面",
    width: 1440,
    height: 1000,
    srcSet: "/assets/408-wiki-800.webp 800w, /assets/408-wiki.webp 1440w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) calc(100vw - 72px), 60vw",
    fit: "contain",
    position: "center top",
  },
];

const lawGalleryShots: GalleryShot[] = [
  {
    id: "home",
    label: "机构门户",
    title: "让团队、内容与咨询从同一入口开始",
    description: "首页集中呈现团队、公告、专业内容、案例与咨询入口，先建立机构可信度。",
    image: "/assets/law-home.webp",
    alt: "根旺律所数字站首页真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/law-home-800.webp 800w, /assets/law-home-1600.webp 1600w, /assets/law-home.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) 54vw, 44vw",
    position: "left top",
  },
  {
    id: "services",
    label: "业务领域",
    title: "把服务范围组织成可检索的判断入口",
    description: "13 项法律服务按刑事、民事与综合事务分组，并说明适用情形与沟通重点。",
    image: "/assets/law-services.webp",
    alt: "根旺律所业务领域与服务检索真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/law-services-800.webp 800w, /assets/law-services-1600.webp 1600w, /assets/law-services.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) 54vw, 44vw",
    position: "left top",
  },
  {
    id: "cases",
    label: "脱敏案例",
    title: "用真实工作记录解释专业能力",
    description: "案例按争议专题组织，保留审查重点与工作方法，同时隐藏当事人敏感信息。",
    image: "/assets/law-cases.webp",
    alt: "根旺律所脱敏案例与工作记录真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/law-cases-800.webp 800w, /assets/law-cases-1600.webp 1600w, /assets/law-cases.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) 54vw, 44vw",
    position: "left top",
  },
  {
    id: "insights",
    label: "文章资料库",
    title: "让长期内容可以搜索、分类和继续阅读",
    description: "案例分享、专业文章、法律问答和律所动态统一进入内容资料库。",
    image: "/assets/law-insights.webp",
    alt: "根旺律所专业文章资料库真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/law-insights-800.webp 800w, /assets/law-insights-1600.webp 1600w, /assets/law-insights.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) 54vw, 44vw",
    position: "left top",
  },
  {
    id: "article",
    label: "文章阅读",
    title: "长文、目录与脱敏证据在一屏内协同",
    description: "阅读器提供正文目录、同栏文章和前后篇导航，并展示经过脱敏的案件材料。",
    image: "/assets/law-article.webp",
    alt: "根旺律所专业文章阅读器真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/law-article-800.webp 800w, /assets/law-article-1600.webp 1600w, /assets/law-article.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) 54vw, 44vw",
    position: "left top",
  },
  {
    id: "consultation",
    label: "在线咨询",
    title: "先澄清问题，再进入人工服务",
    description: "智能助手收集阶段、措施与诉求，持续提醒隐私边界，并保留转人工入口。",
    image: "/assets/law-consultation.webp",
    alt: "根旺律所访客在线咨询真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/law-consultation-800.webp 800w, /assets/law-consultation-1600.webp 1600w, /assets/law-consultation.webp 3200w",
    sizes: "(max-width: 680px) calc(100vw - 32px), (max-width: 980px) 54vw, 44vw",
    position: "left top",
  },
];

const flagshipCaseStudies: Record<FlagshipCaseStudy["projectId"], FlagshipCaseStudy> = {
  "408-web": {
    projectId: "408-web",
    statement: "题库不是终点。答错以后，产品能不能把人带回正确的复习节奏，才决定一次刷题有没有价值。",
    overview: "我把自己备考时最容易断开的几个动作重新接在一起：先判断薄弱章节，再完成作答和即时反馈，随后由复习计划安排下一次出现，最后把真正没想明白的内容交给 AI 和个人知识库继续处理。",
    heroShot: reviewFlowShot,
    tourShots: galleryShots.slice(1),
    facts: [
      { label: "题库规模", value: "2,378 题" },
      { label: "科目覆盖", value: "408 四科" },
      { label: "核心策略", value: "本地优先" },
      { label: "运行形态", value: "静态 / 完整后端" },
    ],
    flowTitle: "一次作答，怎样变成下一次有效复习",
    flow: [
      { title: "建立样本", description: "从 20 题随机诊断或任意章节开始，先获得真实作答记录。" },
      { title: "完成作答", description: "顺序、随机、错题、收藏与今日复习共享同一套答题界面。" },
      { title: "看见错因", description: "正确答案、个人选择、题库解析与 AI 分析入口同时出现。" },
      { title: "安排重现", description: "错题进入计划，答对后按 1、3、7、14、30、60 天延长间隔。" },
      { title: "留下知识", description: "需要长期保留的题目或概念被写入可搜索的 Markdown 知识库。" },
    ],
    decisionsTitle: "先保证学习闭环，再决定是否连接服务器",
    decisionsIntro: "基础刷题不应该被账号、网络或 AI 可用性绑住。完整后端带来同步和流式讲题，但核心学习路径在纯静态部署下仍然成立。",
    decisions: [
      {
        title: "本地模式先跑通核心价值",
        description: "题库、搜索、错题、收藏、仪表盘和复习计划全部可以留在当前浏览器，打开静态站就能开始。",
        note: "没有后端时自动进入 LOCAL 模式",
      },
      {
        title: "把错题做成调度状态",
        description: "系统记录连续正确次数和下一次到期时间。连续答对后离开普通错题列表，但长期复习计划仍然保留。",
        note: "复习间隔由真实作答结果推进",
      },
      {
        title: "AI 是可选层，不是前置条件",
        description: "本地模式可复制完整题目上下文到外部 AI；完整后端才启用同源 SSE、错因分析和知识库保存。",
        note: "不配置 AI 也不影响刷题和解析",
      },
      {
        title: "学习记录始终可以带走",
        description: "本地记录支持 JSON 导入导出。登录后的完整模式再增加跨设备同步，同时保留浏览器缓存作为恢复路径。",
        note: "数据迁移能力属于基础功能",
      },
    ],
    resultTitle: "最终交付的不是一张题库页面，而是一套能持续运行的学习流程。",
    resultBody: "项目目前可以直接静态部署，也为认证、进度同步、AI 与知识库提供了完整接口契约。测试覆盖刷题、复习、搜索、数据迁移与完整后端的关键路径。",
    results: [
      { value: "6 级", label: "间隔复习", detail: "从 1 天逐步延长到 60 天" },
      { value: "20 题", label: "首次诊断", detail: "先建立一组可用学习样本" },
      { value: "2 种", label: "运行模式", detail: "静态本地模式与完整后端模式" },
      { value: "开源", label: "交付状态", detail: "源码、部署说明与接口契约公开" },
    ],
    nextProjectId: "law-site",
  },
  "law-site": {
    projectId: "law-site",
    statement: "律所网站不只是机构简介。公开内容、初步咨询、隐私边界和后台维护必须在同一套规则下运转。",
    overview: "这个项目从真实资料整理开始，最终形成公开官网、Payload CMS、咨询流程和原生微信小程序。页面负责建立信任与解释服务，后台负责来源、审核和发布，咨询链路只收集初步判断真正需要的信息。",
    heroShot: lawGalleryShots[0],
    tourShots: lawGalleryShots.slice(1),
    facts: [
      { label: "交付形态", value: "官网 + CMS" },
      { label: "公开路由", value: "14 条" },
      { label: "生产状态", value: "在线运行" },
      { label: "扩展终端", value: "原生小程序" },
    ],
    flowTitle: "访客看到的是网站，背后运行的是一套内容与咨询秩序",
    flow: [
      { title: "建立信任", description: "机构资料、律师团队和公开信息先回答访客最基本的真实性问题。" },
      { title: "找到方向", description: "业务领域按服务阶段组织，让访客先判断自己的问题应该从哪里开始。" },
      { title: "理解方法", description: "脱敏案例与专业文章解释工作重点，不承诺结果，也不暴露当事人信息。" },
      { title: "初步咨询", description: "助手只收集阶段、措施与诉求，持续提醒隐私边界并保留转人工入口。" },
      { title: "后台维护", description: "结构化内容、来源、授权和发布状态进入同一套 CMS 工作流。" },
    ],
    decisionsTitle: "可信度来自内容治理，不来自更响亮的宣传语",
    decisionsIntro: "这是一个受监管行业的真实交付。设计、内容模型、访问权限和部署方式都围绕同一件事展开：哪些内容可以公开，哪些数据只能被授权人员看见。",
    decisions: [
      {
        title: "公开事实必须能回到来源",
        description: "律师履历、荣誉、案例陈述与数字都关联结构化来源。脱敏、发布授权和当前修订版本共同决定内容能否上线。",
        note: "CMS 把来源与审批变成内容字段",
      },
      {
        title: "咨询只收集初步判断所需信息",
        description: "公开入口不收身份证号、完整姓名、案号、证据原件或精确羁押地点，咨询记录按权限保存并进入定期清理。",
        note: "隐私边界直接写进产品流程",
      },
      {
        title: "公开站与管理面保持明确边界",
        description: "后台入口不在前台展示，公开 GraphQL 保持关闭，咨询记录通过 Payload 权限与手机号二次显示机制保护。",
        note: "可发现性和可访问性被分别设计",
      },
      {
        title: "一套内容继续服务原生小程序",
        description: "五个底部入口、业务与律师详情、文章案例、律所介绍和咨询对话均使用原生页面，并接入官网专用接口。",
        note: "随包内容与离线分流提供兜底",
      },
    ],
    resultTitle: "网站已经上线，但可持续交付才是这个项目真正完成的部分。",
    resultBody: "公开内容、在线咨询、CMS 维护、生产部署和原生小程序拥有清晰边界。上线验收覆盖公开路由、核心流程、性能与内容发布规则。",
    results: [
      { value: "14 条", label: "公开路由", detail: "2026-07-16 验收均返回 HTTP 200" },
      { value: "1.34 s", label: "首页 LCP", detail: "同次公网抽样结果" },
      { value: "91 项", label: "Playwright", detail: "交付记录中的通过数量" },
      { value: "3 端", label: "内容交付", detail: "公开站、CMS 与原生小程序" },
    ],
    resultNote: "验收数字来自 2026-07-16 的项目交接记录，后续部署会继续重新验证。",
    nextProjectId: "408-web",
  },
};

const labCases = [
  {
    id: "hardware",
    label: "主机状态",
    status: "局域网运行",
    title: "让温度、风扇和安全阈值在一屏里可检查。",
    description: "四路风扇控制、Linux hwmon 读数与运行摘要来自真实主机，界面始终保留自动策略和人工接管。",
    note: "低于安全阈值的固定转速操作需要二次确认，截图过程只读取状态。",
    image: "/assets/hardware-control.webp",
    alt: "Home Serve 硬件控制台真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/hardware-control-800.webp 800w, /assets/hardware-control-1600.webp 1600w, /assets/hardware-control.webp 3200w",
  },
  {
    id: "tailscale",
    label: "远程网络",
    status: "Tailnet 内运行",
    title: "把多节点延迟和真实连接路径变成可交互拓扑。",
    description: "并行测量 Tailnet 节点间延迟，区分直连、DERP 与无响应状态，并可切换任意在线探针比较出站链路。",
    note: "截图来自真实探测结果，采集时只隐藏 Tailnet IP、公网端点与设备标识。",
    image: "/assets/tailscale-latency.webp",
    alt: "Tailscale 延迟测试多节点网络拓扑真实界面",
    width: 3200,
    height: 2000,
    srcSet: "/assets/tailscale-latency-800.webp 800w, /assets/tailscale-latency-1600.webp 1600w, /assets/tailscale-latency.webp 3200w",
  },
  {
    id: "agent-console",
    label: "AI 工作台",
    status: "服务器内运行",
    title: "把代理任务、项目分支和执行记录放进同一张工作台。",
    description: "Agent Console 通过浏览器连接服务器上的项目与代理任务，集中查看队列、分支状态和执行结果。",
    note: "公开截图只保留界面结构，真实目录、令牌和内部地址不会进入前端资源。",
    image: "/assets/agent-console-branches.webp",
    alt: "服务器 Agent Console 项目分支工作台真实界面",
    width: 2024,
    height: 1206,
    srcSet: "/assets/agent-console-branches-800.webp 800w, /assets/agent-console-branches-1600.webp 1600w, /assets/agent-console-branches.webp 2024w",
  },
] as const;

const serverFacts = [
  { label: "主机", value: "home-serve" },
  { label: "运行容器", value: "70" },
  { label: "内存", value: "59 GiB" },
  { label: "NVMe 存储", value: "3.6 TB" },
] as const;

const serverRoles = [
  {
    icon: <Code size={25} weight="duotone" />,
    title: "开发与发布",
    stack: "Remote SSH / Docker / systemd",
    description: "代码直接在 Linux 主机上开发和验证。项目通过容器或用户服务运行，预览、日志和正式版本留在同一套环境里。",
  },
  {
    icon: <Robot size={25} weight="duotone" />,
    title: "AI 与自动化",
    stack: "Sub2API / Codex API / ComfyUI",
    description: "模型网关、兼容接口、图片生成与代理任务集中运行，手机、浏览器和项目服务共用同一组能力。",
  },
  {
    icon: <Database size={25} weight="duotone" />,
    title: "个人数据",
    stack: "Immich / Paperless / MinIO",
    description: "照片、文档、网页收藏与项目截图保存在自己的存储中，应用只按需要读取对应的数据和对象。",
  },
  {
    icon: <HardDrives size={25} weight="duotone" />,
    title: "持续运维",
    stack: "Uptime Kuma / Beszel / Backup",
    description: "监控、容器管理、主机指标、定时备份和每日维护记录共同工作，让服务出问题时能定位，也能恢复。",
  },
] as const;

const serverRoute = [
  { label: "私有接入", title: "Tailscale", description: "远程开发、后台和管理端只在 Tailnet 内访问。" },
  { label: "公开入口", title: "Cloudflare Tunnel", description: "只有需要公开的产品域名才进入公网。" },
  { label: "服务路由", title: "Caddy 与代理层", description: "按域名和接口路径把请求送到正确服务。" },
  { label: "应用与数据", title: "Docker 与本地 NVMe", description: "应用、数据库和对象存储在主机内协同运行。" },
  { label: "运行保障", title: "监控与备份", description: "状态检查、维护日志和备份负责最后一道恢复。" },
] as const;

const maintenanceSteps = [
  {
    meta: "05:00 北京时间",
    title: "定时唤醒",
    description: "Cron 在每天 21:00 UTC 触发，对应北京时间次日 05:00。",
  },
  {
    meta: "只读采集",
    title: "巡检整台主机",
    description: "读取磁盘、内存、systemd、Docker、备份、Git 变更和近期系统日志。",
  },
  {
    meta: "Markdown 留档",
    title: "保留原始证据",
    description: "每天生成一份独立日志，判断错误时仍能回到命令输出复核。",
  },
  {
    meta: "自动提炼",
    title: "整理结论与动作",
    description: "把长日志压缩成当前结论、需要关注和建议动作，但不自动修改系统。",
  },
] as const;

const favoriteContainers = [
  {
    id: "immich",
    name: "Immich",
    kind: "照片与视频",
    summary: "把手机照片自动带回自己的存储。",
    description: "它是我的私人相册主库，负责手机备份、时间线浏览和视频管理，并继续向图片整理与回忆视频工具提供素材。",
    reason: "原图和人脸数据不离开自己的存储，容量也不受商业相册套餐限制。",
    scope: "局域网与手机客户端",
    connects: "Immich 图片管家 / 回忆视频 / 本地 NVMe",
    icon: <ImagesSquare size={28} weight="duotone" />,
  },
  {
    id: "vaultwarden",
    name: "Vaultwarden",
    kind: "密码管理",
    summary: "Bitwarden 兼容的个人密码库。",
    description: "电脑与手机共用同一套凭据、密钥和安全笔记，保留熟悉的客户端体验，同时把数据库留在自己的主机。",
    reason: "凭据是最不适合交给临时服务的数据，自己维护也能完整控制备份。",
    scope: "受保护的公开入口",
    connects: "Cloudflare Tunnel / 定时备份",
    icon: <LockKey size={28} weight="duotone" />,
  },
  {
    id: "syncthing",
    name: "Syncthing",
    kind: "文件同步",
    summary: "连接 Mac、手机与服务器目录。",
    description: "开发素材、下载目录和生活文件按设备需要自动同步，不依赖某一家网盘客户端，也不需要手动搬运。",
    reason: "点对点同步能保留真实目录结构，局域网传输也更快。",
    scope: "Tailnet 与局域网",
    connects: "Mac / 手机 / File Browser",
    icon: <ShareNetwork size={28} weight="duotone" />,
  },
  {
    id: "homepage",
    name: "Homepage",
    kind: "服务入口",
    summary: "所有自托管服务的首页。",
    description: "把日常应用、内容工具、监控入口和网络工具分组，同时读取 Docker 健康状态、CPU、内存和三块存储。",
    reason: "服务越来越多以后，入口、状态和搜索必须在同一屏完成。",
    scope: "局域网入口",
    connects: "Docker Socket / 29 个服务入口",
    icon: <SquaresFour size={28} weight="duotone" />,
  },
  {
    id: "uptime-kuma",
    name: "Uptime Kuma",
    kind: "可用性监控",
    summary: "先发现打不开，再去看原因。",
    description: "它持续检查关键网页与接口是否能访问，是面向服务结果的第一层监控，而不是只看容器有没有运行。",
    reason: "容器显示 Up 不代表产品真的可用，端到端检查更接近用户看到的结果。",
    scope: "服务器内部探测",
    connects: "公开项目 / 内部工具 / 通知链路",
    icon: <Pulse size={28} weight="duotone" />,
  },
  {
    id: "beszel",
    name: "Beszel",
    kind: "主机监控",
    summary: "轻量查看资源变化和运行趋势。",
    description: "CPU、内存、磁盘、网络和容器资源被整理成适合快速判断的面板，需要深挖时再进入 Netdata。",
    reason: "日常检查需要低负担的概览，不必每次面对完整监控系统。",
    scope: "Tailnet 内访问",
    connects: "Beszel Agent / Netdata / 每日巡检",
    icon: <Cpu size={28} weight="duotone" />,
  },
  {
    id: "memos",
    name: "Memos",
    kind: "轻量记录",
    summary: "比正式笔记更快的私人记录墙。",
    description: "灵感、临时命令、生活片段和待处理事项可以立刻记下，之后再决定是否进入长期知识库。",
    reason: "低摩擦记录比复杂分类更适合捕捉零散想法。",
    scope: "私有访问",
    connects: "浏览器 / 手机 / 备份目录",
    icon: <Notepad size={28} weight="duotone" />,
  },
  {
    id: "paperless",
    name: "Paperless-ngx",
    kind: "文档归档",
    summary: "把纸质与电子文件变成可搜索档案。",
    description: "扫描件和 PDF 经过 OCR、标签与全文索引后统一归档，找材料时不再依赖文件名和目录记忆。",
    reason: "长期文档更需要可迁移的原文件、元数据和本地全文索引。",
    scope: "Tailnet 内访问",
    connects: "OCR / PostgreSQL / 本地归档盘",
    icon: <FileText size={28} weight="duotone" />,
  },
  {
    id: "linkwarden",
    name: "Linkwarden",
    kind: "网页收藏",
    summary: "收藏链接，也保存当时的网页。",
    description: "稍后读、项目资料和技术文章不只保留 URL，还生成网页快照，避免原站改版或内容消失。",
    reason: "收藏的价值在内容本身，不应该只剩下一串可能失效的地址。",
    scope: "私有访问",
    connects: "Meilisearch / PostgreSQL / 网页快照",
    icon: <LinkSimple size={28} weight="duotone" />,
  },
  {
    id: "stirling-pdf",
    name: "Stirling PDF",
    kind: "PDF 工具箱",
    summary: "合并、拆分、压缩和转换都在本地完成。",
    description: "临时处理报名材料、扫描件和项目文档时，浏览器就能完成常见 PDF 操作，不需要把文件上传给陌生网站。",
    reason: "它解决的是高频小需求，同时避免敏感文件经过第三方转换服务。",
    scope: "局域网访问",
    connects: "Paperless-ngx / File Browser",
    icon: <FilePdf size={28} weight="duotone" />,
  },
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
        deployment: "宿主机运行 tailscaled，后台和管理端统一绑定 Tailnet 地址。",
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
        id: "codex-api",
        name: "Codex API",
        kind: "代理接口",
        description: "把 Codex 执行能力封装为可流式调用的兼容接口。",
        connection: "iOS 与网页客户端",
        deployment: "Python 服务由用户级 systemd 守护，只向本机应用开放 API。",
        entryLabel: "仅本机应用可用",
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
        id: "daily-ai",
        name: "每日 AI 巡检",
        kind: "维护摘要",
        description: "先保存只读巡检证据，再由模型整理风险和建议动作。",
        connection: "系统日志到维护记录",
        deployment: "定时任务先写 Markdown 巡检证据，再生成风险摘要，不自动修改系统。",
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
        description: "承担容器、编译、转码和并行代理任务。",
        connection: "主机计算核心到全部工作负载",
        deployment: "宿主机计算核心直接承载容器、编译、转码与本地代理进程。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "gpu",
        name: "RTX 5060 Ti",
        kind: "GPU",
        description: "为本地图片生成、视频处理和推理工作流提供算力。",
        connection: "NVIDIA 驱动到生成与媒体工作流",
        deployment: "NVIDIA 驱动在宿主机运行，按需向 ComfyUI 等容器开放 GPU。",
        entryLabel: "仅 Tailnet 内可用",
      },
      {
        id: "nvme",
        name: "3.6 TB NVMe",
        kind: "存储",
        description: "项目、数据库、照片和对象文件保存在本地高速存储。",
        connection: "容器卷与个人数据",
        deployment: "系统盘与独立数据盘分别承载运行环境、Compose 配置和业务数据。",
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
    description: "七十个运行容器被组织成清楚的入口、状态和备份关系。",
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

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "product", label: "产品" },
  { id: "ai", label: "AI 工具" },
  { id: "system", label: "服务器" },
];

const categoryLabels: Record<Category, string> = {
  product: "产品与客户端",
  ai: "AI 工具与工作流",
  system: "服务与基础设施",
};

function trackPointerGlow(event: ReactPointerEvent<HTMLElement>) {
  if (event.pointerType === "touch") return;
  const bounds = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
  event.currentTarget.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
}

function resetPointerGlow(event: ReactPointerEvent<HTMLElement>) {
  event.currentTarget.style.removeProperty("--spotlight-x");
  event.currentTarget.style.removeProperty("--spotlight-y");
}

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 1, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function ExternalLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function ProjectLinks({ project, includeDetail = true }: { project: Project; includeDetail?: boolean }) {
  return (
    <div className="row-links">
      {includeDetail && project.detail ? (
        <Link to={project.detail} className="icon-link">
          <ArrowRight size={18} weight="bold" />
          <span className="sr-only">阅读 {project.title} 案例</span>
        </Link>
      ) : null}
      {project.site ? (
        <ExternalLink href={project.site} className="icon-link">
          <GlobeHemisphereWest size={18} weight="bold" />
          <span className="sr-only">打开 {project.title}</span>
        </ExternalLink>
      ) : null}
      {project.repo ? (
        <ExternalLink href={project.repo} className="icon-link">
          <GithubLogo size={18} weight="fill" />
          <span className="sr-only">查看 {project.title} 源码</span>
        </ExternalLink>
      ) : null}
      {(!includeDetail || !project.detail) && !project.site && !project.repo ? (
        <span className="private-icon" role="img" title="非公开项目" aria-label={`${project.title} 为非公开项目`}>
          <LockKey size={18} weight="bold" />
        </span>
      ) : null}
    </div>
  );
}

function ScreenshotDialog({ shot, onClose }: { shot: GalleryShot | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!shot || !dialogRef.current) return;
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [shot]);

  if (!shot) return null;

  return (
    <dialog
      ref={dialogRef}
      className="screenshot-dialog"
      aria-labelledby="screenshot-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="screenshot-dialog-panel">
        <button className="dialog-close icon-button" type="button" onClick={onClose} aria-label="关闭大图">
          <X size={19} weight="bold" />
        </button>
        <img src={shot.image} alt={shot.alt} width={shot.width} height={shot.height} />
        <div className="dialog-caption">
          <strong id="screenshot-dialog-title">{shot.label}</strong>
          <p>{shot.description}</p>
        </div>
      </div>
    </dialog>
  );
}

function LawShowcaseGallery() {
  const [activeShotId, setActiveShotId] = useState(lawGalleryShots[0].id);
  const [previewOpen, setPreviewOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const activeShot = lawGalleryShots.find((shot) => shot.id === activeShotId) ?? lawGalleryShots[0];
  const activeIndex = lawGalleryShots.findIndex((shot) => shot.id === activeShot.id);

  function selectRelativeShot(offset: number) {
    const nextIndex = (activeIndex + offset + lawGalleryShots.length) % lawGalleryShots.length;
    setActiveShotId(lawGalleryShots[nextIndex].id);
  }

  return (
    <div className="law-showcase">
      <div
        id="law-gallery-panel"
        className="law-stage"
        role="tabpanel"
        aria-labelledby={`law-gallery-tab-${activeShot.id}`}
        onPointerMove={trackPointerGlow}
        onPointerLeave={resetPointerGlow}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.figure
            key={activeShot.id}
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.985, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -7, scale: 0.992, filter: "blur(5px)" }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              className={activeShot.fit === "contain" ? "is-contain" : ""}
              src={activeShot.image}
              srcSet={activeShot.srcSet}
              sizes={activeShot.sizes}
              alt={activeShot.alt}
              width={activeShot.width}
              height={activeShot.height}
              loading="lazy"
              style={{ objectPosition: activeShot.position }}
            />
            <figcaption>
              <div>
                <span>{activeShot.label}</span>
                <strong>{activeShot.title}</strong>
              </div>
              <p>{activeShot.description}</p>
            </figcaption>
          </motion.figure>
        </AnimatePresence>

        <div className="gallery-actions" aria-label="切换与查看律所界面">
          <button type="button" onClick={() => selectRelativeShot(-1)} aria-label="上一张律所界面">
            <ArrowLeft size={18} weight="bold" />
          </button>
          <button type="button" onClick={() => selectRelativeShot(1)} aria-label="下一张律所界面">
            <ArrowRight size={18} weight="bold" />
          </button>
          <button type="button" onClick={() => setPreviewOpen(true)} aria-label="查看律所界面大图">
            <ArrowsOutSimple size={18} weight="bold" />
          </button>
        </div>
      </div>

      <div className="law-shot-strip" role="tablist" aria-label="根旺律所数字站真实界面">
        {lawGalleryShots.map((shot) => (
          <button
            key={shot.id}
            id={`law-gallery-tab-${shot.id}`}
            type="button"
            role="tab"
            aria-selected={activeShot.id === shot.id}
            aria-controls="law-gallery-panel"
            className={activeShot.id === shot.id ? "is-active" : ""}
            onClick={() => setActiveShotId(shot.id)}
          >
            <img
              src={shot.image}
              srcSet={shot.srcSet}
              sizes="128px"
              alt=""
              width={shot.width}
              height={shot.height}
              loading="lazy"
              style={{ objectPosition: shot.position }}
            />
            <span>{shot.label}</span>
          </button>
        ))}
      </div>

      <ScreenshotDialog shot={previewOpen ? activeShot : null} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}

function Header({
  theme,
  trailEnabled,
  onThemeChange,
  onTrailChange,
}: {
  theme: ThemeMode;
  trailEnabled: boolean;
  onThemeChange: () => void;
  onTrailChange: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const isDark = theme === "dark";

  useEffect(() => {
    document.body.classList.toggle("menu-is-open", menuOpen);
    return () => document.body.classList.remove("menu-is-open");
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Magnetic strength={0.14}>
          <Link className="brand" to="/" title="ljj.world 首页" aria-label="ljj.world 首页">
            <span>ljj.world</span>
          </Link>
        </Magnetic>

        <nav className="desktop-nav" aria-label="主要导航">
          <NavLink to="/" end>首页</NavLink>
          <NavLink to="/projects">项目</NavLink>
          <NavLink to="/systems">服务器</NavLink>
          <NavLink to="/about">关于</NavLink>
        </nav>

        <div className="nav-actions">
          <Magnetic strength={0.12}>
            <a
              className="icon-link github-link"
              href="https://github.com/lij768423-svg"
              target="_blank"
              rel="noreferrer"
              aria-label="在 GitHub 查看 lij768423-svg"
              title="GitHub"
            >
              <GithubLogo size={19} weight="fill" aria-hidden="true" />
            </a>
          </Magnetic>
          <Magnetic strength={0.12}>
            <button
              className="theme-switch trail-switch"
              type="button"
              role="switch"
              aria-checked={trailEnabled}
              onClick={onTrailChange}
              title={trailEnabled ? "关闭鼠标拖影" : "开启鼠标拖影"}
              aria-label="鼠标拖影"
            >
              <MouseSimple size={16} weight="bold" aria-hidden="true" />
              <span className="theme-switch-track" aria-hidden="true"><span /></span>
            </button>
          </Magnetic>
          <Magnetic strength={0.12}>
            <button
              className="theme-switch"
              type="button"
              role="switch"
              aria-checked={isDark}
              onClick={onThemeChange}
              title={isDark ? "关闭深色模式" : "开启深色模式"}
              aria-label="深色模式"
            >
              <Sun className="theme-switch-sun" size={15} weight="bold" aria-hidden="true" />
              <span className="theme-switch-track" aria-hidden="true"><span /></span>
              <Moon className="theme-switch-moon" size={15} weight="bold" aria-hidden="true" />
            </button>
          </Magnetic>
          <Magnetic strength={0.12}>
            <button
              className="menu-toggle"
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="site-navigation"
              aria-label={menuOpen ? "Close - 关闭导航" : "Menu - 打开导航"}
            >
              <span>{menuOpen ? "Close" : "Menu"}</span>
              {menuOpen ? <X size={19} weight="bold" /> : <SquaresFour size={19} weight="fill" />}
            </button>
          </Magnetic>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.nav
            id="site-navigation"
            className="site-menu"
            aria-label="移动端导航"
            initial={reduceMotion ? false : { clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={reduceMotion ? undefined : { clipPath: "inset(0 0 100% 0)" }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="site-menu-inner section-shell">
              <p className="menu-label">Navigation / 目录</p>
              <div className="menu-links">
                <Link to="/" onClick={closeMenu}><span>Home</span><strong>首页</strong><ArrowRight /></Link>
                <Link to="/projects" onClick={closeMenu}><span>Projects</span><strong>全部项目</strong><ArrowRight /></Link>
                <Link to="/systems" onClick={closeMenu}><span>Server</span><strong>我的服务器</strong><ArrowRight /></Link>
                <Link to="/about" onClick={closeMenu}><span>About</span><strong>关于</strong><ArrowRight /></Link>
              </div>
              <div className="menu-footer">
                <span>产品、界面与个人服务器</span>
                <ExternalLink href="https://github.com/lij768423-svg">
                  GitHub <ArrowUpRight size={16} weight="bold" />
                </ExternalLink>
              </div>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function Hero({ theme }: { theme: ThemeMode }) {
  const reduceMotion = useReducedMotion();
  const isPhone = window.matchMedia("(max-width: 767px)").matches;
  const pixelRevealRef = useRef<PixelRevealHandle>(null);
  const portraitSource = theme === "dark"
    ? "/assets/virtual-developer-avatar-light.webp"
    : "/assets/virtual-developer-avatar.webp";
  const portraitSourceSet = theme === "dark"
    ? "/assets/virtual-developer-avatar-light-512.webp 512w, /assets/virtual-developer-avatar-light-1024.webp 1024w, /assets/virtual-developer-avatar-light-1600.webp 1600w, /assets/virtual-developer-avatar-light.webp 2048w"
    : "/assets/virtual-developer-avatar-512.webp 512w, /assets/virtual-developer-avatar-1024.webp 1024w, /assets/virtual-developer-avatar-1600.webp 1600w, /assets/virtual-developer-avatar.webp 2048w";

  return (
      <section
        id="top"
        className="hero hero-intro section-shell"
        data-home-scene="intro"
        aria-labelledby="hero-title"
        onPointerMove={(event) => {
          if (reduceMotion || event.pointerType === "touch" || window.innerWidth <= 1080) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
          const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;
          event.currentTarget.style.setProperty("--portrait-shift-x", `${horizontal * -12}px`);
          event.currentTarget.style.setProperty("--portrait-shift-y", `${vertical * -8}px`);
          pixelRevealRef.current?.revealAt(event.clientX, event.clientY);
        }}
        onPointerLeave={(event) => {
          pixelRevealRef.current?.release();
          event.currentTarget.style.setProperty("--portrait-shift-x", "0px");
          event.currentTarget.style.setProperty("--portrait-shift-y", "0px");
        }}
      >
        <PixelReveal ref={pixelRevealRef} />
        <InteractiveDotGrid />
        <motion.div
          className="hero-signal-instrument"
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
        >
          <svg viewBox="0 0 460 176" focusable="false">
            <path className="hero-signal-baseline" d="M8 148H452M8 28H452" />
            <g className="hero-signal-disc">
              <circle className="hero-signal-orbit hero-signal-orbit-outer" cx="82" cy="88" r="58" />
              <circle className="hero-signal-orbit hero-signal-orbit-inner" cx="82" cy="88" r="42" />
              <path className="hero-signal-crosshair" d="M82 18V38M82 138V158M12 88H32M132 88H152" />
            </g>
            <path className="hero-signal-route" d="M24 112H54L72 93H108L127 116H164L184 72H226L246 96H286L307 54H347L368 82H438" />
            <path className="hero-signal-echo" d="M166 132H216L230 118H270L288 132H340" />
            <g className="hero-signal-nodes">
              <circle cx="72" cy="93" r="4" />
              <circle cx="184" cy="72" r="4" />
              <circle cx="307" cy="54" r="4" />
              <circle cx="368" cy="82" r="4" />
            </g>
            <path className="hero-signal-ticks" d="M168 30V42M192 30V38M216 30V42M240 30V38M264 30V42M288 30V38M312 30V42M336 30V38M360 30V42M384 30V38M408 30V42M432 30V38" />
          </svg>
        </motion.div>
        <motion.figure
          className="hero-portrait"
          role="img"
          aria-label="依据本人形象创作的黑框眼镜动漫数字分身"
          initial={reduceMotion || isPhone ? false : { opacity: 0, x: 28, scale: 0.985 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={reduceMotion || isPhone
            ? { duration: 0 }
            : { duration: 0.82, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <img
            className="hero-portrait-image"
            src={portraitSource}
            srcSet={portraitSourceSet}
            sizes="(max-width: 1100px) 100vw, min(58vw, 920px)"
            alt=""
            width={2048}
            height={1152}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            draggable={false}
          />
        </motion.figure>
        <motion.div
          className="hero-copy"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 id="hero-title">
            <span className="identity">
              <DecryptedText text="lij768423-svg / 独立开发者" />
            </span>
            <span className="hero-statement">
              <BlurText className="hero-line" text="你好，我是 ljj。" delay={0.08} />
              <BlurText className="hero-line" text="把想法做成长期运行的产品。" delay={0.3} />
            </span>
          </h1>
          <p className="hero-summary">
            我做学习产品、AI 客户端、客户交付和个人基础设施。设计、开发、部署与长期维护都由我完成。
          </p>
          <div className="hero-actions">
            <Magnetic>
              <a className="button button-primary" href="#featured-projects">
                <span>查看项目</span><span className="button-arrow"><ArrowRight size={18} weight="bold" /></span>
              </a>
            </Magnetic>
            <Magnetic>
              <a className="button button-secondary" href="#about-me">
                了解我 <ArrowRight size={18} weight="bold" />
              </a>
            </Magnetic>
          </div>
        </motion.div>
      </section>
  );
}

type HomeSceneId = "intro" | "about" | "projects";

const homeScenes: { id: HomeSceneId; label: string }[] = [
  { id: "intro", label: "介绍" },
  { id: "about", label: "关于" },
  { id: "projects", label: "项目" },
];

const aboutStickers = [
  { id: "cafe-tech", image: "/assets/about-cafe-tech-480.webp", label: "咖啡店木桌上的电脑与手机", width: 360, height: 480, position: "50% 66%", rope: 96, rotate: -13 },
  { id: "pc-build", image: "/assets/about-pc-build-480.webp", label: "带灯光与独立显卡的硬件主机内部", width: 480, height: 270, position: "50% 50%", rope: 112, rotate: 9 },
  { id: "outfit", image: "/assets/about-outfit-480.webp", label: "黑色外套与白色上衣的日常穿搭", width: 360, height: 480, position: "50% 43%", rope: 276, rotate: 15 },
  { id: "desk-audio", image: "/assets/about-desk-audio-480.webp", label: "带透明音箱和播放器的夜间桌搭", width: 480, height: 360, position: "50% 50%", rope: 356, rotate: -7 },
  { id: "desk-warm", image: "/assets/about-desk-warm-480.webp", label: "暖色灯光下的显示器与机械键盘桌搭", width: 480, height: 286, position: "50% 49%", rope: 462, rotate: 11 },
  { id: "desk-night", image: "/assets/about-desk-night-480.webp", label: "布置完成后的深夜桌面空间", width: 480, height: 421, position: "50% 45%", rope: 570, rotate: -4 },
] as const;

type AboutSticker = (typeof aboutStickers)[number];

function SuspendedSticker({
  sticker,
  index,
  loadImage,
  ready,
  reduceMotion,
  dragBoundsRef,
}: {
  sticker: AboutSticker;
  index: number;
  loadImage: boolean;
  ready: boolean;
  reduceMotion: boolean;
  dragBoundsRef: RefObject<HTMLDivElement | null>;
}) {
  const staticSticker = reduceMotion || window.matchMedia("(max-width: 767px)").matches;
  const [settled, setSettled] = useState(staticSticker);
  const drop = useMotionValue(staticSticker ? 0 : -sticker.rope);
  const angle = useMotionValue(staticSticker ? sticker.rotate : sticker.rotate * 2.35);
  const bend = useMotionValue(staticSticker ? 0 : (index % 2 === 0 ? -48 : 48));
  const opacity = useMotionValue(0);
  const scale = useMotionValue(staticSticker ? 1 : 0.84);
  const dragX = useMotionValue(0);
  const renderedAngle = useTransform([angle, dragX], ([angleValue, dragXValue]) => (
    Number(angleValue) + Number(dragXValue) * 0.045
  ));
  const ropePath = useTransform([drop, bend, dragX], ([dropValue, bendValue, dragXValue]) => {
    const endX = 100 + Number(dragXValue);
    const endY = Math.max(0, sticker.rope + Number(dropValue));
    const extension = Math.min(1.15, endY / sticker.rope);
    const curve = (Number(bendValue) + Number(dragXValue) * 0.6) * extension;
    return `M 100 0 C ${100 - curve * 0.24} ${endY * 0.24}, ${endX + curve * 0.58} ${endY * 0.68}, ${endX} ${endY}`;
  });

  useEffect(() => {
    if (!ready) {
      setSettled(false);
      return;
    }
    if (staticSticker) {
      drop.set(0);
      angle.set(sticker.rotate);
      bend.set(0);
      opacity.set(1);
      scale.set(1);
      setSettled(true);
      return;
    }

    setSettled(false);
    let cancelled = false;
    const delay = index * 0.09;
    const controls = [
      animate(drop, 0, {
        type: "spring",
        stiffness: 48 + index * 2,
        damping: 7.4 + index * 0.38,
        mass: 0.92 + index * 0.05,
        delay,
      }),
      animate(angle, sticker.rotate, {
        type: "spring",
        stiffness: 34 + index * 2,
        damping: 5.8 + index * 0.3,
        mass: 0.82,
        delay,
      }),
      animate(bend, 0, {
        type: "spring",
        stiffness: 30 + index,
        damping: 4.2 + index * 0.24,
        mass: 0.76,
        delay,
      }),
      animate(opacity, 1, { duration: 0.16, delay }),
      animate(scale, 1, {
        type: "spring",
        stiffness: 62,
        damping: 10,
        mass: 0.72,
        delay,
      }),
    ];
    Promise.all(controls.map((control) => control.then(() => undefined))).then(() => {
      if (!cancelled) setSettled(true);
    });
    return () => {
      cancelled = true;
      controls.forEach((control) => control.stop());
    };
  }, [angle, bend, drop, index, opacity, ready, scale, staticSticker, sticker.rope, sticker.rotate]);

  function releaseSticker() {
    animate(dragX, 0, { type: "spring", stiffness: 118, damping: 17, mass: 0.82 });
    animate(drop, 0, { type: "spring", stiffness: 122, damping: 18, mass: 0.82 });
    animate(angle, sticker.rotate, { type: "spring", stiffness: 90, damping: 15, mass: 0.76 });
    animate(bend, 0, { type: "spring", stiffness: 96, damping: 16, mass: 0.72 });
    animate(scale, 1, { type: "spring", stiffness: 150, damping: 18 });
  }

  return (
    <div className={`about-sticker-rig about-sticker-${index + 1}`}>
      <motion.svg
        className="about-elastic-rope"
        aria-hidden="true"
        viewBox={`0 0 200 ${sticker.rope + 80}`}
        preserveAspectRatio="none"
        style={{
          height: sticker.rope + 80,
          top: -sticker.rope,
          opacity,
        }}
      >
        <motion.path d={ropePath} />
      </motion.svg>
      <div
        className="about-sticker-breather"
        data-breathing={settled && !staticSticker ? "true" : "false"}
      >
        <motion.figure
          className="about-sticker"
          data-drag-enabled={ready && !staticSticker ? "true" : "false"}
          drag={ready && !staticSticker}
          dragConstraints={dragBoundsRef}
          dragElastic={0.08}
          dragMomentum={false}
          style={{ x: dragX, y: drop, rotate: renderedAngle, opacity, scale }}
          onDragStart={() => animate(scale, 1.035, { type: "spring", stiffness: 180, damping: 18 })}
          onDragEnd={releaseSticker}
        >
          <img
            src={loadImage ? sticker.image : undefined}
            alt={sticker.label}
            width={sticker.width}
            height={sticker.height}
            loading="eager"
            decoding="async"
            draggable={false}
            style={{ objectPosition: sticker.position }}
          />
        </motion.figure>
      </div>
    </div>
  );
}

function AboutScene({
  photosRequested,
  stickersReady,
}: {
  photosRequested: boolean;
  stickersReady: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const stickerFieldRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="about-me"
      className="home-scene home-about-scene"
      data-home-scene="about"
      data-stickers-ready={stickersReady}
      aria-labelledby="home-about-title"
    >
      <SceneLineOrnaments variant="about" />
      <div className="home-about-inner section-shell">
        <motion.div
          className="about-copy"
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 id="home-about-title">关于我</h2>
          <div className="about-copy-body">
            <p>我是一名正在准备考研的个人开发者。大部分时间在专业课、真题和代码之间切换，也在慢慢找到一套能长期坚持的节奏。</p>
            <p>我不太喜欢让问题停在“凑合用”的状态。刷题体验不顺手，就做自己的题库；想把 AI 放进真实工作流，就自己写客户端、接口和部署。</p>
            <p>生活里我爱折腾数码、桌搭和硬件 DIY，也会健身、研究穿搭。学习、训练和做产品对我来说很像：先理解，再反复调整，最后让它真正适合自己。</p>
          </div>
          <ul className="about-interests" aria-label="个人爱好">
            <li>数码桌搭</li>
            <li>健身</li>
            <li>穿搭</li>
            <li>硬件 DIY</li>
          </ul>
          <span className="about-writing-mark" aria-hidden="true">备考中</span>
        </motion.div>

        <div
          ref={stickerFieldRef}
          className="about-sticker-field"
          aria-label="由绳子悬挂的生活照片"
          data-photo-drag={stickersReady && !Boolean(reduceMotion) ? "enabled" : "disabled"}
        >
          {aboutStickers.map((sticker, index) => (
            <SuspendedSticker
              key={sticker.id}
              sticker={sticker}
              index={index}
              loadImage={photosRequested}
              ready={stickersReady}
              reduceMotion={Boolean(reduceMotion)}
              dragBoundsRef={stickerFieldRef}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FavoriteProjectsScene() {
  const favorites = projects.filter((project) => project.id === "408-web" || project.id === "law-site");
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="featured-projects"
      className="home-scene favorite-projects-scene"
      data-home-scene="projects"
      aria-labelledby="favorite-projects-title"
    >
      <SceneLineOrnaments variant="projects" />
      <div className="favorite-projects-inner section-shell">
        <motion.div
          className="favorite-projects-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 id="favorite-projects-title">我的收藏项目</h2>
          <Link to="/projects">查看全部 <ArrowRight size={17} weight="bold" /></Link>
        </motion.div>

        <div className="favorite-projects-grid">
          {favorites.map((project, index) => (
            <motion.article
              key={project.id}
              className={`favorite-project favorite-project-${project.id}`}
              data-featured-project={project.id}
              initial={reduceMotion ? false : { opacity: 0, y: 42, rotate: index === 0 ? -1.6 : 1.6 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, amount: 0.28 }}
              transition={{ duration: 0.72, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link className="favorite-project-link" to="/projects">
                <div className="favorite-project-media">
                  <img
                    src={project.cardPreview.image}
                    alt={project.cardPreview.alt}
                    width={project.cardPreview.width}
                    height={project.cardPreview.height}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="favorite-project-copy">
                  <span>{project.kind}</span>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeSceneRail({ activeScene, onSelect }: { activeScene: HomeSceneId; onSelect: (scene: HomeSceneId) => void }) {
  return (
    <nav className="home-scene-rail" aria-label="首页章节">
      {homeScenes.map((scene) => (
        <button
          key={scene.id}
          type="button"
          className={activeScene === scene.id ? "is-active" : ""}
          aria-current={activeScene === scene.id ? "page" : undefined}
          onClick={() => onSelect(scene.id)}
        >
          <span aria-hidden="true" />
          <strong>{scene.label}</strong>
        </button>
      ))}
    </nav>
  );
}

function AboutWorkMethod() {
  return (
    <section className="about-method section-shell" aria-labelledby="about-method-title">
      <Reveal className="about-section-heading">
        <h2 id="about-method-title">我怎样把事情做完</h2>
        <p>从问题、界面到运行状态，每一步都需要能被验证。</p>
      </Reveal>
      <div className="about-method-list">
        <Reveal className="about-method-row">
          <span className="about-method-icon" aria-hidden="true"><Books size={28} weight="duotone" /></span>
          <h3>先把流程看完整</h3>
          <p>刷题后的复盘、咨询后的接管、AI 输出后的归档，真正的问题往往发生在第一步之后。</p>
        </Reveal>
        <Reveal className="about-method-row">
          <span className="about-method-icon" aria-hidden="true"><Code size={28} weight="duotone" /></span>
          <h3>用真实界面验证</h3>
          <p>跨 Web 与原生端实现核心流程，再用真机、浏览器和自动化测试校正体验。</p>
        </Reveal>
        <Reveal className="about-method-row">
          <span className="about-method-icon" aria-hidden="true"><CloudArrowUp size={28} weight="duotone" /></span>
          <h3>把上线算进设计</h3>
          <p>域名、存储、权限、监控和备份不是收尾工作，而是产品能否长期存在的条件。</p>
        </Reveal>
      </div>
    </section>
  );
}

function FeaturedProject({ showHeading = true }: { showHeading?: boolean }) {
  const [activeShotId, setActiveShotId] = useState(galleryShots[0].id);
  const [previewOpen, setPreviewOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const activeShot = galleryShots.find((shot) => shot.id === activeShotId) ?? galleryShots[0];
  const activeIndex = galleryShots.findIndex((shot) => shot.id === activeShot.id);

  function selectRelativeShot(offset: number) {
    const nextIndex = (activeIndex + offset + galleryShots.length) % galleryShots.length;
    setActiveShotId(galleryShots[nextIndex].id);
  }

  return (
    <section
      id="featured"
      className={`featured section-shell${showHeading ? "" : " is-page-content"}`}
      aria-labelledby={showHeading ? "featured-title" : undefined}
      aria-label={showHeading ? undefined : "408 刷题库案例详情"}
    >
      {showHeading ? (
        <Reveal className="section-heading">
          <p className="section-kicker">Selected work</p>
          <h2 id="featured-title">408 刷题库</h2>
          <p>它解决的不是“哪里能做题”，而是“答错之后，怎样把薄弱点真正复盘掉”。</p>
        </Reveal>
      ) : null}

      <Reveal className="case-brief">
        <div>
          <span>问题</span>
          <p>刷题、错题、复习计划和知识笔记彼此割裂，用户很难知道今天最该复习什么。</p>
        </div>
        <div>
          <span>我的工作</span>
          <p>产品流程、学习算法、前后端契约、界面实现与部署。</p>
        </div>
        <div>
          <span>边界</span>
          <p>题库内容来自公开整理，项目原创重点是学习体验与复盘系统。</p>
        </div>
      </Reveal>

      <div className="case-gallery">
        <div className="gallery-controls" role="tablist" aria-label="408 刷题库界面阶段">
          {galleryShots.map((shot) => (
            <button
              key={shot.id}
              id={`gallery-tab-${shot.id}`}
              type="button"
              role="tab"
              aria-selected={activeShot.id === shot.id}
              aria-controls="featured-gallery-panel"
              className={activeShot.id === shot.id ? "is-active" : ""}
              onClick={() => setActiveShotId(shot.id)}
            >
              <span>{shot.label}</span>
              <strong>{shot.title}</strong>
              <small>{shot.description}</small>
            </button>
          ))}
        </div>

        <div
          id="featured-gallery-panel"
          className="gallery-stage"
          role="tabpanel"
          aria-labelledby={`gallery-tab-${activeShot.id}`}
          onPointerMove={trackPointerGlow}
          onPointerLeave={resetPointerGlow}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.figure
              key={activeShot.id}
              initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.985, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.992, filter: "blur(5px)" }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                className={activeShot.fit === "contain" ? "is-contain" : ""}
                src={activeShot.image}
                srcSet={activeShot.srcSet}
                sizes={activeShot.sizes}
                alt={activeShot.alt}
                width={activeShot.width}
                height={activeShot.height}
                loading="lazy"
                style={{ objectPosition: activeShot.position }}
              />
              <figcaption>
                <strong>{activeShot.label}</strong>
                <span>{activeShot.description}</span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
          <div className="gallery-actions" aria-label="切换与查看界面">
            <button type="button" onClick={() => selectRelativeShot(-1)} aria-label="上一张界面">
              <ArrowLeft size={18} weight="bold" />
            </button>
            <button type="button" onClick={() => selectRelativeShot(1)} aria-label="下一张界面">
              <ArrowRight size={18} weight="bold" />
            </button>
            <button type="button" onClick={() => setPreviewOpen(true)} aria-label="查看界面大图">
              <ArrowsOutSimple size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      <Reveal className="learning-loop">
        <div className="learning-loop-intro">
          <h3>一次作答，最终变成下一次复习。</h3>
          <p>界面不是孤立页面，每一步都把上下文交给后续流程。</p>
        </div>
        <ol>
          <li><strong>即时判分</strong><span>多选结果与题库解析同时出现</span></li>
          <li><strong>进入错题</strong><span>错误自动写入复习计划</span></li>
          <li><strong>安排复习</strong><span>按 1、3、7、14、30、60 天回访</span></li>
          <li><strong>继续理解</strong><span>AI 保留题目与作答上下文</span></li>
          <li><strong>沉淀笔记</strong><span>保存进可搜索的 Markdown 知识库</span></li>
        </ol>
      </Reveal>

      <div className="featured-footer">
        <Reveal className="featured-copy">
          <p>
            2378 道四科题目覆盖顺序、随机、错题、收藏与搜索。错误答案进入 1、3、7、14、30、60 天复习计划，AI 讲题和 Markdown 知识库继续承接理解与沉淀。
          </p>
          <div className="inline-links">
            <ExternalLink href="https://quiz.hermesjj.com/">
              在线体验 <ArrowUpRight size={17} weight="bold" />
            </ExternalLink>
            <ExternalLink href="https://github.com/lij768423-svg/408-">
              查看源码 <GithubLogo size={17} weight="fill" />
            </ExternalLink>
          </div>
        </Reveal>
        <Reveal className="feature-metrics">
          <div><strong>2378</strong><span>当前展示题目</span></div>
          <div><strong>6</strong><span>间隔复习节点</span></div>
          <div><strong>2</strong><span>本地与后端模式</span></div>
        </Reveal>
      </div>
      <ScreenshotDialog shot={previewOpen ? activeShot : null} onClose={() => setPreviewOpen(false)} />
    </section>
  );
}

function IosCaseContent() {
  return (
    <section className="selected case-content section-shell" aria-label="Hermes for iOS 案例详情">
      <article className="story story-ios">
        <Reveal className="story-copy">
          <div className="story-meta"><span>Hermes for iOS</span><span>开源 / 真机运行</span></div>
          <h2>把既有 ArkTS 产品完整迁移到 SwiftUI。</h2>
          <p>除了功能对齐，还要解决中文输入法吞字、Markdown 公式渲染和移动端对话层级。</p>
          <dl className="decision-list">
            <div><dt>交互</dt><dd>助手正文离开卡片，用户消息保留蓝色气泡，附件与输入区保持轻量。</dd></div>
            <div><dt>工程</dt><dd>从 UIKit first responder 读取 marked text，修复中文输入的组合态丢失。</dd></div>
            <div><dt>验证</dt><dd>iPhone 17 Pro Max 真机构建通过，聊天、设置、抽屉与附件没有 P0-P2 问题。</dd></div>
          </dl>
          <ExternalLink className="text-link" href="https://github.com/lij768423-svg/ioschat">
            查看仓库 <ArrowUpRight size={17} weight="bold" />
          </ExternalLink>
        </Reveal>

        <Reveal className="ios-visual">
          <img
            className="ios-screen ios-screen-main"
            src="/assets/ioschat.webp"
            srcSet="/assets/ioschat-520.webp 520w, /assets/ioschat-660.webp 660w, /assets/ioschat.webp 1320w"
            sizes="(max-width: 680px) 150px, (max-width: 980px) 240px, 290px"
            alt="Hermes iOS 新对话界面"
            width="1320"
            height="2868"
            loading="lazy"
          />
          <img
            className="ios-screen ios-screen-drawer"
            src="/assets/ioschat-drawer.webp"
            srcSet="/assets/ioschat-drawer-603.webp 603w, /assets/ioschat-drawer.webp 1206w"
            sizes="(max-width: 680px) 130px, (max-width: 980px) 210px, 250px"
            alt="Hermes iOS 会话抽屉界面"
            width="1206"
            height="2622"
            loading="lazy"
          />
        </Reveal>
      </article>
    </section>
  );
}

function LawCaseContent() {
  return (
    <section className="selected case-content section-shell" aria-label="根旺律所数字站案例详情">
      <article className="story story-law">
        <Reveal className="law-visual">
          <LawShowcaseGallery />
        </Reveal>

        <Reveal className="story-copy law-copy">
          <div className="story-meta"><span>根旺律所数字站</span><span>客户项目 / 私有源码</span></div>
          <h2>为真实机构设计内容、咨询与人工接管链路。</h2>
          <p>官网不仅负责展示，也要守住敏感信息边界，并让 AI 摘要、人工客服和内容后台可靠衔接。</p>
          <div className="law-metrics" aria-label="项目交付数据">
            <div><strong>14</strong><span>公开路由验证通过</span></div>
            <div><strong>18</strong><span>团队成员上线</span></div>
            <div><strong>41</strong><span>脱敏案例</span></div>
          </div>
          <p className="scope-note">负责产品架构、内容审核边界、权限设计与部署。这里只展示公开页面，客服工作台不进入作品集素材。</p>
          <ExternalLink className="text-link" href="https://lawweb.hermesjj.com/">
            访问网站 <ArrowUpRight size={17} weight="bold" />
          </ExternalLink>
        </Reveal>
      </article>
    </section>
  );
}

function HarmonyCaseContent() {
  return (
    <section className="selected case-content section-shell" aria-label="408 for HarmonyOS 案例详情">
      <Reveal className="platform-project harmony-project">
        <div className="platform-media" onPointerMove={trackPointerGlow} onPointerLeave={resetPointerGlow}>
          <img
            src="/assets/408-harmony.webp"
            srcSet="/assets/408-harmony-800.webp 800w, /assets/408-harmony-1600.webp 1600w, /assets/408-harmony.webp 1920w"
            sizes="(max-width: 680px) calc(100vw - 32px), (max-width: 980px) calc(100vw - 72px), 56vw"
            alt="408 for HarmonyOS 沉浸式刷题真实界面"
            width="1920"
            height="1080"
            loading="lazy"
          />
        </div>
        <div className="platform-copy">
          <div className="story-meta"><span>408 for HarmonyOS</span><span>开源</span></div>
          <h2>把核心刷题体验带到 HarmonyOS NEXT。</h2>
          <p>离线题库、滑动答题、错题收藏和 KaTeX 公式都在原生端完成，网络只为可选 AI 能力服务。</p>
          <ExternalLink className="text-link" href="https://github.com/lij768423-svg/408-for-harmony">
            查看仓库 <ArrowUpRight size={17} weight="bold" />
          </ExternalLink>
        </div>
      </Reveal>
    </section>
  );
}

function ServerHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="server-hero section-shell" aria-labelledby="server-page-title">
      <motion.div
        className="server-hero-copy"
        initial={reduceMotion ? false : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.64, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="section-kicker">Home Serve</p>
        <h1 id="server-page-title">我的服务器</h1>
        <p>它承载开发环境、公开项目、AI 接口、个人数据和运维工具，是我把产品长期运行起来的基础设施。</p>
      </motion.div>

      <motion.figure
        className="server-hero-media"
        initial={reduceMotion ? false : { opacity: 0, x: 28, scale: 0.985 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.76, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        onPointerMove={trackPointerGlow}
        onPointerLeave={resetPointerGlow}
      >
        <img
          src="/assets/hardware-control.webp"
          srcSet="/assets/hardware-control-800.webp 800w, /assets/hardware-control-1600.webp 1600w, /assets/hardware-control.webp 3200w"
          sizes="(max-width: 980px) calc(100vw - 72px), 54vw"
          alt="home-serve 硬件状态控制台真实界面"
          width={3200}
          height={2000}
          loading="eager"
          fetchPriority="high"
        />
      </motion.figure>

      <dl className="server-facts" aria-label="服务器当前快照">
        {serverFacts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ServerOperatingModel() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="server-model section-shell" aria-labelledby="server-model-title">
      <div className="server-model-heading">
        <h2 id="server-model-title">它不是远程硬盘，是我的产品底座。</h2>
        <p>从写代码到公开访问，再到数据保存和故障恢复，每一层都放在自己能理解、能检查、能维护的环境里。</p>
      </div>

      <div className="server-role-grid">
        {serverRoles.map((role, index) => (
          <motion.article
            key={role.title}
            initial={reduceMotion ? false : { opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="server-role-icon" aria-hidden="true">{role.icon}</span>
            <div>
              <h3>{role.title}</h3>
              <strong>{role.stack}</strong>
              <p>{role.description}</p>
            </div>
          </motion.article>
        ))}
      </div>

      <div className="server-request-path">
        <div className="server-request-heading">
          <h2>一次访问怎样进入我的服务</h2>
          <p>管理入口和公开入口从第一步就分开，内部服务不因为方便而直接暴露。</p>
        </div>
        <ol>
          {serverRoute.map((step, index) => (
            <li key={step.title}>
              <span>{step.label}</span>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
              {index < serverRoute.length - 1 ? <ArrowRight size={19} weight="bold" aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ServerHomepageShowcase() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="server-homepage section-shell" aria-labelledby="server-homepage-title">
      <div className="server-homepage-heading">
        <h2 id="server-homepage-title">我为所有服务重新设计了一张首页。</h2>
        <p>Homepage 既是启动器，也是每天判断服务器是否正常的第一层界面。</p>
      </div>

      <motion.figure
        className="server-homepage-media"
        initial={reduceMotion ? false : { opacity: 0, y: 34, scale: 0.985 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src="/assets/homepage-dashboard.png"
          alt="Home Serve 自托管 Homepage 的真实服务总览界面"
          width={1440}
          height={900}
          loading="eager"
        />
      </motion.figure>

      <div className="server-homepage-notes" aria-label="Homepage 设计原则">
        <article>
          <strong>按使用场景分组</strong>
          <p>日常、内容、运维和网络入口分开，找服务时不需要回忆端口。</p>
        </article>
        <article>
          <strong>状态直接放在入口上</strong>
          <p>服务健康、CPU、内存和三块存储都在打开首页时顺手完成检查。</p>
        </article>
        <article>
          <strong>保留快捷与个性</strong>
          <p>快速搜索、常用服务置顶和主题切换，让运维入口也愿意每天打开。</p>
        </article>
      </div>
    </section>
  );
}

function DailyAiMaintenance() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="server-maintenance section-shell" aria-labelledby="server-maintenance-title">
      <div className="server-maintenance-copy">
        <h2 id="server-maintenance-title">每日 AI 维护，从证据开始。</h2>
        <p>所谓 AI 维护，不是把主机交给模型。巡检脚本先保留完整证据，摘要层再整理成当前结论、风险和建议动作，真正的系统改动仍由我确认。</p>

        <ol className="maintenance-flow">
          {maintenanceSteps.map((step, index) => (
            <motion.li
              key={step.title}
              initial={reduceMotion ? false : { opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ duration: 0.46, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <span>{step.meta}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
            </motion.li>
          ))}
        </ol>

        <div className="maintenance-evidence">
          <span>脚本</span><code>write-server-maintenance-log</code>
          <span>归档</span><code>maintenance-logs/YYYY-MM-DD.md</code>
        </div>
      </div>

      <motion.figure
        className="server-maintenance-media"
        initial={reduceMotion ? false : { opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.22 }}
        transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src="/assets/server-maintenance.png"
          alt="Home Serve 每日维护日志中心真实界面"
          width={1440}
          height={900}
          loading="eager"
        />
      </motion.figure>
    </section>
  );
}

function FavoriteContainers() {
  const [activeId, setActiveId] = useState<string>(favoriteContainers[0].id);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reduceMotion = useReducedMotion();
  const activeIndex = favoriteContainers.findIndex((container) => container.id === activeId);
  const activeContainer = favoriteContainers[activeIndex] ?? favoriteContainers[0];

  const moveContainerFocus = (index: number) => {
    const nextIndex = (index + favoriteContainers.length) % favoriteContainers.length;
    setActiveId(favoriteContainers[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <section className="favorite-containers section-shell" aria-labelledby="favorite-containers-title">
      <div className="favorite-containers-heading">
        <h2 id="favorite-containers-title">我最常用的 10 个容器。</h2>
        <p>它们不是为了凑一个 Home Lab 清单。每一个都替代了生活或开发中的具体重复动作。</p>
      </div>

      <div className="container-explorer">
        <div className="container-tabs" role="tablist" aria-label="常用容器">
          {favoriteContainers.map((container, index) => (
            <button
              key={container.id}
              ref={(node) => { tabRefs.current[index] = node; }}
              id={`container-tab-${container.id}`}
              type="button"
              role="tab"
              tabIndex={activeContainer.id === container.id ? 0 : -1}
              aria-selected={activeContainer.id === container.id}
              aria-controls="container-detail-panel"
              className={activeContainer.id === container.id ? "is-active" : ""}
              onClick={() => setActiveId(container.id)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                  event.preventDefault();
                  moveContainerFocus(index + 1);
                }
                if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveContainerFocus(index - 1);
                }
                if (event.key === "Home") {
                  event.preventDefault();
                  moveContainerFocus(0);
                }
                if (event.key === "End") {
                  event.preventDefault();
                  moveContainerFocus(favoriteContainers.length - 1);
                }
              }}
            >
              <span className="container-tab-icon" aria-hidden="true">{container.icon}</span>
              <span><strong>{container.name}</strong><small>{container.kind}</small></span>
            </button>
          ))}
        </div>

        <div
          id="container-detail-panel"
          className="container-detail"
          role="tabpanel"
          aria-labelledby={`container-tab-${activeContainer.id}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={activeContainer.id}
              initial={reduceMotion ? false : { opacity: 0, y: 16, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="container-detail-topline">
                <span className="container-detail-icon" aria-hidden="true">{activeContainer.icon}</span>
                <span>{activeContainer.kind}</span>
              </div>
              <h3>{activeContainer.name}</h3>
              <p className="container-detail-summary">{activeContainer.summary}</p>
              <p className="container-detail-description">{activeContainer.description}</p>

              <dl className="container-detail-facts">
                <div><dt>为什么自建</dt><dd>{activeContainer.reason}</dd></div>
                <div><dt>访问边界</dt><dd>{activeContainer.scope}</dd></div>
                <div><dt>一起工作的服务</dt><dd>{activeContainer.connects}</dd></div>
              </dl>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function ToolLab({ showHeading = true }: { showHeading?: boolean }) {
  const [activeCaseId, setActiveCaseId] = useState<string>(labCases[0].id);
  const reduceMotion = useReducedMotion();
  const activeCase = labCases.find((item) => item.id === activeCaseId) ?? labCases[0];

  return (
    <section
      id="tools"
      className={`tool-lab section-shell${showHeading ? "" : " is-page-content"}`}
      aria-labelledby={showHeading ? "lab-title" : undefined}
      aria-label={showHeading ? undefined : "服务器运行界面"}
    >
      {showHeading ? (
        <Reveal className="section-heading section-heading-compact">
          <h2 id="lab-title">服务器里的真实运行界面。</h2>
          <p>这些界面分别处理主机状态、远程网络和 AI 工作流，并且遵守不同的访问边界。</p>
        </Reveal>
      ) : null}

      <div className="lab-switcher" role="tablist" aria-label="服务器使用场景">
        {labCases.map((item) => (
          <button
            key={item.id}
            id={`lab-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={activeCase.id === item.id}
            aria-controls="lab-panel"
            className={activeCase.id === item.id ? "is-active" : ""}
            onClick={() => setActiveCaseId(item.id)}
          >
            <span>{item.label}</span>
            <small>{item.status}</small>
          </button>
        ))}
      </div>

      <div id="lab-panel" role="tabpanel" aria-labelledby={`lab-tab-${activeCase.id}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={activeCase.id}
            className="infra-proof"
            initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.99, filter: "blur(7px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.994, filter: "blur(5px)" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="infra-copy">
              <div className="story-meta"><span>{activeCase.label}</span><span>{activeCase.status}</span></div>
              <h3>{activeCase.title}</h3>
              <p>{activeCase.description}</p>
              <p className="scope-note">{activeCase.note}</p>
            </div>
            <div className="infra-media" onPointerMove={trackPointerGlow} onPointerLeave={resetPointerGlow}>
              <img
                src={activeCase.image}
                srcSet={activeCase.srcSet}
                sizes="(max-width: 680px) calc(100vw - 32px), (max-width: 980px) 54vw, 58vw"
                alt={activeCase.alt}
                width={activeCase.width}
                height={activeCase.height}
                loading="lazy"
              />
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  );
}

function ProjectIndex({
  initialFilter = "all",
  fixedFilter,
  showHeading = true,
  stageTitle,
  title = "公开作品，也包括正在运行的私有系统。",
  description = "原创产品、协作项目、客户交付与内部工具分开标注，能公开到什么程度一目了然。",
}: {
  initialFilter?: Filter;
  fixedFilter?: Category;
  showHeading?: boolean;
  stageTitle?: string;
  title?: string;
  description?: string;
}) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const reduceMotion = useReducedMotion();
  const activeFilter = fixedFilter ?? filter;
  const visibleProjects = useMemo(
    () => activeFilter === "all" ? projects : projects.filter((project) => project.category === activeFilter),
    [activeFilter],
  );

  const handleStagePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (reduceMotion || event.pointerType === "touch" || !stageTitle || window.innerWidth <= 1080) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
    const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.querySelectorAll<HTMLElement>(".project-card-kinetic").forEach((card, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      card.style.setProperty("--orbit-tilt-x", `${vertical * -2.2 * direction}deg`);
      card.style.setProperty("--orbit-tilt-y", `${horizontal * 2.8 * direction}deg`);
      card.style.setProperty("--orbit-shift-x", `${horizontal * (2 + index % 3)}px`);
      card.style.setProperty("--orbit-shift-y", `${vertical * (2 + (index + 1) % 3)}px`);
    });
    const title = event.currentTarget.querySelector<HTMLElement>(".project-stage-title");
    title?.style.setProperty("--title-shift-x", `${horizontal * -10}px`);
    title?.style.setProperty("--title-shift-y", `${vertical * -8}px`);
  };

  const resetStagePointer = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.querySelectorAll<HTMLElement>(".project-card-kinetic").forEach((card) => {
      card.style.setProperty("--orbit-tilt-x", "0deg");
      card.style.setProperty("--orbit-tilt-y", "0deg");
      card.style.setProperty("--orbit-shift-x", "0px");
      card.style.setProperty("--orbit-shift-y", "0px");
    });
    const title = event.currentTarget.querySelector<HTMLElement>(".project-stage-title");
    title?.style.setProperty("--title-shift-x", "0px");
    title?.style.setProperty("--title-shift-y", "0px");
  };

  return (
    <section
      id="projects"
      className={`project-index${showHeading ? "" : " is-page-content"}${stageTitle ? " has-stage-title" : ""}`}
      aria-labelledby={stageTitle ? "project-stage-title" : showHeading ? "projects-title" : undefined}
      aria-label={stageTitle || showHeading ? undefined : "项目索引"}
      onPointerMove={handleStagePointerMove}
      onPointerLeave={resetStagePointer}
    >
      <div className="section-shell">
        {stageTitle ? (
          <div className="project-stage-title">
            <h1 id="project-stage-title"><BlurText text={stageTitle} delay={0.04} /></h1>
            <p><DecryptedText text={`${visibleProjects.length} 个真实项目，按产品、AI 工具与服务器项目整理。`} startDelay={480} /></p>
          </div>
        ) : null}

        {showHeading ? (
          <Reveal className="section-heading project-index-heading">
            <p className="section-kicker">Complete index</p>
            <h2 id="projects-title">{title}</h2>
            <p>{description}</p>
          </Reveal>
        ) : null}

        {fixedFilter ? null : (
          <div className="filter-bar" role="group" aria-label="筛选项目">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                className={filter === item.id ? "is-active" : ""}
                onClick={() => setFilter(item.id)}
                aria-pressed={filter === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <motion.div className="project-groups" layout>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div className="project-group" layout>
              <div className="project-group-heading">
                <span>当前项目</span>
                <span>{String(visibleProjects.length).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</span>
              </div>
              {stageTitle ? (
                <Suspense fallback={<div className="project-helix-loading" aria-hidden="true" />}>
                  <ProjectHelix
                    projects={visibleProjects.map((project) => ({
                      ...project,
                      preview: project.cardPreview,
                      href: project.detail ?? `/projects/${project.id}`,
                    }))}
                  />
                </Suspense>
              ) : (
                <div className={`index-items project-cloud project-cloud-count-${visibleProjects.length}`}>
                  {visibleProjects.map((project, index) => (
                    <motion.article
                      className="index-item"
                      key={project.id}
                      layout
                      initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -16, scale: 0.96 }}
                      transition={{ duration: reduceMotion ? 0 : 0.34, delay: reduceMotion ? 0 : index * 0.025 }}
                    >
                      <Link
                        className="project-card-link"
                        to={project.detail ?? `/projects/${project.id}`}
                        aria-label={`查看 ${project.title} 项目`}
                        onPointerMove={trackPointerGlow}
                        onPointerLeave={resetPointerGlow}
                      >
                        <div className="project-card-kinetic">
                          <div className="project-card-float">
                            <div className={`project-card-surface project-card-${project.category}`}>
                              <div className="project-card-topline">
                                <span>{project.kind}</span>
                                <ArrowUpRight size={18} weight="bold" />
                              </div>
                              <div className="project-card-media">
                                <img
                                  src={project.cardPreview.image}
                                  alt={project.cardPreview.alt}
                                  width={project.cardPreview.width}
                                  height={project.cardPreview.height}
                                  loading="lazy"
                                />
                              </div>
                              <div className="project-card-copy">
                                <h3>{project.title}</h3>
                                <p>{project.description}</p>
                              </div>
                              <div className="project-card-footer">
                                <span>{project.status}</span>
                                <div aria-label={`${project.title} 技术栈`}>
                                  {project.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

function AboutProfileHero() {
  return (
    <section className="about-profile-hero section-shell" aria-labelledby="page-title">
      <Reveal className="about-profile-copy">
        <p className="about-profile-kicker">考研中的个人开发者</p>
        <h1 id="page-title">关于我</h1>
        <p className="about-profile-lead">一边准备研究生考试，一边把真实需求做成能长期运行的产品。</p>
        <p className="about-profile-summary">我喜欢从一个具体问题开始，自己完成界面、开发、部署和维护。比起短暂的演示，我更在意它能不能真正被使用，并在几个月后依然稳定。</p>
      </Reveal>
      <motion.figure
        className="about-profile-portrait"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src="/assets/about-avatar-three-quarter.webp"
          srcSet="/assets/about-avatar-three-quarter-768.webp 768w, /assets/about-avatar-three-quarter.webp 1024w"
          sizes="(max-width: 900px) calc(100vw - 48px), 44vw"
          alt="ljj 三分之四侧面的虚拟开发者形象"
          width={1024}
          height={1024}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </motion.figure>
    </section>
  );
}

function AboutStory() {
  return (
    <section className="about-story-page section-shell" aria-labelledby="about-story-title">
      <Reveal className="about-story-copy">
        <h2 id="about-story-title">备考是现在的主线，做产品是长期习惯。</h2>
        <div className="about-story-text">
          <p>目前大部分时间都在准备计算机考研。学习之外，我会继续维护自己的产品，把备考中遇到的低效流程变成可用的工具，也借这些项目训练产品判断、工程实现和长期维护能力。</p>
          <p>我对数码桌搭、健身、穿搭和硬件 DIY 都很感兴趣。它们看起来分散，但吸引我的地方很一致：观察细节、反复调整，并把手边的东西改到真正适合自己。</p>
        </div>
      </Reveal>
      <Reveal className="about-interest-row">
        <span>数码桌搭</span>
        <span>健身</span>
        <span>穿搭</span>
        <span>硬件 DIY</span>
      </Reveal>
      <div className="about-life-grid" aria-label="生活照片">
        <Reveal className="about-life-image about-life-image-wide">
          <img src="/assets/about-cafe-tech.webp" alt="咖啡店木桌上的电脑与手机" width={900} height={1200} loading="lazy" />
        </Reveal>
        <Reveal className="about-life-image about-life-image-landscape">
          <img src="/assets/about-pc-build.webp" alt="带灯光与独立显卡的硬件主机内部" width={1200} height={675} loading="lazy" />
        </Reveal>
        <Reveal className="about-life-image about-life-image-portrait">
          <img src="/assets/about-outfit.webp" alt="黑色外套与白色上衣的日常穿搭" width={900} height={1200} loading="lazy" />
        </Reveal>
      </div>
    </section>
  );
}

function AboutCapabilities() {
  return (
    <section className="about-capabilities section-shell" aria-labelledby="about-capabilities-title">
      <Reveal className="about-section-heading">
        <h2 id="about-capabilities-title">我能做的部分</h2>
        <p>技术栈会继续变化，清楚、可靠、可维护是固定标准。</p>
      </Reveal>
      <div className="about-capability-grid" aria-label="能力范围">
        <Reveal className="about-capability-item">
          <Browser size={30} weight="duotone" aria-hidden="true" />
          <div><span>产品界面</span><strong>Web、SwiftUI、ArkTS</strong><p>从信息架构、状态反馈到跨端交互一致性。</p></div>
        </Reveal>
        <Reveal className="about-capability-item">
          <Robot size={30} weight="duotone" aria-hidden="true" />
          <div><span>AI 接入</span><strong>SSE、兼容 API、工作流</strong><p>把模型能力放进真实会话、知识库和生产流程。</p></div>
        </Reveal>
        <Reveal className="about-capability-item">
          <Database size={30} weight="duotone" aria-hidden="true" />
          <div><span>服务系统</span><strong>Python、FastAPI、WebDAV</strong><p>关注接口契约、幂等、用户隔离和安全边界。</p></div>
        </Reveal>
        <Reveal className="about-capability-item">
          <HardDrives size={30} weight="duotone" aria-hidden="true" />
          <div><span>运行维护</span><strong>Docker、Tailscale、systemd</strong><p>部署、监控、备份与硬件状态一起进入交付范围。</p></div>
        </Reveal>
      </div>
    </section>
  );
}

function PageLead({
  label,
  title,
  description,
  className = "",
}: {
  label: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <section className={`page-lead section-shell ${className}`} aria-labelledby="page-title">
      <p className="section-kicker">{label}</p>
      <h1 id="page-title">{title}</h1>
      <p>{description}</p>
    </section>
  );
}

function CaseLead({ projectId, summary }: { projectId: string; summary: string }) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return null;

  return (
    <section className="case-lead section-shell" aria-labelledby="case-title">
      <Link className="page-back-link" to="/projects">
        <ArrowLeft size={17} weight="bold" /> 全部项目
      </Link>
      <p className="section-kicker">{project.kind}</p>
      <h1 id="case-title">{project.title}</h1>
      <p className="case-lead-summary">{summary}</p>
      <div className="case-lead-footer">
        <div className="case-lead-meta">
          <span>{project.status}</span>
          <span>{project.year}</span>
          {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <ProjectLinks project={project} includeDetail={false} />
      </div>
    </section>
  );
}

function HomePage({ theme }: { theme: ThemeMode }) {
  const storyRef = useRef<HTMLDivElement>(null);
  const [activeScene, setActiveScene] = useState<HomeSceneId>("intro");
  const [aboutPhotosRequested, setAboutPhotosRequested] = useState(false);
  const [aboutStickersReady, setAboutStickersReady] = useState(false);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ container: storyRef });

  useMotionValueEvent(scrollYProgress, "change", () => {
    const story = storyRef.current;
    if (!story) return;
    if (story.scrollTop > story.clientHeight * 0.06) setAboutPhotosRequested(true);
    const viewportCenter = story.scrollTop + story.clientHeight * 0.5;
    const scenes = Array.from(story.querySelectorAll<HTMLElement>("[data-home-scene]"));
    const activeElement = scenes.reduce((current, scene) => (
      viewportCenter >= scene.offsetTop ? scene : current
    ), scenes[0]);
    const nextScene = (activeElement?.dataset.homeScene ?? "intro") as HomeSceneId;
    setActiveScene((current) => current === nextScene ? current : nextScene);
    if (nextScene !== "intro") setAboutStickersReady(true);
  });

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const prepareMobileStory = () => {
      if (!mobileQuery.matches) return;
      setAboutPhotosRequested(true);
      setAboutStickersReady(true);
    };
    prepareMobileStory();
    mobileQuery.addEventListener("change", prepareMobileStory);
    return () => mobileQuery.removeEventListener("change", prepareMobileStory);
  }, []);

  function selectScene(scene: HomeSceneId) {
    const targetIndex = homeScenes.findIndex((item) => item.id === scene);
    const story = storyRef.current;
    if (targetIndex < 0 || !story) return;
    const target = story.querySelector<HTMLElement>(`[data-home-scene="${scene}"]`);
    if (!target) return;
    setActiveScene(scene);
    if (scene !== "intro") setAboutPhotosRequested(true);
    if (scene === "about") setAboutStickersReady(true);
    story.scrollTo({
      top: target.offsetTop,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  return (
    <div ref={storyRef} className="home-story">
      <Hero theme={theme} />
      <AboutScene photosRequested={aboutPhotosRequested} stickersReady={aboutStickersReady} />
      <div className="home-scene-buffer" aria-hidden="true" />
      <FavoriteProjectsScene />
      <HomeSceneRail activeScene={activeScene} onSelect={selectScene} />
    </div>
  );
}

function usePhoneLayout() {
  const [isPhone, setIsPhone] = useState(() => window.matchMedia("(max-width: 767px)").matches);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsPhone(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isPhone;
}

function ProjectsPage() {
  const isPhone = usePhoneLayout();
  const helixProjects = projects.map((project) => ({
    ...project,
    preview: project.cardPreview,
    href: project.detail ?? `/projects/${project.id}`,
  }));

  return (
    <section id="projects" className="project-index has-stage-title project-dna-page" aria-labelledby="project-dna-title">
      <div className="project-dna-shell section-shell">
        <header className="project-dna-heading">
          <h1 id="project-dna-title">项目索引</h1>
          <p>{projects.length} 个持续生长的项目</p>
        </header>
        {isPhone ? (
          <MobileProjectGrid projects={helixProjects} />
        ) : (
          <Suspense fallback={<div className="project-helix-loading" aria-hidden="true" />}>
            <ProjectHelix projects={helixProjects} />
          </Suspense>
        )}
      </div>
    </section>
  );
}

function MobileProjectGrid({ projects: mobileProjects }: { projects: Array<Project & { href: string; preview: ProjectPreview }> }) {
  return (
    <div className={`index-items project-cloud project-helix project-cloud-count-${mobileProjects.length}`} data-reduced-motion="true">
      <div className="project-helix-nodes" role="list">
        {mobileProjects.map((project) => (
          <article className="index-item helix-node" data-project-id={project.id} role="listitem" key={project.id}>
            <Link className="project-card-link" to={project.href}>
              <div className="project-card-kinetic">
                <div className="project-card-float">
                  <div className={`project-card-surface helix-poster-card project-card-${project.category}`}>
                    <div className="project-card-media">
                      <img
                        src={project.preview.image}
                        alt=""
                        width={project.preview.width}
                        height={project.preview.height}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="helix-poster-caption">
                      <span>{project.kind}</span>
                      <div>
                        <h2>{project.title}</h2>
                        <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

type ProjectDossierTab = "overview" | "build" | "result";

const projectDossierTabs: Array<{ id: ProjectDossierTab; label: string }> = [
  { id: "overview", label: "概览" },
  { id: "build", label: "实现" },
  { id: "result", label: "成果" },
];

function projectHref(project: Project) {
  return project.detail ?? `/projects/${project.id}`;
}

const flagshipScenes = [
  { id: "overview", label: "概览" },
  { id: "flow", label: "闭环" },
  { id: "interface", label: "界面" },
  { id: "delivery", label: "交付" },
] as const;

type FlagshipSceneId = (typeof flagshipScenes)[number]["id"];

function FlagshipSceneRail({
  activeScene,
  onSelect,
}: {
  activeScene: FlagshipSceneId;
  onSelect: (scene: FlagshipSceneId) => void;
}) {
  return (
    <nav className="flagship-scene-rail" aria-label="项目案例章节">
      {flagshipScenes.map((scene) => (
        <button
          key={scene.id}
          type="button"
          className={activeScene === scene.id ? "is-active" : ""}
          aria-current={activeScene === scene.id ? "page" : undefined}
          onClick={() => onSelect(scene.id)}
        >
          <span aria-hidden="true" />
          <strong>{scene.label}</strong>
        </button>
      ))}
    </nav>
  );
}

function FlagshipProductTour({
  study,
  activeShotIndex,
  onSelectShot,
}: {
  study: FlagshipCaseStudy;
  activeShotIndex: number;
  onSelectShot: (shotIndex: number) => void;
}) {
  const [previewShotIndex, setPreviewShotIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const displayedShotIndex = previewShotIndex ?? activeShotIndex;
  const activeShot = study.tourShots[displayedShotIndex] ?? study.tourShots[0];

  useEffect(() => {
    setPreviewShotIndex(null);
  }, [activeShotIndex]);

  useEffect(() => {
    study.tourShots.forEach((shot) => {
      const image = new Image();
      if (shot.srcSet) image.srcset = shot.srcSet;
      image.sizes = "(max-width: 1080px) calc(100vw - 40px), min(66vw, 1040px)";
      image.src = shot.image;
    });
  }, [study.tourShots]);

  return (
    <div
      className="flagship-tour-layout"
      style={{ "--flagship-tour-count": study.tourShots.length } as CSSProperties}
    >
      <figure className="flagship-tour-visual">
        <div className="flagship-tour-screen">
          <AnimatePresence initial={false}>
            <motion.img
              key={activeShot.id}
              className={activeShot.fit === "contain" ? "is-contain" : ""}
              src={activeShot.image}
              srcSet={activeShot.srcSet}
              sizes="(max-width: 1080px) calc(100vw - 40px), min(66vw, 1040px)"
              alt={activeShot.alt}
              width={activeShot.width}
              height={activeShot.height}
              style={{ objectPosition: activeShot.position }}
              initial={reduceMotion ? false : { opacity: 0, scale: 1.018, filter: "blur(7px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.988, filter: "blur(5px)" }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              loading="lazy"
              decoding="async"
            />
          </AnimatePresence>
        </div>
        <figcaption aria-live="polite">
          <span>{activeShot.label}</span>
          <strong>{activeShot.title}</strong>
        </figcaption>
      </figure>

      <div className="flagship-tour-steps" role="list" aria-label="真实界面列表">
        {study.tourShots.map((shot, shotIndex) => (
          <motion.button
            key={shot.id}
            type="button"
            role="listitem"
            className={displayedShotIndex === shotIndex ? "is-active" : ""}
            aria-pressed={activeShotIndex === shotIndex}
            data-tour-shot-index={shotIndex}
            onClick={() => {
              setPreviewShotIndex(null);
              onSelectShot(shotIndex);
            }}
            onFocus={() => setPreviewShotIndex(shotIndex)}
            onBlur={() => setPreviewShotIndex(null)}
            onPointerEnter={() => setPreviewShotIndex(shotIndex)}
            onPointerLeave={() => setPreviewShotIndex(null)}
          >
            <span>{shot.label}</span>
            <strong>{shot.title}</strong>
            <p>{shot.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function FlagshipCaseStudyPage({ projectId }: { projectId: FlagshipCaseStudy["projectId"] }) {
  const storyRef = useRef<HTMLDivElement>(null);
  const [activeScene, setActiveScene] = useState<FlagshipSceneId>("overview");
  const [activeShotIndex, setActiveShotIndex] = useState(0);
  const project = projects.find((item) => item.id === projectId);
  const study = flagshipCaseStudies[projectId];
  const nextProject = projects.find((item) => item.id === study.nextProjectId);
  const nextStudy = flagshipCaseStudies[study.nextProjectId];
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ container: storyRef });

  useMotionValueEvent(scrollYProgress, "change", () => {
    const story = storyRef.current;
    if (!story) return;
    const viewportHeight = story.clientHeight;
    if (viewportHeight <= 0) return;

    const interfaceStart = 2;
    const deliveryStart = interfaceStart + study.tourShots.length;
    const storyPosition = story.scrollTop / viewportHeight;
    const nextScene: FlagshipSceneId = storyPosition < 0.5
      ? "overview"
      : storyPosition < 1.5
        ? "flow"
        : storyPosition < deliveryStart - 0.5
          ? "interface"
          : "delivery";
    const nextShotIndex = Math.min(
      study.tourShots.length - 1,
      Math.max(0, Math.round(storyPosition - interfaceStart)),
    );

    setActiveScene((current) => current === nextScene ? current : nextScene);
    setActiveShotIndex((current) => current === nextShotIndex ? current : nextShotIndex);
  });

  if (!project || !nextProject) return <NotFoundPage />;

  function selectScene(scene: FlagshipSceneId) {
    const story = storyRef.current;
    if (!story) return;
    const scenePosition: Record<FlagshipSceneId, number> = {
      overview: 0,
      flow: 1,
      interface: 2,
      delivery: 2 + study.tourShots.length,
    };
    setActiveScene(scene);
    if (scene === "interface") setActiveShotIndex(0);
    story.scrollTo({
      top: story.clientHeight * scenePosition[scene],
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  function selectTourShot(shotIndex: number) {
    const story = storyRef.current;
    if (!story) return;
    const nextShotIndex = Math.min(study.tourShots.length - 1, Math.max(0, shotIndex));
    setActiveScene("interface");
    setActiveShotIndex(nextShotIndex);
    story.scrollTo({
      top: story.clientHeight * (2 + nextShotIndex),
      behavior: "auto",
    });
  }

  return (
    <article
      className="flagship-case-page"
      data-flagship-project={project.id}
      aria-labelledby="flagship-case-title"
    >
      <motion.div
        className="flagship-reading-progress"
        style={{ scaleX: scrollYProgress }}
        aria-hidden="true"
      />

      <div ref={storyRef} className="flagship-story">
        <section className="flagship-scene flagship-overview flagship-hero" data-flagship-scene="overview">
          <div className="flagship-case-shell flagship-overview-shell">
            <header className="flagship-topline">
              <Link className="flagship-back" to="/projects">
                <ArrowLeft size={16} weight="bold" aria-hidden="true" /> 项目索引
              </Link>
              <p>{project.kind} / {project.status} / {project.year}</p>
            </header>

            <div className="flagship-hero-layout">
              <motion.div
                className="flagship-hero-copy"
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 id="flagship-case-title">{project.title}</h1>
                <p className="flagship-hero-summary">{project.description}</p>
                <div className="flagship-hero-actions">
                  {project.site ? (
                    <ExternalLink className="flagship-action is-primary" href={project.site}>
                      在线版本 <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
                    </ExternalLink>
                  ) : null}
                  {project.repo ? (
                    <ExternalLink className="flagship-action is-secondary" href={project.repo}>
                      公开源码 <GithubLogo size={16} weight="fill" aria-hidden="true" />
                    </ExternalLink>
                  ) : null}
                </div>
              </motion.div>

              <motion.figure
                className="flagship-hero-figure"
                initial={reduceMotion ? false : { opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                transition={{ duration: 0.72, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <img
                  className={study.heroShot.fit === "contain" ? "is-contain" : ""}
                  src={study.heroShot.image}
                  srcSet={study.heroShot.srcSet}
                  sizes="(max-width: 1080px) calc(100vw - 40px), min(62vw, 960px)"
                  alt={study.heroShot.alt}
                  width={study.heroShot.width}
                  height={study.heroShot.height}
                  style={{ objectPosition: study.heroShot.position }}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
                <figcaption>
                  <span>{study.heroShot.label}</span>
                  <strong>{study.heroShot.title}</strong>
                </figcaption>
              </motion.figure>
            </div>

            <dl className="flagship-facts">
              {study.facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="flagship-scene flagship-flow-scene" data-flagship-scene="flow" aria-labelledby="flagship-flow-title">
          <div className="flagship-case-shell flagship-flow-shell">
            <header className="flagship-section-heading">
              <h2 id="flagship-flow-title">{study.flowTitle}</h2>
            </header>

            <div className="flagship-problem-grid">
              <div className="flagship-statement">
                <strong>{study.statement}</strong>
                <p>{study.overview}</p>
              </div>
              <div className="flagship-flow-track">
                {study.flow.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.45 }}
                    transition={{ duration: 0.35, delay: reduceMotion ? 0 : index * 0.045, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    {index < study.flow.length - 1 ? <ArrowRight size={16} weight="bold" aria-hidden="true" /> : null}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="flagship-scene flagship-interface-scene"
          data-flagship-scene="interface"
          aria-labelledby="flagship-tour-title"
          style={{
            "--flagship-tour-height": `${study.tourShots.length * 100}%`,
            "--flagship-tour-pin-height": `${100 / study.tourShots.length}%`,
          } as CSSProperties}
        >
          <div className="flagship-interface-pin">
            <div className="flagship-case-shell flagship-interface-shell">
              <header className="flagship-section-heading">
                <h2 id="flagship-tour-title">真实界面与完整使用路径</h2>
              </header>
              <FlagshipProductTour
                study={study}
                activeShotIndex={activeShotIndex}
                onSelectShot={selectTourShot}
              />
            </div>
          </div>
        </section>

        <section className="flagship-scene flagship-delivery-scene" data-flagship-scene="delivery" aria-labelledby="flagship-decisions-title">
          <div className="flagship-case-shell flagship-delivery-shell">
            <header className="flagship-section-heading flagship-delivery-heading">
              <h2 id="flagship-decisions-title">{study.decisionsTitle}</h2>
              <p>{study.decisionsIntro}</p>
            </header>

            <div className="flagship-delivery-layout">
              <div className="flagship-decision-grid">
                {study.decisions.map((decision, index) => (
                  <motion.article
                    key={decision.title}
                    initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.38, delay: reduceMotion ? 0 : index * 0.045, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h3>{decision.title}</h3>
                    <p>{decision.description}</p>
                    <span>{decision.note}</span>
                  </motion.article>
                ))}
              </div>

              <aside className="flagship-result" aria-labelledby="flagship-result-title">
                <div className="flagship-result-intro">
                  <h2 id="flagship-result-title">{study.resultTitle}</h2>
                  <p>{study.resultBody}</p>
                </div>
                <div className="flagship-result-grid">
                  {study.results.map((result) => (
                    <div key={`${result.value}-${result.label}`}>
                      <strong>{result.value}</strong>
                      <span>{result.label}</span>
                      <p>{result.detail}</p>
                    </div>
                  ))}
                </div>
                {study.resultNote ? <p className="flagship-result-note">{study.resultNote}</p> : null}
                <div className="flagship-result-actions">
                  {project.site ? (
                    <ExternalLink className="flagship-action is-primary" href={project.site}>
                      在线版本 <GlobeHemisphereWest size={16} weight="bold" aria-hidden="true" />
                    </ExternalLink>
                  ) : null}
                  {project.repo ? (
                    <ExternalLink className="flagship-action is-secondary" href={project.repo}>
                      公开源码 <GithubLogo size={16} weight="fill" aria-hidden="true" />
                    </ExternalLink>
                  ) : null}
                </div>
                <Link className="flagship-next" to={projectHref(nextProject)}>
                  <span>下一个主推项目</span>
                  <strong>{nextProject.title}</strong>
                  <figure>
                    <img
                      src={nextStudy.heroShot.image}
                      srcSet={nextStudy.heroShot.srcSet}
                      sizes="300px"
                      alt=""
                      width={nextStudy.heroShot.width}
                      height={nextStudy.heroShot.height}
                      loading="lazy"
                      decoding="async"
                    />
                    <ArrowRight size={22} weight="bold" aria-hidden="true" />
                  </figure>
                </Link>
              </aside>
            </div>
          </div>
        </section>
      </div>

      <FlagshipSceneRail activeScene={activeScene} onSelect={selectScene} />
    </article>
  );
}

function ProjectDossierPage({ projectId: fixedProjectId }: { projectId?: string }) {
  const params = useParams();
  const project = projects.find((item) => item.id === (fixedProjectId ?? params.projectId));
  const [activeTab, setActiveTab] = useState<ProjectDossierTab>("overview");
  const reduceMotion = useReducedMotion();

  if (!project) return <NotFoundPage />;

  const projectIndex = projects.indexOf(project);
  const previousProject = projects[(projectIndex - 1 + projects.length) % projects.length];
  const nextProject = projects[(projectIndex + 1) % projects.length];
  const visual = project.preview ?? project.cardPreview;
  const hasSystemsView = project.category === "system" || project.id === "mineradio";

  function moveTab(direction: -1 | 1) {
    const currentIndex = projectDossierTabs.findIndex((tab) => tab.id === activeTab);
    const nextIndex = (currentIndex + direction + projectDossierTabs.length) % projectDossierTabs.length;
    const nextTab = projectDossierTabs[nextIndex];
    setActiveTab(nextTab.id);
    window.requestAnimationFrame(() => document.getElementById(`project-tab-${nextTab.id}`)?.focus());
  }

  return (
    <section
      className="project-dossier-page"
      data-project-dossier={project.id}
      data-project-category={project.category}
      aria-labelledby="project-dossier-title"
    >
      <div className="project-dossier section-shell">
        <aside className="project-dossier-info">
          <Link className="project-dossier-back" to="/projects">
            <ArrowLeft size={17} weight="bold" /> 项目索引
          </Link>

          <motion.header
            className="project-dossier-heading"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
          >
            <p>{project.kind}</p>
            <h1 id="project-dossier-title">{project.title}</h1>
            <p className="project-dossier-summary">{project.description}</p>
          </motion.header>

          <div className="project-dossier-meta">
            <dl>
              <div><dt>状态</dt><dd>{project.status}</dd></div>
              <div><dt>年份</dt><dd>{project.year}</dd></div>
            </dl>
            <div className="project-dossier-tags" aria-label={`${project.title} 技术栈`}>
              {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <ProjectLinks project={project} includeDetail={false} />
          </div>
        </aside>

        <motion.figure
          className="project-dossier-figure"
          initial={reduceMotion ? false : { opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.72, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="project-dossier-media"
            data-visual-source={project.preview ? "interface" : "cover"}
            onPointerMove={trackPointerGlow}
            onPointerLeave={resetPointerGlow}
          >
            <img
              className={visual.fit === "contain" ? "is-contain" : ""}
              src={visual.image}
              srcSet={visual.srcSet}
              sizes={visual.sizes ?? "(max-width: 1080px) calc(100vw - 72px), min(46vw, 690px)"}
              alt={visual.alt}
              width={visual.width}
              height={visual.height}
              style={{ objectPosition: visual.position }}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
          <figcaption>
            <span>{project.preview ? "真实界面" : "项目概念封面"}</span>
            <nav aria-label="相邻项目">
              <Link to={projectHref(previousProject)} title={`上一个项目：${previousProject.title}`}>
                <ArrowLeft size={17} weight="bold" />
                <span className="sr-only">上一个项目：{previousProject.title}</span>
              </Link>
              <Link to={projectHref(nextProject)} title={`下一个项目：${nextProject.title}`}>
                <ArrowRight size={17} weight="bold" />
                <span className="sr-only">下一个项目：{nextProject.title}</span>
              </Link>
            </nav>
          </figcaption>
        </motion.figure>

        <section className="project-dossier-story" aria-label={`${project.title} 项目说明`}>
          <div
            className="project-dossier-tabs"
            role="tablist"
            aria-label="项目说明视图"
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveTab(-1);
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                moveTab(1);
              }
            }}
          >
            {projectDossierTabs.map((tab) => (
              <button
                key={tab.id}
                id={`project-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`project-panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="project-dossier-panel-frame">
            <AnimatePresence mode="wait" initial={false}>
              <motion.article
                key={activeTab}
                id={`project-panel-${activeTab}`}
                className={`project-dossier-panel is-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`project-tab-${activeTab}`}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTab === "overview" ? (
                  <div className="project-dossier-overview">
                    <section>
                      <span>要解决的问题</span>
                      <p>{project.story.problem}</p>
                    </section>
                    <section>
                      <span>采取的方法</span>
                      <p>{project.story.approach}</p>
                    </section>
                    <section>
                      <span>形成的结果</span>
                      <p>{project.story.outcome}</p>
                    </section>
                  </div>
                ) : null}

                {activeTab === "build" ? (
                  <div className="project-dossier-build">
                    <p>{project.story.approach}</p>
                    <ol>
                      {project.story.highlights.map((highlight) => (
                        <li key={highlight.title}>
                          <strong>{highlight.title}</strong>
                          <p>{highlight.description}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                {activeTab === "result" ? (
                  <div className="project-dossier-result">
                    <p>{project.story.outcome}</p>
                    <dl>
                      <div><dt>交付形态</dt><dd>{project.kind}</dd></div>
                      <div><dt>当前状态</dt><dd>{project.status}</dd></div>
                      <div><dt>技术构成</dt><dd>{project.tags.join(" / ")}</dd></div>
                    </dl>
                    <div className="project-dossier-result-links">
                      {project.site ? (
                        <ExternalLink href={project.site}>打开在线版本 <ArrowUpRight size={16} weight="bold" /></ExternalLink>
                      ) : null}
                      {project.repo ? (
                        <ExternalLink href={project.repo}>查看公开源码 <ArrowUpRight size={16} weight="bold" /></ExternalLink>
                      ) : null}
                      {hasSystemsView ? (
                        <Link to="/systems">查看服务器结构 <ArrowRight size={16} weight="bold" /></Link>
                      ) : null}
                      {!project.site && !project.repo && !hasSystemsView ? (
                        <span><LockKey size={16} weight="bold" /> 仅展示已公开的实现信息</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </motion.article>
            </AnimatePresence>
          </div>
        </section>
      </div>
    </section>
  );
}

function ServerTopology() {
  return (
    <>
      <Suspense fallback={<div className="server-three-loading" aria-label="正在加载服务器结构图" />}>
        <ServerExplodedStory categories={topologyCategories} facts={serverFacts} visualOnly />
      </Suspense>
      <MobileServerStory categories={topologyCategories} facts={serverFacts} />
    </>
  );
}

function SystemsPage() {
  return <ServerTopology />;
}

function AboutBlurText({ text, delay = 0 }: { text: string; delay?: number }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <span>{text}</span>;

  const revealDelay = Math.min(0.66, 0.05 + delay * 0.22);
  return (
    <span
      className="about-blur-text"
      style={{ "--about-reveal-delay": `${revealDelay}s` } as CSSProperties}
    >
      {text}
    </span>
  );
}

function AboutPage() {
  const reduceMotion = useReducedMotion();
  const [portraitReady, setPortraitReady] = useState(false);
  const reveal = reduceMotion ? false : { opacity: 0 };

  return (
    <div className="about-page">
      <section className="about-console section-shell" aria-labelledby="page-title">
        <div className="about-console-field" aria-hidden="true">
          <span className="about-field-track about-field-track-top" />
          <span className="about-field-track about-field-track-bottom" />
          <span className="about-field-pulse about-field-pulse-top" />
          <span className="about-field-pulse about-field-pulse-bottom" />
          <div className="about-console-topline">
            <span className="about-topline-index">01 / ABOUT</span>
            <span className="about-topline-rule" />
            <span className="about-topline-copy">PERSONAL OPERATING SYSTEM</span>
            <span className="about-topline-status"><i /> ONLINE / 2026</span>
          </div>
        </div>

        <motion.div
          className="about-console-intro"
          initial={reveal}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="about-console-kicker"><AboutBlurText text="考研中的个人开发者" delay={0.08} /></p>
          <h1 id="page-title"><AboutBlurText text="关于我" delay={0.16} /></h1>
          <p className="about-console-lead"><AboutBlurText text="一边准备研究生考试，一边把真实需求做成能长期运行的产品。" delay={0.32} /></p>
          <p className="about-console-summary"><AboutBlurText text="我从具体问题开始，自己完成界面、开发、部署和维护。比起短暂演示，我更在意产品能否真正被使用，并在几个月后依然稳定。" delay={0.64} /></p>

          <div className="about-console-story">
            <strong><AboutBlurText text="备考是现在的主线，做产品是长期习惯。" delay={1.02} /></strong>
            <p><AboutBlurText text="把学习中遇到的低效流程做成工具，也借这些项目持续训练产品判断、工程实现和维护能力。" delay={1.2} /></p>
          </div>

          <ul className="about-console-interests" aria-label="个人兴趣">
            <li><AboutBlurText text="数码桌搭" delay={1.54} /></li>
            <li><AboutBlurText text="健身" delay={1.65} /></li>
            <li><AboutBlurText text="穿搭" delay={1.74} /></li>
            <li><AboutBlurText text="硬件 DIY" delay={1.83} /></li>
          </ul>

          <div className="about-column-trace about-column-trace-intro" aria-hidden="true">
            <span className="about-trace-line about-trace-line-a" />
            <span className="about-trace-line about-trace-line-b" />
            <span className="about-trace-line about-trace-line-c" />
            <span className="about-trace-pulse" />
            <span className="about-trace-node about-trace-node-a" />
            <span className="about-trace-node about-trace-node-b" />
          </div>
        </motion.div>

        <motion.div
          className="about-console-visual"
          initial={reduceMotion ? false : { opacity: 0, scale: 1.018 }}
          animate={portraitReady || reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.018 }}
          transition={{ duration: reduceMotion ? 0 : 0.68, ease: [0.22, 1, 0.36, 1] }}
        >
          <figure className="about-console-portrait">
            <img
              src="/assets/about-avatar-three-quarter.webp"
              srcSet="/assets/about-avatar-three-quarter-768.webp 768w, /assets/about-avatar-three-quarter.webp 1024w"
              sizes="(max-width: 1360px) 34vw, 500px"
              alt="ljj 三分之四侧面的虚拟开发者形象"
              width={1024}
              height={1024}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onLoad={() => setPortraitReady(true)}
            />
          </figure>
          <div className="about-console-signal" aria-hidden="true">
            <span className="about-signal-rail about-signal-rail-top" />
            <span className="about-signal-rail about-signal-rail-middle" />
            <span className="about-signal-rail about-signal-rail-bottom" />
            <span className="about-signal-pulse about-signal-pulse-a" />
            <span className="about-signal-pulse about-signal-pulse-b" />
            <span className="about-signal-kink about-signal-kink-left" />
            <span className="about-signal-kink about-signal-kink-right" />
            <span className="about-signal-node about-signal-node-left" />
            <span className="about-signal-node about-signal-node-center" />
            <span className="about-signal-node about-signal-node-right" />
          </div>
        </motion.div>

        <motion.div
          className="about-console-detail"
          initial={reveal}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.56, delay: reduceMotion ? 0 : 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          <section className="about-console-method" aria-labelledby="about-method-title">
            <div className="about-console-heading">
              <h2 id="about-method-title"><AboutBlurText text="我怎样把事情做完" delay={0.18} /></h2>
              <span><AboutBlurText text="从问题到运行状态" delay={0.42} /></span>
            </div>
            <ol>
              <li><Books size={22} weight="duotone" aria-hidden="true" /><div><strong><AboutBlurText text="先看完整流程" delay={0.58} /></strong><p><AboutBlurText text="找到第一步之后真正会卡住的环节。" delay={0.72} /></p></div></li>
              <li><Code size={22} weight="duotone" aria-hidden="true" /><div><strong><AboutBlurText text="用真实界面验证" delay={0.9} /></strong><p><AboutBlurText text="跨 Web 与原生端实现，再用测试校正。" delay={1.04} /></p></div></li>
              <li><CloudArrowUp size={22} weight="duotone" aria-hidden="true" /><div><strong><AboutBlurText text="把上线算进设计" delay={1.22} /></strong><p><AboutBlurText text="域名、权限、监控和备份都属于产品。" delay={1.36} /></p></div></li>
            </ol>
          </section>

          <section className="about-console-capabilities" aria-labelledby="about-capabilities-title">
            <div className="about-console-heading">
              <h2 id="about-capabilities-title"><AboutBlurText text="我能做的部分" delay={1.62} /></h2>
              <span><AboutBlurText text="清楚、可靠、可维护" delay={1.84} /></span>
            </div>
            <div className="about-console-capability-grid">
              <div><Browser size={20} weight="duotone" aria-hidden="true" /><span><AboutBlurText text="产品界面" delay={2.02} /></span><strong><AboutBlurText text="Web / SwiftUI / ArkTS" delay={2.14} /></strong></div>
              <div><Robot size={20} weight="duotone" aria-hidden="true" /><span><AboutBlurText text="AI 接入" delay={2.24} /></span><strong><AboutBlurText text="SSE / API / 工作流" delay={2.34} /></strong></div>
              <div><Database size={20} weight="duotone" aria-hidden="true" /><span><AboutBlurText text="服务系统" delay={2.44} /></span><strong><AboutBlurText text="Python / FastAPI" delay={2.54} /></strong></div>
              <div><HardDrives size={20} weight="duotone" aria-hidden="true" /><span><AboutBlurText text="运行维护" delay={2.64} /></span><strong><AboutBlurText text="Docker / Tailscale" delay={2.74} /></strong></div>
            </div>
          </section>

          <div className="about-column-trace about-column-trace-detail" aria-hidden="true">
            <span className="about-trace-line about-trace-line-a" />
            <span className="about-trace-line about-trace-line-b" />
            <span className="about-trace-line about-trace-line-c" />
            <span className="about-trace-pulse" />
            <span className="about-trace-node about-trace-node-a" />
            <span className="about-trace-node about-trace-node-b" />
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function NotFoundPage() {
  return (
    <section className="page-lead not-found section-shell" aria-labelledby="page-title">
      <h1 id="page-title">这个页面不存在。</h1>
      <p>地址可能已经变化，可以回到项目索引继续查看。</p>
      <Link className="button button-primary" to="/projects">
        <span>查看项目</span><span className="button-arrow"><ArrowRight size={18} weight="bold" /></span>
      </Link>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <section className="contact-plate section-shell" aria-labelledby="contact-title">
        <p className="section-kicker">Contact</p>
        <h2 id="contact-title">需要从界面做到上线的项目，可以从这里开始。</h2>
        <ExternalLink className="contact-link" href="https://github.com/lij768423-svg">
          <span>[</span> 在 GitHub 联系 <ArrowUpRight size={24} weight="bold" /> <span>]</span>
        </ExternalLink>
      </section>
    </footer>
  );
}

const pageMetadata: Record<string, { title: string; description: string; image: string }> = {
  "/": {
    title: "lij768423-svg | 独立开发者",
    description: "学习产品、AI 客户端、客户项目与个人基础设施作品集。",
    image: "/assets/virtual-developer-avatar-light.webp",
  },
  "/projects": {
    title: "项目索引 | lij768423-svg",
    description: "查看公开产品、客户交付、开发者工具与自托管系统。",
    image: "/assets/agent-console-branches.webp",
  },
  "/projects/408": {
    title: "408 刷题库案例 | lij768423-svg",
    description: "从作答、错题到间隔复习与知识沉淀的完整学习产品案例。",
    image: "/assets/408-dashboard.webp",
  },
  "/projects/hermes-ios": {
    title: "Hermes for iOS 案例 | lij768423-svg",
    description: "从 ArkTS 到 SwiftUI 的个人 AI 客户端迁移与体验重构。",
    image: "/assets/ioschat.webp",
  },
  "/projects/law-site": {
    title: "根旺律所数字站案例 | lij768423-svg",
    description: "机构官网、在线咨询、AI 摘要、人工接管与 CMS 后台的真实交付。",
    image: "/assets/law-home.webp",
  },
  "/projects/harmonyos": {
    title: "408 for HarmonyOS 案例 | lij768423-svg",
    description: "面向 HarmonyOS NEXT 的离线原生刷题体验。",
    image: "/assets/408-harmony.webp",
  },
  "/systems": {
    title: "我的服务器 | lij768423-svg",
    description: "了解我的自建 Linux 服务器如何承载开发、AI、个人数据、公开服务、监控与备份。",
    image: "/assets/tailscale-latency.webp",
  },
  "/about": {
    title: "关于 | lij768423-svg",
    description: "考研中的个人开发者，持续构建学习产品、AI 客户端与个人基础设施。",
    image: "/assets/virtual-developer-avatar-light.webp",
  },
};

function getPageMetadata(pathname: string) {
  const exact = pageMetadata[pathname];
  if (exact) return exact;

  const project = projects.find((item) => item.detail === pathname || `/projects/${item.id}` === pathname);
  if (project) {
    return {
      title: `${project.title} | lij768423-svg`,
      description: project.description,
      image: project.preview?.image ?? "/assets/408-quiz.webp",
    };
  }

  return {
    title: "页面不存在 | lij768423-svg",
    description: "返回作品集项目索引继续浏览。",
    image: "/assets/408-quiz.webp",
  };
}

function PageMeta() {
  const location = useLocation();

  useEffect(() => {
    const metadata = getPageMetadata(location.pathname);
    document.title = metadata.title;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", metadata.description);
    document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute("content", metadata.title);
    document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute("content", metadata.description);
    document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.setAttribute("content", metadata.image);
  }, [location.pathname]);

  return null;
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

function PortfolioRoutes({
  theme,
  trailEnabled,
  onThemeChange,
  onTrailChange,
}: {
  theme: ThemeMode;
  trailEnabled: boolean;
  onThemeChange: () => void;
  onTrailChange: () => void;
}) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const isAbout = location.pathname === "/about";

  useEffect(() => {
    document.body.classList.toggle("systems-page", location.pathname === "/systems");
    return () => {
      document.body.classList.remove("systems-page");
    };
  }, [location.pathname]);

  return (
    <>
      <PageMeta />
      <ScrollToTop />
      <GlobalPixelTrail enabled={trailEnabled} />
      <GlobalFlowingLights key={location.pathname} deferred={isAbout} />
      <Header
        theme={theme}
        trailEnabled={trailEnabled}
        onThemeChange={onThemeChange}
        onTrailChange={onTrailChange}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          className={`route-main${location.pathname === "/systems" ? " is-systems-route" : ""}`}
          initial={reduceMotion || isAbout ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion || isAbout ? undefined : { opacity: 0, y: -8 }}
          transition={reduceMotion || isAbout ? { duration: 0 } : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <Routes location={location.pathname}>
            <Route path="/"><HomePage theme={theme} /></Route>
            <Route path="/projects"><ProjectsPage /></Route>
            <Route path="/projects/408"><FlagshipCaseStudyPage projectId="408-web" /></Route>
            <Route path="/projects/hermes-ios"><ProjectDossierPage projectId="ioschat" /></Route>
            <Route path="/projects/law-site"><FlagshipCaseStudyPage projectId="law-site" /></Route>
            <Route path="/projects/harmonyos"><ProjectDossierPage projectId="408-harmony" /></Route>
            <Route path="/projects/:projectId"><ProjectDossierPage /></Route>
            <Route path="/systems"><SystemsPage /></Route>
            <Route path="/about"><AboutPage /></Route>
            <Route><NotFoundPage /></Route>
          </Routes>
        </motion.main>
      </AnimatePresence>
    </>
  );
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return window.localStorage.getItem("portfolio-color-mode") === "dark" ? "dark" : "light";
  });
  const [trailEnabled, setTrailEnabled] = useState(() => {
    return window.localStorage.getItem("portfolio-pointer-trail") !== "off";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("portfolio-color-mode", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("portfolio-pointer-trail", trailEnabled ? "on" : "off");
  }, [trailEnabled]);

  function toggleTheme() {
    setTheme((current) => current === "light" ? "dark" : "light");
  }

  function toggleTrail() {
    setTrailEnabled((current) => !current);
  }

  return (
    <BrowserRouter>
      <PortfolioRoutes
        theme={theme}
        trailEnabled={trailEnabled}
        onThemeChange={toggleTheme}
        onTrailChange={toggleTrail}
      />
    </BrowserRouter>
  );
}

export default App;
