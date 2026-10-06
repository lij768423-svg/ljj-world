import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { Books } from "@phosphor-icons/react/Books";
import { Browser } from "@phosphor-icons/react/Browser";
import { ChatCircleDots } from "@phosphor-icons/react/ChatCircleDots";
import { Code } from "@phosphor-icons/react/Code";
import { Cpu } from "@phosphor-icons/react/Cpu";
import { DeviceMobile } from "@phosphor-icons/react/DeviceMobile";
import { GithubLogo } from "@phosphor-icons/react/GithubLogo";
import { GlobeHemisphereWest } from "@phosphor-icons/react/GlobeHemisphereWest";
import { HardDrives } from "@phosphor-icons/react/HardDrives";
import { Moon } from "@phosphor-icons/react/Moon";
import { MouseSimple } from "@phosphor-icons/react/MouseSimple";
import { Robot } from "@phosphor-icons/react/Robot";
import { ShareNetwork } from "@phosphor-icons/react/ShareNetwork";
import { SquaresFour } from "@phosphor-icons/react/SquaresFour";
import { Sun } from "@phosphor-icons/react/Sun";
import { Translate } from "@phosphor-icons/react/Translate";
import { X } from "@phosphor-icons/react/X";
import { animate, AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Link, Route, Router as BrowserRouter, Switch as Routes, useLocation as useWouterLocation } from "wouter";
import { BlurText } from "./components/effects/BlurText";
import { DecryptedText } from "./components/effects/DecryptedText";
import { GlobalFlowingLights } from "./components/effects/GlobalFlowingLights";
import { GlobalPixelTrail } from "./components/effects/GlobalPixelTrail";
import { Magnetic } from "./components/effects/Magnetic";
import { SceneLineOrnaments } from "./components/effects/SceneLineOrnaments";
import { InteractivePortrait } from "./components/InteractivePortrait";
import type { CircularGalleryItem } from "./components/CircularGallery";
import type { FlowingMenuItemData } from "./components/FlowingMenu";
import { PortfolioLanguageProvider, translatePortfolioText, usePortfolioLanguage } from "./i18n/PortfolioLanguage";
import { blogPosts, getBlogPost } from "./blog";
import { optimizedCovers } from "./assets/optimizedCovers";

const loadProjectHelix = () => import("./components/ProjectHelix").then((module) => ({ default: module.ProjectHelix }));
export const ProjectHelix = lazy(loadProjectHelix);
const FlowingMenu = lazy(() => import("./components/FlowingMenu").then((module) => ({ default: module.FlowingMenu })));
const loadCircularGallery = () => import("./components/CircularGallery");
const loadProjectPages = () => import("./pages/ProjectPages");
const loadSystemsPage = () => import("./pages/SystemsPage");
const loadAboutPage = () => import("./pages/AboutPage");
const loadDeskArchivePage = () => import("./pages/DeskArchivePage");
const loadBlogPages = () => import("./components/BlogPages");
const ProjectsPage = lazy(() => loadProjectPages().then((module) => ({ default: module.ProjectsPage })));
const FlagshipCaseStudyPage = lazy(() => loadProjectPages().then((module) => ({ default: module.FlagshipCaseStudyPage })));
const ProjectDossierPage = lazy(() => loadProjectPages().then((module) => ({ default: module.ProjectDossierPage })));
const SystemsPage = lazy(() => loadSystemsPage().then((module) => ({ default: module.SystemsPage })));
const AboutPage = lazy(() => loadAboutPage().then((module) => ({ default: module.AboutPage })));
const DeskArchivePage = lazy(() => loadDeskArchivePage().then((module) => ({ default: module.DeskArchivePage })));
const BlogPage = lazy(() => loadBlogPages().then((module) => ({ default: module.BlogPage })));
const BlogArticlePage = lazy(() => loadBlogPages().then((module) => ({ default: module.BlogArticlePage })));
const routeChunkLoaders = [loadProjectPages, loadSystemsPage, loadAboutPage, loadDeskArchivePage, loadBlogPages];
const prefetchRoute = (load: () => Promise<unknown>) => { void load().catch(() => undefined); };
const deskGalleryPreloads = new Map<string, HTMLImageElement>();
const projectCardPreloads = new Map<string, HTMLImageElement>();
const blogImagePreloads = new Map<string, HTMLImageElement>();

function preloadProjectCardImages() {
  if (typeof Image === "undefined") return;
  projects.forEach((project) => {
    const preview = project.cardPreview;
    if (projectCardPreloads.has(preview.image)) return;
    const image = new Image();
    image.decoding = "async";
    image.fetchPriority = "low";
    if (preview.srcSet) image.srcset = preview.srcSet;
    if (preview.sizes) image.sizes = preview.sizes;
    image.src = preview.image;
    void image.decode().catch(() => undefined);
    projectCardPreloads.set(preview.image, image);
  });
}

const preloadProjectsPage = () => {
  prefetchRoute(loadProjectPages);
  void loadProjectHelix();
  preloadProjectCardImages();
};

function preloadBlogImages() {
  prefetchRoute(loadBlogPages);
  if (typeof Image === "undefined") return;
  blogPosts.slice(0, 1).forEach((post) => {
    if (blogImagePreloads.has(post.image)) return;
    const image = new Image();
    image.decoding = "async";
    image.fetchPriority = "low";
    if (post.srcSet) image.srcset = post.srcSet;
    image.sizes = "(max-width: 760px) calc(100vw - 32px), (max-width: 980px) max(44vw, 640px), max(32vw, calc(160vh - 420px))";
    image.src = post.image;
    void image.decode().catch(() => undefined);
    blogImagePreloads.set(post.image, image);
  });
}

function preloadDeskGalleryImages() {
  if (typeof Image === "undefined") return;
  [...homeGalleryItems, ...schoolGalleryItems].forEach((item) => {
    if (deskGalleryPreloads.has(item.image)) return;
    const image = new Image();
    image.decoding = "async";
    image.src = item.image;
    deskGalleryPreloads.set(item.image, image);
  });
}

const preloadCircularGallery = () => {
  prefetchRoute(loadDeskArchivePage);
  void loadCircularGallery().then((module) => module.prewarmCircularGallery());
  preloadDeskGalleryImages();
};
export const CircularGallery = lazy(loadCircularGallery);

const flowingMenuImages = [
  "/assets/flowing-menu/home.webp",
  "/assets/flowing-menu/projects.webp",
  "/assets/flowing-menu/server.webp",
  "/assets/flowing-menu/desk.webp",
  "/assets/writing-studio-github.webp",
  "/assets/flowing-menu/about.webp",
];

const flowingMenuItems: FlowingMenuItemData[] = [
  { href: "/", label: "Home", ariaLabel: "Home - 首页", images: flowingMenuImages },
  { href: "/projects", label: "Projects", ariaLabel: "Projects - 全部项目", images: [...flowingMenuImages.slice(1), flowingMenuImages[0]] },
  { href: "/systems", label: "Server", ariaLabel: "Server - 我的服务器", images: [...flowingMenuImages.slice(2), ...flowingMenuImages.slice(0, 2)] },
  { href: "/desk", label: "Desk setup", ariaLabel: "Desk setup - 桌搭展示", images: [...flowingMenuImages.slice(3), ...flowingMenuImages.slice(0, 3)] },
  { href: "/blog", label: "Blog", ariaLabel: "Blog - 文章与笔记", images: [...flowingMenuImages.slice(4), ...flowingMenuImages.slice(0, 4)] },
  { href: "/about", label: "About", ariaLabel: "About - 关于", images: [...flowingMenuImages.slice(5), ...flowingMenuImages.slice(0, 5)] },
];

type Category = "product" | "ai" | "system";
export type ThemeMode = "light" | "dark";

function useLocation() {
  const [pathname] = useWouterLocation();
  return { pathname };
}

function NavLink({ to, end = false, children }: { to: string; end?: boolean; children: ReactNode }) {
  const { pathname } = useLocation();
  const warmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const warmRoute = to === "/projects"
    ? preloadProjectsPage
    : to === "/desk"
      ? preloadCircularGallery
      : to === "/blog"
        ? preloadBlogImages
        : to === "/about"
          ? () => prefetchRoute(loadAboutPage)
          : to === "/systems"
            ? () => prefetchRoute(loadSystemsPage)
            : undefined;
  const cancelWarmup = () => {
    if (warmTimeout.current !== null) clearTimeout(warmTimeout.current);
    warmTimeout.current = null;
  };
  useEffect(() => cancelWarmup, []);
  const requestWarmup = () => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string; downlink?: number } }).connection;
    if (active || connection?.saveData || /^(slow-2g|2g|3g)$/.test(connection?.effectiveType ?? "") || (connection?.downlink !== undefined && connection.downlink < 2)) return;
    cancelWarmup();
    warmTimeout.current = setTimeout(() => {
      warmTimeout.current = null;
      warmRoute?.();
    }, 140);
  };
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      onPointerEnter={(event) => { if (event.pointerType !== "touch") requestWarmup(); }}
      onPointerLeave={cancelWarmup}
      onPointerCancel={cancelWarmup}
      onFocus={requestWarmup}
      onBlur={cancelWarmup}
    >
      {children}
    </Link>
  );
}

export type ProjectPreview = {
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

export type Project = {
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
  liveDemo?: { url: string; label: string };
};

function projectCardPreview(id: string, title: string): ProjectPreview {
  const optimized = optimizedCovers[id as keyof typeof optimizedCovers];
  return {
    image: `/assets/project-covers/${id}.webp`,
    alt: `${title} AI 生成概念海报`,
    width: 1200,
    height: 750,
    ...(optimized ? { ...optimized, sizes: "(max-width: 680px) calc(100vw - 48px), 320px" } : {}),
  };
}

export const projects: Project[] = [
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
    title: "Mineradio Web 适配",
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
    cardPreview: projectCardPreview("mineradio", "Mineradio Web 适配"),
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
    id: "grok-register-panel",
    title: "Grok Register Panel",
    description: "把长链路浏览器任务、邮箱与代理池、失败恢复和运行统计收进一个实时控制面板。",
    category: "ai",
    kind: "自动化运维",
    status: "开源",
    year: "2026",
    tags: ["Python", "Camoufox", "Operations"],
    story: {
      problem: "浏览器自动化任务横跨邮箱验证码、代理出口和多阶段授权，单靠日志难以判断卡点和恢复进度。",
      approach: "以 Camoufox 执行任务，将代理预检、邮箱后端、批次编排、失败补录和时段统计连接到受令牌保护的 Web 面板。",
      outcome: "形成可启停、可观测、可恢复的长链路自动化控制面，并为代理与邮箱域名池保留独立状态。",
      highlights: [
        { title: "实时运行面板", description: "启停、并发、批次进度、时段成功率和账号补录集中在同一控制面。" },
        { title: "出口与域名治理", description: "代理池、ASN 预检、邮箱后端和域名轮换各自维护健康与冷却状态。" },
        { title: "失败恢复", description: "待处理授权可以补录并自动出队，编排器也会对卡死任务做有限重建。" },
      ],
    },
    repo: "https://github.com/lij768423-svg/grok-register-panel",
    detail: "/projects/grok-register-panel",
    icon: <Browser size={22} weight="duotone" />,
    cardPreview: {
      ...optimizedCovers["grok-register-panel"],
      sizes: "(max-width: 680px) calc(100vw - 48px), 320px",
      alt: "Grok Register Panel AI 生成概念海报",
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
    id: "grok2api-egress-enhancements",
    title: "Egress Quality Guard",
    description: "为 Grok2API 与 CPA 增加出口质量探测、隔离、迁移和自动恢复，避免异常节点继续承载请求。",
    category: "system",
    kind: "网络可靠性",
    status: "开源增强",
    year: "2026",
    tags: ["Go", "Proxy", "Observability"],
    story: {
      problem: "多账号、多出口服务遇到连接故障或质量异常时，单纯重试会继续把请求送往问题节点，也难以区分账号与网络故障。",
      approach: "为 Grok2API 发布可审计补丁，并提供独立 CPA 原生插件，用主动探针、质量阈值和状态机管理摘流、迁移与恢复。",
      outcome: "固定代理具备快速复测，异常出口能够隔离并迁移账号，恢复前还会经过真实质量验证。",
      highlights: [
        { title: "快速复测", description: "并发连接故障只触发一个共享探针，健康后重新读取状态并恢复节点。" },
        { title: "质量熔断", description: "被动指标与固定 Prompt 主动复测共同决定隔离，避免短时流式突增造成误判。" },
        { title: "CPA 原生插件", description: "独立插件提供节点管理、批量导入、质量检测、隔离迁号和策略热加载。" },
      ],
    },
    repo: "https://github.com/lij768423-svg/grok2api-egress-enhancements",
    detail: "/projects/grok2api-egress-enhancements",
    icon: <ShareNetwork size={22} weight="duotone" />,
    cardPreview: {
      ...optimizedCovers["grok2api-egress-enhancements"],
      sizes: "(max-width: 680px) calc(100vw - 48px), 320px",
      alt: "Egress Quality Guard AI 生成概念海报",
      width: 1024,
      height: 640,
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

export function ExternalLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
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
  const { language, toggleLanguage } = usePortfolioLanguage();

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
          <NavLink to="/desk">桌搭</NavLink>
          <NavLink to="/blog">博客</NavLink>
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
              className="language-switch"
              type="button"
              data-no-translate
              aria-pressed={language === "en"}
              aria-label={language === "zh" ? "Switch to English" : "切换为中文"}
              title={language === "zh" ? "Switch to English" : "切换为中文"}
              onClick={toggleLanguage}
            >
              <Translate size={16} weight="bold" aria-hidden="true" />
              <span>{language === "zh" ? "EN" : "中"}</span>
            </button>
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
              <Suspense
                fallback={(
                  <div className="flowing-menu flowing-menu-fallback" role="list">
                    {flowingMenuItems.map((item) => (
                      <div className="flowing-menu-item" role="listitem" key={item.href}>
                        <Link className="flowing-menu-link" to={item.href} aria-label={item.ariaLabel} onClick={closeMenu}>
                          <strong>{item.label}</strong>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              >
                <FlowingMenu items={flowingMenuItems} onSelect={closeMenu} speed={13} />
              </Suspense>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function Hero({ theme, onSelectScene }: { theme: ThemeMode; onSelectScene: (scene: HomeSceneId) => void }) {
  const reduceMotion = useReducedMotion();
  const isPhone = window.matchMedia("(max-width: 767px)").matches;
  const portraitSource = "/assets/virtual-developer-avatar-dark.webp";
  const portraitSourceSet = "/assets/virtual-developer-avatar-dark-512.webp 512w, /assets/virtual-developer-avatar-dark-1024.webp 1024w, /assets/virtual-developer-avatar-dark-1600.webp 1600w, /assets/virtual-developer-avatar-dark.webp 2048w";

  return (
      <section
        id="top"
        className="hero hero-intro section-shell"
        data-home-scene="intro"
        aria-labelledby="hero-title"
      >
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
          aria-label="依据本人形象创作的黑框眼镜动漫数字分身"
          initial={reduceMotion || isPhone ? false : { opacity: 0, x: 28, scale: 0.985 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={reduceMotion || isPhone
            ? { duration: 0 }
            : { duration: 0.82, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <InteractivePortrait src={portraitSource} srcSet={portraitSourceSet} />
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
              <BlurText className="hero-line" text="你好，我是 ljj。" delay={0.08} crossFadeTransition />
              <BlurText className="hero-line" text="把想法做成长期运行的产品。" delay={0.3} crossFadeTransition />
            </span>
          </h1>
          <p className="hero-summary">
            我做学习产品、AI 客户端、客户交付和个人基础设施。设计、开发、部署与长期维护都由我完成。
          </p>
          <div className="hero-actions">
            <Magnetic>
              <a className="button button-primary" href="#featured-projects" onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                window.history.pushState(null, "", "#featured-projects");
                onSelectScene("projects");
              }}>
                <span>查看项目</span><span className="button-arrow"><ArrowRight size={18} weight="bold" /></span>
              </a>
            </Magnetic>
            <Magnetic>
              <a className="button button-secondary" href="#about-me" onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                window.history.pushState(null, "", "#about-me");
                onSelectScene("about");
              }}>
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
  const isPhone = usePhoneLayout();
  const favoriteIds = ["grok-register-panel", "law-site"] as const;
  const favorites = favoriteIds
    .map((id) => projects.find((project) => project.id === id))
    .filter((project): project is Project => Boolean(project));
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
          <h2 id="favorite-projects-title">
            <DecryptedText
              className="favorite-projects-title-text"
              text="我的收藏项目"
              startDelay={0}
              animateOnMount={false}
              constrainWidth
            />
          </h2>
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
              <ExternalLink
                className="favorite-project-link"
                href={project.repo ?? project.site ?? "https://github.com/lij768423-svg"}
              >
                <div className="favorite-project-media">
                  <img
                    className={project.cardPreview.fit === "contain" ? "is-contain" : ""}
                    src={project.cardPreview.image}
                    srcSet={project.cardPreview.srcSet}
                    sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1180px) 50vw, 60vw"
                    alt={project.cardPreview.alt}
                    width={project.cardPreview.width}
                    height={project.cardPreview.height}
                    loading={isPhone ? "eager" : "lazy"}
                    decoding="async"
                    style={{ objectPosition: project.cardPreview.position }}
                  />
                </div>
                <div className="favorite-project-copy">
                  <span>{project.kind}</span>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </div>
              </ExternalLink>
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

const homeEntryVerticalLines = Array.from({ length: 49 }, (_, index) => index);
const homeEntryHorizontalLines = Array.from({ length: 28 }, (_, index) => index);
let hasPlayedHomeEntryIntro = false;

function HomeEntryIntro({ theme, onComplete }: { theme: ThemeMode; onComplete: () => void }) {
  const introRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef(false);
  const finishIntro = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    introRef.current?.classList.add("is-finished");
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const fallback = window.setTimeout(finishIntro, 4000);
    return () => window.clearTimeout(fallback);
  }, [finishIntro]);

  const destination = theme === "dark" ? "#141412" : "#fbfbf8";
  const lineDestination = theme === "dark" ? "rgba(242, 241, 235, 0.051)" : "rgba(17, 17, 15, 0.036)";
  const blueprintDestination = theme === "dark" ? "rgba(242, 241, 235, 0.24)" : "rgba(17, 17, 15, 0.24)";
  const lineStyle = (index: number, offset: number) => ({
    "--home-entry-line-index": index,
    "--home-entry-line-delay": `${360 + ((index * 7 + offset) % 13) * 18}ms`,
  } as CSSProperties);

  return createPortal(
    <div
      ref={introRef}
      className="home-entry-intro"
      aria-hidden="true"
      style={{
        "--home-entry-destination": destination,
        "--home-entry-line-destination": lineDestination,
        "--home-entry-blueprint-destination": blueprintDestination,
      } as CSSProperties}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && event.animationName === "home-entry-surface") {
          finishIntro();
        }
      }}
    >
      <div className="home-entry-mark">
        <span>ljj.world</span>
        <i />
      </div>
      <div className="home-entry-grid">
        {homeEntryVerticalLines.map((index) => (
          <i
            className={`home-entry-grid-line is-vertical${index % 2 ? " is-reverse" : ""}`}
            key={`home-entry-v-${index}`}
            style={lineStyle(index, 0)}
          />
        ))}
        {homeEntryHorizontalLines.map((index) => (
          <i
            className={`home-entry-grid-line is-horizontal${index % 2 ? " is-reverse" : ""}`}
            key={`home-entry-h-${index}`}
            style={lineStyle(index, 5)}
          />
        ))}
      </div>
      <div className={`home-entry-blueprint is-${theme}`}>
        <div className="home-entry-blueprint-header">
          <i className="home-entry-blueprint-brand-frame" />
          <div className="home-entry-blueprint-nav">
            <i /><i /><i /><i /><i />
          </div>
          <div className="home-entry-blueprint-tools"><i /><i /><i /></div>
        </div>
        <div className="home-entry-blueprint-hero">
          <div className="home-entry-blueprint-portrait-frame" />
          <div className="home-entry-blueprint-copy">
            <i className="home-entry-blueprint-meta-frame" />
            <div className="home-entry-blueprint-title-frames"><i /><i /></div>
            <i className="home-entry-blueprint-summary-frame" />
            <div className="home-entry-blueprint-actions"><i /><i /></div>
          </div>
          <div className="home-entry-blueprint-signal" />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function HomePage({ theme }: { theme: ThemeMode }) {
  const reduceMotion = useReducedMotion();
  const storyRef = useRef<HTMLDivElement>(null);
  const [activeScene, setActiveScene] = useState<HomeSceneId>("intro");
  const [aboutPhotosRequested, setAboutPhotosRequested] = useState(false);
  const [aboutStickersReady, setAboutStickersReady] = useState(false);
  const [shouldPlayEntryIntro] = useState(() => (
    !hasPlayedHomeEntryIntro && !Boolean(reduceMotion)
  ));
  const { scrollYProgress } = useScroll({ container: storyRef });
  const completeEntryIntro = useCallback(() => {
    document.body.classList.remove("home-intro-active");
    storyRef.current?.setAttribute("aria-busy", "false");
  }, []);

  useEffect(() => {
    if (!shouldPlayEntryIntro) return;
    hasPlayedHomeEntryIntro = true;
    document.body.classList.add("home-intro-active");
    return () => document.body.classList.remove("home-intro-active");
  }, [shouldPlayEntryIntro]);

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
    if (window.getComputedStyle(story).overflowY === "visible") {
      const topMargin = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - topMargin,
        behavior: reduceMotion ? "instant" : "smooth",
      });
      return;
    }
    story.scrollTo({
      top: target.offsetTop,
      behavior: reduceMotion ? "instant" : "smooth",
    });
  }

  return (
    <>
      {shouldPlayEntryIntro ? <HomeEntryIntro theme={theme} onComplete={completeEntryIntro} /> : null}
      <div ref={storyRef} className="home-story" aria-busy={shouldPlayEntryIntro ? true : false}>
        <Hero theme={theme} onSelectScene={selectScene} />
        <AboutScene photosRequested={aboutPhotosRequested} stickersReady={aboutStickersReady} />
        <FavoriteProjectsScene />
        <HomeSceneRail activeScene={activeScene} onSelect={selectScene} />
      </div>
    </>
  );
}

export function usePhoneLayout() {
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

export const deskScenes = {
  school: {
    label: "学校",
    tone: "暖色 / 学习开发",
    summary: "暖色灯光下的学校工位，承担备考、写代码和每天长时间使用。",
    defaultIndex: 5,
    desks: [
      {
        id: "school-night",
        period: "2025 / 12",
        title: "深夜只留下屏幕与输入设备",
        description: "降低环境亮度后，显示器、键鼠和手柄成为画面焦点，更适合游戏与沉浸式使用。",
        device: "DISPLAY / GAMEPAD",
        image: "/assets/desk-setup/desk-dorm-2025-night",
        alt: "寝室深夜桌搭，暗光中显示器、机械键盘、鼠标和手柄位于桌面中央",
        width: 1600,
        height: 1200,
      },
      {
        id: "school-january-framed",
        period: "2026 / 01",
        title: "暖光覆盖完整工作区",
        description: "收纳架与照明延伸到屏幕两侧，设备和小物件被统一在更完整的桌面框架里。",
        device: "DESK LIGHT / STORAGE",
        image: "/assets/desk-setup/desk-dorm-2026-january-framed",
        alt: "暖色灯光下的寝室桌搭，显示器、收纳架、键盘和桌面摆件完整入镜",
        width: 1600,
        height: 1404,
      },
      {
        id: "school-stable",
        period: "2026 / 04",
        title: "备考流程进入稳定状态",
        description: "时钟、输入设备和随手可用的小工具被重新编排，桌面开始服务于连续的学习和开发。",
        device: "DISPLAY / INPUT",
        image: "/assets/desk-setup/desk-2026-warm",
        alt: "学校暖色桌搭，显示器、键盘、桌面时钟和常用工具排列整齐",
        width: 1600,
        height: 1035,
      },
      {
        id: "school-april",
        period: "2026 / 04",
        title: "功能与收藏进入同一画面",
        description: "工作设备保持在中央，模型、手柄和植物向两侧展开，实用与个人偏好不再分开。",
        device: "DISPLAY / COLLECTION",
        image: "/assets/desk-setup/desk-dorm-2026-april",
        alt: "寝室暖色桌搭，显示器两侧陈列植物、模型、手柄和多组桌面设备",
        width: 1600,
        height: 1200,
      },
      {
        id: "school-may",
        period: "2026 / 05",
        title: "设备密度继续提高",
        description: "主屏、迷你主机、时钟和输入设备集中在触手可及的位置，桌面更紧凑也更高效。",
        device: "MAC MINI / INPUT",
        image: "/assets/desk-setup/desk-dorm-2026-may",
        alt: "寝室暖色桌搭近景，显示器、迷你主机、键盘、鼠标和桌面时钟集中排列",
        width: 1600,
        height: 1200,
      },
      {
        id: "school-current",
        period: "2026 / 07",
        title: "学校：学习与开发主场",
        description: "书架下的暖色工位同时承载备考、开发和日常整理，重点是长时间使用时依然顺手。",
        device: "DISPLAY / STUDY KIT",
        image: "/assets/desk-setup/desk-2026-current",
        alt: "当前学校桌搭的俯视全景，书架下放置显示器、键盘和学习设备",
        width: 1600,
        height: 954,
      },
    ],
  },
  home: {
    label: "家里",
    tone: "冷色 / 硬件影音",
    summary: "冷色调的家用工位，围绕白色主机、影音体验和硬件 DIY 展开。",
    defaultIndex: 2,
    desks: [
      {
        id: "home-blue",
        period: "2026 / 02",
        title: "家里的冷色主机桌",
        description: "白色主机进入桌面视线，屏幕、灯光与硬件开始按照同一套冷色语言组织。",
        device: "DISPLAY / PC",
        image: "/assets/desk-setup/desk-2026-blue",
        alt: "家里的冷色桌搭，显示器旁边放置白色透明侧板台式主机",
        width: 1600,
        height: 1200,
      },
      {
        id: "home-pc-detail",
        period: "2026 / 02",
        title: "硬件本身就是展示内容",
        description: "白色水冷主机、显卡和风扇不再藏在桌下，硬件结构成为家里桌面的主要视觉。",
        device: "GPU / LIQUID COOLING",
        image: "/assets/desk-setup/desk-home-pc-detail",
        alt: "家里白色透明主机的内部特写，可见显卡、水冷管和多组风扇",
        width: 1600,
        height: 900,
      },
      {
        id: "home-development",
        period: "2026 / 06",
        title: "在家也能快速进入开发状态",
        description: "大屏负责主要内容，笔记本随时接入开发环境，音响和灯光则服务于更放松的使用节奏。",
        device: "DISPLAY / LAPTOP",
        image: "/assets/desk-setup/desk-home-development",
        alt: "家里的冷色开发桌面，大屏幕前放着笔记本，两侧是透明音响和氛围灯",
        width: 1600,
        height: 801,
      },
      {
        id: "home-pc",
        period: "2026 / 06",
        title: "主机与桌面形成一体",
        description: "透明主机、曲面屏和输入设备共同组成家里的硬件空间，维护和调整部件都更直接。",
        device: "ULTRAWIDE / PC",
        image: "/assets/desk-setup/desk-2026-pc",
        alt: "家里的冷色桌搭，曲面显示器旁陈列透明台式主机",
        width: 1600,
        height: 1200,
      },
      {
        id: "home-current",
        period: "2026 / 07",
        title: "家里：影音与硬件空间",
        description: "深色背景、透明音响和白色设备组成更安静的冷色环境，适合影音、硬件和自由探索。",
        device: "DISPLAY / AUDIO / TABLET",
        image: "/assets/desk-setup/desk-home-current",
        alt: "当前家里桌搭，深色窗帘前放置显示器、透明音响、键盘和平板设备",
        width: 1600,
        height: 1200,
      },
    ],
  },
} as const;

export const homeGalleryItems: CircularGalleryItem[] = deskScenes.home.desks.map((desk) => ({
  image: `${desk.image}-1024.webp`,
  text: desk.title,
}));

export const schoolGalleryItems: CircularGalleryItem[] = deskScenes.school.desks.map((desk) => ({
  image: `${desk.image}-1024.webp`,
  text: desk.title,
}));

export function NotFoundPage() {
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
  "/desk": {
    title: "我的桌搭 | lij768423-svg",
    description: "两套独立桌搭：学校的暖色学习开发工位，以及家里的冷色影音与硬件空间。",
    image: "/assets/desk-setup/desk-2026-current-1600.webp",
  },
  "/blog": {
    title: "文章与笔记 | lij768423-svg",
    description: "关于产品、学习、自建基础设施和独立交付的文章与实践笔记。",
    image: "/assets/project-covers/home-lab.webp",
  },
};

function getPageMetadata(pathname: string) {
  const exact = pageMetadata[pathname];
  if (exact) return exact;

  if (pathname.startsWith("/blog/")) {
    const post = getBlogPost(pathname.slice("/blog/".length));
    if (post) {
      return {
        title: `${post.title} | lij768423-svg`,
        description: post.excerpt,
        image: post.image,
      };
    }
  }

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
  const { language } = usePortfolioLanguage();

  useEffect(() => {
    const metadata = getPageMetadata(location.pathname);
    const title = language === "en" ? translatePortfolioText(metadata.title) : metadata.title;
    const description = language === "en" ? translatePortfolioText(metadata.description) : metadata.description;
    document.title = title;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute("content", title);
    document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute("content", description);
    document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.setAttribute("content", metadata.image);
  }, [language, location.pathname]);

  return null;
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      let target: HTMLElement | null = null;
      try {
        target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      } catch {
        target = null;
      }
      if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
      else window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
    return () => window.cancelAnimationFrame(frame);
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
  const isDesk = location.pathname === "/desk";
  const isSystems = location.pathname === "/systems";
  const isBlog = location.pathname === "/blog" || location.pathname.startsWith("/blog/");

  useEffect(() => {
    document.body.classList.toggle("systems-page", location.pathname === "/systems");
    return () => {
      document.body.classList.remove("systems-page");
    };
  }, [location.pathname]);

  return (
    <>
      <PageMeta />
      <GlobalPixelTrail enabled={trailEnabled} />
      <GlobalFlowingLights key={location.pathname} deferred={isAbout} />
      <Header
        theme={theme}
        trailEnabled={trailEnabled}
        onThemeChange={onThemeChange}
        onTrailChange={onTrailChange}
      />
      <AnimatePresence mode="wait" initial={isBlog}>
        <motion.main
          key={location.pathname}
          className={`route-main${isSystems ? " is-systems-route" : ""}${isDesk ? " is-desk-route" : ""}${isBlog ? " is-blog-route" : ""}`}
          initial={reduceMotion || isAbout
            ? false
            : isBlog
              ? { opacity: 0, y: 18, scale: 0.985, filter: "blur(3px)" }
              : { opacity: 0, y: isSystems ? 0 : 10 }}
          animate={{
            opacity: 1,
            y: 0,
            ...(isBlog ? { scale: 1, filter: "blur(0px)" } : {}),
            transition: reduceMotion || isAbout || isDesk
              ? { duration: 0 }
              : isSystems
                ? { duration: 0.72, ease: [0.16, 1, 0.3, 1] }
                : isBlog
                  ? { duration: 0.52, ease: [0.16, 1, 0.3, 1] }
                  : { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
          }}
          exit={reduceMotion || isAbout
            ? undefined
            : isDesk
              ? {
                  opacity: 0,
                  y: 0,
                  transition: { duration: 0.12, delay: 1.04, ease: [0.16, 1, 0.3, 1] },
                }
              : {
                  opacity: 0,
                  y: isBlog ? -10 : -8,
                  ...(isBlog ? { scale: 0.995, filter: "blur(2px)" } : {}),
                  transition: {
                    duration: isBlog ? 0.4 : 0.28,
                    ease: [0.16, 1, 0.3, 1],
                  },
                }}
        >
          <Suspense fallback={null}>
            <ScrollToTop />
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
              <Route path="/desk"><DeskArchivePage theme={theme} /></Route>
              <Route path="/blog/:slug"><BlogArticlePage /></Route>
              <Route path="/blog"><BlogPage /></Route>
              <Route><NotFoundPage /></Route>
            </Routes>
          </Suspense>
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

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || /^(slow-2g|2g)$/.test(connection?.effectiveType ?? "")) return;
    const hasIdleCallback = "requestIdleCallback" in window;
    let idleId: number | undefined;
    const prefetch = () => routeChunkLoaders.forEach(prefetchRoute);
    const schedule = () => {
      idleId = hasIdleCallback
        ? window.requestIdleCallback(prefetch, { timeout: 5000 })
        : window.setTimeout(prefetch, 2000);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (idleId === undefined) return;
      if (hasIdleCallback) window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, []);

  function toggleTheme() {
    setTheme((current) => current === "light" ? "dark" : "light");
  }

  function toggleTrail() {
    setTrailEnabled((current) => !current);
  }

  return (
    <PortfolioLanguageProvider>
      <BrowserRouter>
        <PortfolioRoutes
          theme={theme}
          trailEnabled={trailEnabled}
          onThemeChange={toggleTheme}
          onTrailChange={toggleTrail}
        />
      </BrowserRouter>
    </PortfolioLanguageProvider>
  );
}

export default App;
