import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { Books } from "@phosphor-icons/react/Books";
import { Browser } from "@phosphor-icons/react/Browser";
import { ChatCircleDots } from "@phosphor-icons/react/ChatCircleDots";
import { Code } from "@phosphor-icons/react/Code";
import { Cpu } from "@phosphor-icons/react/Cpu";
import { DeviceMobile } from "@phosphor-icons/react/DeviceMobile";
import { GithubLogo } from "@phosphor-icons/react/GithubLogo";
import { GlobeHemisphereEast } from "@phosphor-icons/react/GlobeHemisphereEast";
import { GlobeHemisphereWest } from "@phosphor-icons/react/GlobeHemisphereWest";
import { HardDrives } from "@phosphor-icons/react/HardDrives";
import { MapTrifold } from "@phosphor-icons/react/MapTrifold";
import { Moon } from "@phosphor-icons/react/Moon";
import { MouseSimple } from "@phosphor-icons/react/MouseSimple";
import { ShareNetwork } from "@phosphor-icons/react/ShareNetwork";
import { SquaresFour } from "@phosphor-icons/react/SquaresFour";
import { Sun } from "@phosphor-icons/react/Sun";
import { Translate } from "@phosphor-icons/react/Translate";
import { X } from "@phosphor-icons/react/X";
import { animate, AnimatePresence, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Link, Redirect, Route, Router as BrowserRouter, Switch as Routes, useLocation as useWouterLocation } from "wouter";
import { BlurText } from "./components/effects/BlurText";
import { DecryptedText } from "./components/effects/DecryptedText";
import { GlobalFlowingLights } from "./components/effects/GlobalFlowingLights";
import { GlobalPixelTrail } from "./components/effects/GlobalPixelTrail";
import { Magnetic } from "./components/effects/Magnetic";
import { SceneLineOrnaments } from "./components/effects/SceneLineOrnaments";
import { InteractivePortrait } from "./components/InteractivePortrait";
import type { CircularGalleryItem } from "./components/CircularGallery";
import type { FlowingMenuItemData } from "./components/FlowingMenu";
import { ENGLISH_PREFIX, withLanguagePrefix } from "./i18n/languageRouting";
import { PortfolioLanguageProvider, translatePortfolioText, usePortfolioLanguage } from "./i18n/PortfolioLanguage";
import { blogPosts, getBlogPost } from "./blog";
import { shareCardPath } from "./seo/shareCards";
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

// Each menu row scrolls its own set: generated still lifes plus the original photo for that page.
const flowingMenuImages = (section: string, original?: string) => [
  ...[1, 2, 3, 4].map((index) => `/assets/flowing-menu/${section}-${index}.webp`),
  ...(original ? [original] : []),
];

const flowingMenuItems: FlowingMenuItemData[] = [
  { href: "/", label: "Home", ariaLabel: "Home - 首页", images: flowingMenuImages("home", "/assets/flowing-menu/home.webp") },
  { href: "/projects", label: "Projects", ariaLabel: "Projects - 全部项目", images: flowingMenuImages("projects", "/assets/flowing-menu/projects.webp") },
  { href: "/systems", label: "Server", ariaLabel: "Server - 我的服务器", images: flowingMenuImages("server", "/assets/flowing-menu/server.webp") },
  { href: "/desk", label: "Desk setup", ariaLabel: "Desk setup - 桌搭展示", images: flowingMenuImages("desk", "/assets/flowing-menu/desk.webp") },
  { href: "/blog", label: "Blog", ariaLabel: "Blog - 文章与笔记", images: flowingMenuImages("blog") },
  { href: "/about", label: "About", ariaLabel: "About - 关于", images: flowingMenuImages("about", "/assets/flowing-menu/about.webp") },
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

export type Project = {
  id: string;
  title: string;
  description: string;
  category: Category;
  kind: string;
  tags: string[];
  site?: string;
  repo?: string;
  /** Slug of the blog post about this project, linked from its paper. */
  article?: string;
  icon: ReactNode;
  cardPreview: ProjectPreview;
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
    tags: ["JavaScript", "Local-first", "AI"],
    site: "https://quiz.hermesjj.com/",
    repo: "https://github.com/lij768423-svg/408-",
    article: "ai-study-workflow",
    icon: <Books size={22} weight="duotone" />,
    cardPreview: projectCardPreview("408-web", "408 刷题库"),
  },
  {
    id: "408-harmony",
    title: "408 for HarmonyOS",
    description: "面向 HarmonyOS NEXT 的原生刷题端，支持离线题库、手势答题、KaTeX 与可选 AI 讲题。",
    category: "product",
    kind: "原生应用",
    tags: ["ArkTS", "HarmonyOS NEXT", "Offline"],
    repo: "https://github.com/lij768423-svg/408-for-harmony",
    icon: <DeviceMobile size={22} weight="duotone" />,
    cardPreview: projectCardPreview("408-harmony", "408 for HarmonyOS"),
  },
  {
    id: "ioschat",
    title: "Hermes for iOS",
    description: "从 ArkTS 迁移到 SwiftUI 的个人 AI 客户端，补齐 SSE、多会话、附件、Markdown 与公式。",
    category: "ai",
    kind: "AI 客户端",
    tags: ["SwiftUI", "UIKit", "SSE"],
    repo: "https://github.com/lij768423-svg/ioschat",
    icon: <ChatCircleDots size={22} weight="duotone" />,
    cardPreview: projectCardPreview("ioschat", "Hermes for iOS"),
  },
  {
    id: "law-site",
    title: "根旺律所数字站",
    description: "机构官网、在线咨询、AI 摘要、人工接管与 CMS 后台组成的真实客户交付。",
    category: "product",
    kind: "客户项目",
    tags: ["Next.js", "Payload CMS", "Playwright"],
    site: "https://lawweb.hermesjj.com/",
    icon: <Browser size={22} weight="duotone" />,
    cardPreview: projectCardPreview("law-site", "根旺律所数字站"),
  },
  {
    id: "mineradio",
    title: "Mineradio Web 适配",
    description: "参与沉浸式音乐播放器的视觉与工程迭代，并完成 Web 迁移、访问保护与发布链路重建。",
    category: "product",
    kind: "协作项目",
    tags: ["React", "Three.js", "Electron"],
    site: "https://mineradio.hermesjj.com/",
    repo: "https://github.com/English-worse/Mineradio",
    icon: <GlobeHemisphereWest size={22} weight="duotone" />,
    cardPreview: projectCardPreview("mineradio", "Mineradio Web 适配"),
  },
  {
    id: "grok-register-panel",
    title: "Grok Register Panel",
    description: "把长链路浏览器任务、邮箱与代理池、失败恢复和运行统计收进一个实时控制面板。",
    category: "ai",
    kind: "自动化运维",
    tags: ["Python", "Camoufox", "Operations"],
    repo: "https://github.com/lij768423-svg/grok-register-panel",
    article: "grok-register-panel",
    icon: <Browser size={22} weight="duotone" />,
    cardPreview: {
      ...optimizedCovers["grok-register-panel"],
      sizes: "(max-width: 680px) calc(100vw - 48px), 320px",
      alt: "Grok Register Panel AI 生成概念海报",
    },
  },
  {
    id: "meshatlas",
    title: "MeshAtlas",
    description: "Tailscale tailnet 的实时地图：每台机器在哪、走直连还是中继、上面跑着什么，一屏看完。",
    category: "system",
    kind: "网络可视化",
    tags: ["Python", "Tailscale", "D3"],
    site: "https://lij768423-svg.github.io/meshatlas/",
    repo: "https://github.com/lij768423-svg/meshatlas",
    icon: <GlobeHemisphereEast size={22} weight="duotone" />,
    cardPreview: projectCardPreview("meshatlas", "MeshAtlas"),
  },
  {
    id: "grok2api-egress-enhancements",
    title: "Egress Quality Guard",
    description: "为 Grok2API 与 CPA 增加出口质量探测、隔离、迁移和自动恢复，避免异常节点继续承载请求。",
    category: "system",
    kind: "网络可靠性",
    tags: ["Go", "Proxy", "Observability"],
    repo: "https://github.com/lij768423-svg/grok2api-egress-enhancements",
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
    tags: ["JavaScript", "Markdown", "AI Workflow"],
    repo: "https://github.com/lij768423-svg/writing-studio",
    icon: <Code size={22} weight="duotone" />,
    cardPreview: projectCardPreview("writing-studio", "Writing Studio"),
  },
  {
    id: "travel-agent",
    title: "行记 旅行规划 Agent",
    description: "可插拔城市的大模型旅行规划 Agent：一条命令接入新城市，网页端与 MCP 服务共用同一套排程与校验。",
    category: "ai",
    kind: "旅行规划 Agent",
    tags: ["LangGraph", "OR-Tools", "MCP"],
    repo: "https://github.com/lij768423-svg/pluggable-city-travel-agent",
    article: "pluggable-city-travel-agent",
    icon: <MapTrifold size={22} weight="duotone" />,
    cardPreview: projectCardPreview("travel-agent", "行记 旅行规划 Agent"),
  },
  {
    id: "tailscale-latency",
    title: "Tailscale 延迟测试",
    description: "把 Tailnet 节点间延迟、直连或 DERP 路径与探针状态汇总成可切换的网络拓扑。",
    category: "system",
    kind: "网络诊断工具",
    tags: ["Python", "Tailscale", "Three.js"],
    icon: <ShareNetwork size={22} weight="duotone" />,
    cardPreview: projectCardPreview("tailscale-latency", "Tailscale 延迟测试"),
  },
  {
    id: "home-lab",
    title: "Home Lab 基础设施",
    description: "围绕 Docker、Tailscale、Cloudflare、对象存储、监控与备份维护个人服务底座。",
    category: "system",
    kind: "自托管系统",
    tags: ["Docker", "Tailscale", "MinIO"],
    article: "home-server-as-a-product",
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
              <BlurText className="hero-line" text="你好，我是 ljj。" delay={0.08} crossFadeTransition wrapWords />
              <BlurText className="hero-line" text="把想法做成长期运行的产品。" delay={0.3} crossFadeTransition wrapWords />
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

// The two featured slots show projects in a fresh random order on every visit and swap one slot
// at a time, so each card stays up for two swaps. Swaps pause while the section is off screen,
// while a pointer or keyboard focus is on a card, and while the tab is hidden.
const featuredSwapMs = 6000;
const featuredCardSizes = "(max-width: 760px) calc(100vw - 32px), (max-width: 1180px) 50vw, 60vw";

type FeaturedRotation = { slots: [number, number]; next: number; turn: number };

function shuffledProjects() {
  const order = [...projects];
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [order[index], order[swap]] = [order[swap], order[index]];
  }
  return order;
}

// Pure, so StrictMode's double-invoked state updaters cannot skip a project.
function advanceFeatured({ slots, next, turn }: FeaturedRotation, count: number): FeaturedRotation {
  const slot = turn % 2;
  let incoming = next % count;
  for (let tries = 0; tries < count && slots.includes(incoming); tries += 1) incoming = (incoming + 1) % count;
  const updated: [number, number] = slot === 0 ? [incoming, slots[1]] : [slots[0], incoming];
  return { slots: updated, next: (incoming + 1) % count, turn: turn + 1 };
}

function preloadCardImage(project: Project) {
  const image = new Image();
  image.decoding = "async";
  image.sizes = featuredCardSizes;
  if (project.cardPreview.srcSet) image.srcset = project.cardPreview.srcSet;
  image.src = project.cardPreview.image;
}

function FavoriteProjectsScene() {
  const isPhone = usePhoneLayout();
  const reduceMotion = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { amount: 0.4 });
  const [order] = useState(shuffledProjects);
  const [rotation, setRotation] = useState<FeaturedRotation>({ slots: [0, 1], next: 2, turn: 0 });
  const [pointerHeld, setPointerHeld] = useState(false);
  const [focusHeld, setFocusHeld] = useState(false);
  const canRotate = !reduceMotion && order.length > 2;
  const rotating = canRotate && gridInView && !pointerHeld && !focusHeld;

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setRotation((current) => advanceFeatured(current, order.length));
    }, featuredSwapMs);
    return () => window.clearInterval(timer);
  }, [order.length, rotating]);

  // Fetch the next cover ahead of its swap, so the wipe never uncovers an empty frame.
  useEffect(() => {
    if (!canRotate) return;
    const upcoming = advanceFeatured(rotation, order.length);
    preloadCardImage(order[upcoming.slots[rotation.turn % 2]]);
  }, [canRotate, order, rotation]);

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

        <div
          ref={gridRef}
          className="favorite-projects-grid"
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") setPointerHeld(true);
          }}
          onPointerLeave={() => setPointerHeld(false)}
          onFocus={() => setFocusHeld(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusHeld(false);
          }}
        >
          {rotation.slots.map((projectIndex, slot) => {
            const project = order[projectIndex];
            return (
              <motion.article
                key={slot}
                className="favorite-project"
                data-featured-project={project.id}
                initial={reduceMotion ? false : { opacity: 0, y: 42, rotate: slot === 0 ? -1.6 : 1.6 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true, amount: 0.28 }}
                transition={{ duration: 0.72, delay: slot * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* The incoming project wipes down over the outgoing one, like the home intro's scan. */}
                <AnimatePresence initial={false}>
                  <motion.a
                    key={project.id}
                    className="favorite-project-link"
                    href={project.repo ?? project.site ?? "https://github.com/lij768423-svg"}
                    target="_blank"
                    rel="noreferrer"
                    style={{ zIndex: rotation.turn + 1 }}
                    initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
                    animate={{ clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 0.78, ease: [0.65, 0, 0.35, 1] } }}
                    exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.5 } }}
                  >
                    <div className="favorite-project-media">
                      <img
                        className={project.cardPreview.fit === "contain" ? "is-contain" : ""}
                        src={project.cardPreview.image}
                        srcSet={project.cardPreview.srcSet}
                        sizes={featuredCardSizes}
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
                  </motion.a>
                </AnimatePresence>
              </motion.article>
            );
          })}
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

// Cold-load intro on the home page. It continues the dark boot screen in index.html (same
// wordmark and square) and draws the grid. Once the hero can be shown complete, a scan line runs
// down the screen and wipes the dark layer and the wordmark away, revealing the page top down.
function HomeEntryIntro({ onComplete }: { onComplete: () => void }) {
  const introRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef(false);
  const finishIntro = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    introRef.current?.classList.add("is-finished");
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    let revealed = false;
    const reveal = () => {
      if (revealed || hasCompletedRef.current) return;
      revealed = true;
      introRef.current?.classList.add("is-revealing");
    };
    // Wait for the portrait and the web font, so the page never appears half-loaded and then pops,
    // but give the grid at least 1.2 s and never hold the dark layer longer than 3.5 s.
    const portrait = document.querySelector<HTMLImageElement>(".hero-intro .hero-portrait-image");
    const heroReady = Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      portrait ? portrait.decode().catch(() => undefined) : Promise.resolve(),
    ]);
    const minimum = new Promise((resolve) => window.setTimeout(resolve, 1200));
    void Promise.all([heroReady, minimum]).then(reveal);
    const cap = window.setTimeout(reveal, 3500);
    const fallback = window.setTimeout(finishIntro, 5200);
    return () => {
      revealed = true;
      window.clearTimeout(cap);
      window.clearTimeout(fallback);
    };
  }, [finishIntro]);

  const lineStyle = (index: number, offset: number) => ({
    "--home-entry-line-index": index,
    "--home-entry-line-delay": `${360 + ((index * 7 + offset) % 13) * 18}ms`,
  } as CSSProperties);

  return createPortal(
    <div
      ref={introRef}
      className="home-entry-intro"
      aria-hidden="true"
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
      <i className="home-entry-scan" />
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
      {shouldPlayEntryIntro ? <HomeEntryIntro onComplete={completeEntryIntro} /> : null}
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

export function getPageMetadata(pathname: string) {
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
    // "/blog/slug/" and "/blog/slug" are the same page; the prerendered entry and sitemap use the latter.
    const pathname = location.pathname.replace(/\/+$/, "") || "/";
    const metadata = getPageMetadata(pathname);
    const title = language === "en" ? translatePortfolioText(metadata.title) : metadata.title;
    const description = language === "en" ? translatePortfolioText(metadata.description) : metadata.description;
    document.title = title;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute("content", title);
    document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute("content", description);
    const blogSlug = /^\/blog\/([^/]+)$/.exec(pathname)?.[1];
    const image = blogSlug && getBlogPost(blogSlug) ? shareCardPath(blogSlug, language) : metadata.image;
    document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.setAttribute("content", new URL(image, window.location.origin).href);
    // The build writes canonical/og:url/hreflang per route; keep them in step during client-side navigation.
    const pageUrl = `${window.location.origin}${withLanguagePrefix(pathname, language)}`;
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", pageUrl);
    document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute("content", pageUrl);
    document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]').forEach((link) => {
      const target = link.hreflang === "en" ? "en" : "zh";
      link.setAttribute("href", `${window.location.origin}${withLanguagePrefix(pathname, target)}`);
    });
  }, [language, location.pathname]);

  return null;
}

function RouteLoading() {
  return <div className="route-loading" role="status" aria-label="Loading"><span /></div>;
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
  const { pathname } = useLocation();
  // Projects had a page each until their papers replaced them; old links land on the index.
  const isRetiredProject = /^\/projects\/[^/]+\/?$/.test(pathname);
  const location = { pathname: isRetiredProject ? "/projects" : pathname };
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
      {isRetiredProject ? <Redirect to="/projects" replace /> : null}
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
          <Suspense fallback={<RouteLoading />}>
            <ScrollToTop />
            <Routes location={location.pathname}>
              <Route path="/"><HomePage theme={theme} /></Route>
              <Route path="/projects"><ProjectsPage /></Route>
              <Route path="/systems"><SystemsPage /></Route>
              <Route path="/about"><AboutPage theme={theme} /></Route>
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
      <LocalizedRouter>
        <PortfolioRoutes
          theme={theme}
          trailEnabled={trailEnabled}
          onThemeChange={toggleTheme}
          onTrailChange={toggleTrail}
        />
      </LocalizedRouter>
    </PortfolioLanguageProvider>
  );
}

// English pages live under /en; the router strips that prefix so routes and links stay neutral.
function LocalizedRouter({ children }: { children: ReactNode }) {
  const { language } = usePortfolioLanguage();
  return <BrowserRouter base={language === "en" ? ENGLISH_PREFIX : ""}>{children}</BrowserRouter>;
}

export default App;
