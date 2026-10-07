import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { BlurText } from "./effects/BlurText";
import { SceneLineOrnaments } from "./effects/SceneLineOrnaments";
import { ServerServiceArt } from "./ServerServiceArt";
import { serverPartImages } from "../assets/serverParts";
import { FocusArtDefinitions, focusArtwork, silhouetteMaskSrc } from "./ServerFocusArt";
import { BoardArt, ChassisArt, FanTrayArt, GraphicsArt, MachineBackdrop, MachineDefinitions, MemoryArt, NetworkArt, ProcessorArt, StorageArt } from "./ServerMachineParts";
import { prefetchServiceImage, prefetchServiceImages } from "../lib/serviceImageLoader";
import { loadArtworkMask, measureArtworkBox, placeConnector, type CardSlide, type ConnectorLayout } from "../lib/connectorFit";
import "./ServerMachineVisual.css";

type ServerCategoryId = "network" | "hardware" | "agent" | "data" | "containers";

type ServerService = {
  id: string;
  name: string;
  kind: string;
  description: string;
  connection: string;
  deployment: string;
  entryLabel: string;
  entryUrl?: string;
};

type ServerCategory = {
  id: ServerCategoryId;
  label: string;
  shortLabel: string;
  description: string;
  icon: ReactNode;
  services: ServerService[];
};

type ServerFact = {
  label: string;
  value: string;
};

type ServerExplodedStoryProps = {
  categories: ServerCategory[];
  facts: readonly ServerFact[];
  visualOnly?: boolean;
};

const categoryOrder: ServerCategoryId[] = ["network", "hardware", "agent", "data", "containers"];

const visualCameraFrames: Record<ServerCategoryId, { x: number; y: number; scale: number }> = {
  network: { x: 346, y: -266, scale: 1.4 },
  hardware: { x: -72, y: 200, scale: 1.05 },
  agent: { x: -384, y: -315, scale: 1.45 },
  data: { x: -666, y: 387, scale: 1.5 },
  containers: { x: -22, y: -505, scale: 1.35 },
};

const standardCameraFrames: Record<ServerCategoryId, { x: number; y: number; scale: number }> = {
  network: { x: 120, y: -62, scale: 1.34 },
  hardware: { x: 0, y: 0, scale: 1.08 },
  agent: { x: -95, y: -24, scale: 1.27 },
  data: { x: -180, y: 68, scale: 1.31 },
  containers: { x: 0, y: 0, scale: 1.02 },
};

const categoryVisuals: Record<ServerCategoryId, { src: string; alt: string }> = {
  network: { src: serverPartImages["nic-line"], alt: "服务器双口网卡线稿" },
  hardware: { src: serverPartImages["cpu-line"], alt: "服务器处理器线稿" },
  agent: { src: serverPartImages["gpu-line"], alt: "服务器显卡线稿" },
  data: { src: serverPartImages["nvme-line"], alt: "服务器 NVMe 存储线稿" },
  containers: { src: serverPartImages["container-line"], alt: "服务器容器运行核心线稿" },
};

const serviceConnectorLayouts: readonly ConnectorLayout[] = [
  { segments: [[43, 38, 38, 31], [38, 31, 38, 22], [38, 22, 31, 22]], endX: 31, endY: 22 },
  { segments: [[57, 38, 62, 31], [62, 31, 62, 22], [62, 22, 69, 22]], endX: 69, endY: 22 },
  { segments: [[63, 50, 72, 50], [72, 50, 77, 50], [77, 50, 82, 50]], endX: 82, endY: 50 },
  { segments: [[57, 62, 62, 69], [62, 69, 62, 78], [62, 78, 69, 78]], endX: 69, endY: 78 },
  { segments: [[43, 62, 38, 69], [38, 69, 38, 78], [38, 78, 31, 78]], endX: 31, endY: 78 },
];
const serviceCardSlides: readonly CardSlide[] = ["up", "up", "right", "down", "down"];

function MachineDrawing({
  activeCategoryId,
  isExploded,
  returningToOverview,
  reduceMotion,
  visualOnly,
  onSelectCategory,
}: {
  activeCategoryId: ServerCategoryId;
  isExploded: boolean;
  returningToOverview: boolean;
  reduceMotion: boolean;
  visualOnly: boolean;
  onSelectCategory: (categoryId: ServerCategoryId) => void;
}) {
  const cameraFrame = isExploded
    ? (visualOnly ? visualCameraFrames : standardCameraFrames)[activeCategoryId]
    : { x: 0, y: 0, scale: visualOnly ? 1.08 : 0.82 };
  const exploded = isExploded ? 1 : 0;
  // Only a focused module is highlighted; the overview starts and returns neutral.
  const activePart = isExploded ? activeCategoryId : null;
  const movementTransition = reduceMotion
    ? { duration: 0 }
    : returningToOverview
      ? { type: "spring" as const, stiffness: 168, damping: 22, mass: 0.7 }
      : { type: "spring" as const, stiffness: 128, damping: 24, mass: 0.78 };
  const handleModuleKeyDown = (event: KeyboardEvent<SVGGElement>, categoryId: ServerCategoryId) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelectCategory(categoryId);
  };

  return (
    <motion.div className="server-machine-camera" animate={cameraFrame} transition={movementTransition}>
      <svg className="server-machine original-refined" viewBox="0 0 1000 640" role="img" aria-label="home-serve 主机分层爆炸结构图">
        <MachineDefinitions />
        <MachineBackdrop />

        <motion.g className="server-machine-part server-machine-shell" animate={{ x: exploded * -210, rotate: exploded * -5 }} transition={movementTransition}>
          <g className="machine-load-group machine-load-shell">
            <ChassisArt />
          </g>
        </motion.g>

        <motion.g className="server-machine-part server-machine-board" animate={{ x: exploded * -24 }} transition={movementTransition}>
          <g className="machine-load-group machine-load-board">
            <BoardArt />
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-cpu${activePart === "hardware" ? " is-active" : ""}`} animate={{ y: exploded * -118 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            <ProcessorArt />
          </g>
          <g className="machine-real-layer">
            <image className="machine-real-image" href={serverPartImages["cpu-line"]} x="353" y="132" width="360" height="360" preserveAspectRatio="xMidYMid meet" />
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-ram${activePart === "hardware" ? " is-active" : ""}`} animate={{ x: exploded * 112, y: exploded * -60 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            <MemoryArt />
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-nic${activePart === "network" ? " is-active" : ""}`} animate={{ x: exploded * -155, y: exploded * 76 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            <NetworkArt />
          </g>
          <g className="machine-real-layer">
            <image className="machine-real-image" href={serverPartImages["nic-line"]} x="295" y="252" width="330" height="330" preserveAspectRatio="xMidYMid meet" />
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-gpu${activePart === "agent" ? " is-active" : ""}`} animate={{ x: exploded * 178, y: exploded * 84 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            <GraphicsArt />
          </g>
          <g className="machine-real-layer">
            <image className="machine-real-image" href={serverPartImages["gpu-line"]} x="343" y="265" width="400" height="300" preserveAspectRatio="xMidYMid meet" />
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-storage${activePart === "data" ? " is-active" : ""}`} animate={{ x: exploded * 218, y: exploded * -112 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            <StorageArt />
          </g>
          <g className="machine-real-layer">
            <image className="machine-real-image" href={serverPartImages["nvme-line"]} x="431" y="110" width="420" height="300" preserveAspectRatio="xMidYMid meet" />
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-fans${activePart === "containers" ? " is-active" : ""}`} animate={{ y: exploded * 146 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            <FanTrayArt />
          </g>
          <g className="machine-real-layer">
            <image className="machine-real-image" href={serverPartImages["container-line"]} x="315" y="353" width="420" height="260" preserveAspectRatio="xMidYMid meet" />
          </g>
        </motion.g>

        {!isExploded ? (
          <g
            className={`machine-module-hotspots${returningToOverview ? " is-returning" : ""}`}
            aria-label="可查看的服务器模块"
          >
            <g
              className="machine-module-hotspot machine-load-group machine-load-hotspot"
              role="button"
              tabIndex={0}
              aria-label="聚焦网络与入口模块"
              onClick={() => onSelectCategory("network")}
              onKeyDown={(event) => handleModuleKeyDown(event, "network")}
            >
              <title>查看网络与入口模块</title>
              <rect className="machine-module-hit" x="368" y="292" width="120" height="66" />
              <path className="machine-module-leader" d="M368 326H310" />
              <circle className="machine-module-marker" cx="368" cy="326" r="4" />
              <rect className="machine-module-action" x="198" y="295" width="112" height="26" />
              <path className="machine-module-accent" d="M198 295H240" />
              <text className="machine-module-label" x="300" y="312" textAnchor="end">NETWORK / 网络</text>
            </g>

            <g
              className="machine-module-hotspot machine-load-group machine-load-hotspot"
              role="button"
              tabIndex={0}
              aria-label="聚焦 CPU 与内存模块"
              onClick={() => onSelectCategory("hardware")}
              onKeyDown={(event) => handleModuleKeyDown(event, "hardware")}
            >
              <title>查看 CPU 与内存模块</title>
              <rect className="machine-module-hit" x="456" y="256" width="224" height="136" />
              <path className="machine-module-leader" d="M516 256V186" />
              <circle className="machine-module-marker" cx="516" cy="256" r="4" />
              <rect className="machine-module-action" x="448" y="151" width="136" height="30" />
              <path className="machine-module-accent" d="M448 151H496" />
              <text className="machine-module-label" x="516" y="170" textAnchor="middle">CPU + RAM / 硬件</text>
            </g>

            <g
              className="machine-module-hotspot machine-load-group machine-load-hotspot"
              role="button"
              tabIndex={0}
              aria-label="聚焦 NVMe 数据模块"
              onClick={() => onSelectCategory("data")}
              onKeyDown={(event) => handleModuleKeyDown(event, "data")}
            >
              <title>查看 NVMe 数据模块</title>
              <rect className="machine-module-hit" x="546" y="204" width="152" height="52" />
              <path className="machine-module-leader" d="M698 246H722" />
              <circle className="machine-module-marker" cx="698" cy="246" r="4" />
              <rect className="machine-module-action" x="724" y="216" width="110" height="30" />
              <path className="machine-module-accent" d="M790 216H834" />
              <text className="machine-module-label" x="734" y="235">NVMe / 数据</text>
            </g>

            <g
              className="machine-module-hotspot machine-load-group machine-load-hotspot"
              role="button"
              tabIndex={0}
              aria-label="聚焦 GPU 与 AI 模块"
              onClick={() => onSelectCategory("agent")}
              onKeyDown={(event) => handleModuleKeyDown(event, "agent")}
            >
              <title>查看 GPU 与 AI 模块</title>
              <rect className="machine-module-hit" x="394" y="354" width="310" height="102" />
              <path className="machine-module-leader" d="M704 405H726" />
              <circle className="machine-module-marker" cx="704" cy="405" r="4" />
              <rect className="machine-module-action" x="728" y="375" width="106" height="30" />
              <path className="machine-module-accent" d="M790 375H834" />
              <text className="machine-module-label" x="738" y="394">GPU / AI</text>
            </g>

            <g
              className="machine-module-hotspot machine-load-group machine-load-hotspot"
              role="button"
              tabIndex={0}
              aria-label="聚焦 Docker 容器模块"
              onClick={() => onSelectCategory("containers")}
              onKeyDown={(event) => handleModuleKeyDown(event, "containers")}
            >
              <title>查看 Docker 容器模块</title>
              <rect className="machine-module-hit" x="386" y="466" width="300" height="76" />
              <path className="machine-module-leader" d="M536 542V566" />
              <circle className="machine-module-marker" cx="536" cy="542" r="4" />
              <rect className="machine-module-action" x="467" y="568" width="138" height="30" />
              <path className="machine-module-accent" d="M467 568H515" />
              <text className="machine-module-label" x="536" y="587" textAnchor="middle">DOCKER / 容器</text>
            </g>
          </g>
        ) : null}
      </svg>
    </motion.div>
  );
}

export function ServerExplodedStory({ categories, facts, visualOnly = false }: ServerExplodedStoryProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [activeCategoryId, setActiveCategoryId] = useState<ServerCategoryId>("network");
  const [selectedServiceId, setSelectedServiceId] = useState("tailscale");
  const [isExploded, setIsExploded] = useState(false);
  const [hasFocusedModule, setHasFocusedModule] = useState(false);
  const [openedServiceId, setOpenedServiceId] = useState<string | null>(null);

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId) ?? categories[0],
    [activeCategoryId, categories],
  );
  const selectedService = activeCategory.services.find((service) => service.id === selectedServiceId) ?? activeCategory.services[0];
  const openedService = activeCategory.services.find((service) => service.id === openedServiceId) ?? null;
  const activeVisual = categoryVisuals[activeCategory.id];
  const returningToOverview = hasFocusedModule && !isExploded;
  const connectorFrameRef = useRef<SVGSVGElement>(null);
  const focusImageRef = useRef<HTMLImageElement>(null);
  const focusVisualRef = useRef<HTMLDivElement>(null);
  const activeArt = focusArtwork[activeCategory.id];
  const FocusArt = activeArt?.Art;
  // Connectors avoid the artwork: an SVG illustration's silhouette, or a raster image's alpha.
  const maskSrc = useMemo(() => (activeArt ? silhouetteMaskSrc(activeArt) : activeVisual.src), [activeArt, activeVisual.src]);
  const [fittedConnectors, setFittedConnectors] = useState<{ src: string; layouts: readonly ConnectorLayout[] } | null>(null);
  const showsFocusVisual = visualOnly && isExploded && !openedService;
  const connectorLayouts = fittedConnectors?.src === maskSrc ? fittedConnectors.layouts : null;

  useEffect(() => {
    const prefetch = () => (Object.keys(categoryVisuals) as ServerCategoryId[]).forEach((id) => {
      const art = focusArtwork[id];
      void loadArtworkMask(art ? silhouetteMaskSrc(art) : categoryVisuals[id].src);
    });
    const timer = window.setTimeout(prefetch, 1200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showsFocusVisual) return;
    const frame = connectorFrameRef.current;
    const visual = focusVisualRef.current;
    const image = focusImageRef.current;
    if (!frame || !visual || (!activeArt && !image)) return;
    let cancelled = false;
    const src = maskSrc;
    const fit = async () => {
      const mask = await loadArtworkMask(src);
      if (cancelled) return;
      if (!mask) {
        setFittedConnectors({ src, layouts: serviceConnectorLayouts });
        return;
      }
      const box = activeArt
        ? measureArtworkBox(visual, activeArt.viewBox[2], activeArt.viewBox[3], frame)
        : image && measureArtworkBox(image, image.naturalWidth, image.naturalHeight, frame);
      const stage = frame.getBoundingClientRect();
      const cards = [...(frame.parentElement?.querySelectorAll<HTMLElement>(".server-story-module-list > li") ?? [])];
      if (!box || !stage.width || !stage.height || !cards.length) return;
      const placement = {
        cardWidth: (Math.max(...cards.map((card) => card.offsetWidth)) / stage.width) * 100,
        cardHeight: (Math.max(...cards.map((card) => card.offsetHeight)) / stage.height) * 100,
        pixelWidth: stage.width,
        pixelHeight: stage.height,
      };
      setFittedConnectors({
        src,
        layouts: serviceConnectorLayouts.map((layout, index) => placeConnector(layout, serviceCardSlides[index], mask, box, placement)),
      });
    };
    void fit();
    image?.addEventListener("load", fit);
    const observer = new ResizeObserver(() => void fit());
    observer.observe(frame);
    return () => {
      cancelled = true;
      image?.removeEventListener("load", fit);
      observer.disconnect();
    };
  }, [activeArt, maskSrc, showsFocusVisual]);

  const selectCategory = (category: ServerCategory) => {
    setHasFocusedModule(true);
    setIsExploded(true);
    setActiveCategoryId(category.id);
    setSelectedServiceId(category.services[0].id);
    setOpenedServiceId(null);
    prefetchServiceImages(category.services.map((service) => service.id));
  };

  const handleStageClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isExploded || !(event.target instanceof Element)) return;
    if (event.target.closest(".server-machine-part, .server-story-focus-heading, .server-story-module-list, .server-story-service-page-copy, .server-story-service-details, button, a")) return;
    if (openedServiceId) {
      setOpenedServiceId(null);
      return;
    }
    setIsExploded(false);
  };

  return (
    <section
      className={`server-topology server-story${visualOnly ? " is-visual-only" : ""}`}
      aria-labelledby="server-page-title"
      data-story-stage={activeCategoryId}
      data-story-exploded={isExploded ? "true" : "false"}
      data-story-overview-entry={hasFocusedModule ? "return" : "initial"}
      data-reduced-motion={reduceMotion ? "true" : "false"}
    >
      <div className="server-story-stage" onClick={handleStageClick}>
        <SceneLineOrnaments variant="server" />
        {visualOnly ? <h1 id="server-page-title" className="sr-only">我的服务器</h1> : null}
        {visualOnly ? null : <header className="server-story-heading">
          <div>
            <h1 id="server-page-title">我的服务器</h1>
            <p>一台自己组装、自己维护，也真正承载项目与生活的 Linux 主机。</p>
          </div>
          <dl className="server-story-facts" aria-label="服务器当前快照">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </header>}

        <div className="server-story-visual">
          <MachineDrawing
            activeCategoryId={activeCategoryId}
            isExploded={isExploded}
            returningToOverview={returningToOverview}
            reduceMotion={reduceMotion}
            visualOnly={visualOnly}
            onSelectCategory={(categoryId) => {
              const category = categories.find((item) => item.id === categoryId);
              if (category) selectCategory(category);
            }}
          />
        </div>

        {visualOnly ? (
          <AnimatePresence mode="sync">
            {isExploded && openedService ? (
              <motion.article
                key={`service-${activeCategory.id}-${openedService.id}`}
                className="server-story-service-page"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              >
                <button type="button" className="server-story-service-back" onClick={() => setOpenedServiceId(null)}>
                  <span aria-hidden="true">←</span>
                  返回 {activeCategory.label}
                </button>
                <motion.div
                  className="server-story-service-page-image"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.62, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ServerServiceArt serviceId={openedService.id} name={openedService.name} />
                </motion.div>
                <motion.div
                  className="server-story-service-page-copy"
                  initial={reduceMotion ? false : { opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span>{activeCategory.shortLabel} / {openedService.kind}</span>
                  <h2><BlurText text={openedService.name} delay={0.14} wrapWords /></h2>
                  <p>{openedService.description}</p>
                </motion.div>
                <motion.dl
                  className="server-story-service-details"
                  aria-label={`${openedService.name}部署详情`}
                  initial={reduceMotion ? false : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div data-service-detail="connection"><dt>连接关系</dt><dd>{openedService.connection}</dd></div>
                  <div data-service-detail="deployment"><dt>部署记录</dt><dd>{openedService.deployment}</dd></div>
                  <div data-service-detail="entry">
                    <dt>项目入口</dt>
                    <dd>
                      {openedService.entryUrl ? (
                        <a href={openedService.entryUrl} target="_blank" rel="noreferrer">
                          {openedService.entryLabel}
                        </a>
                      ) : (
                        <span>{openedService.entryLabel}</span>
                      )}
                    </dd>
                  </div>
                </motion.dl>
              </motion.article>
            ) : isExploded ? (
              <motion.div
                key={`focus-${activeCategory.id}`}
                className="server-story-focus-copy"
                initial={false}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0 }}
              >
                <motion.header
                  className="server-story-focus-heading"
                  initial={reduceMotion ? false : { opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.56, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h2><BlurText text={activeCategory.label} delay={0.2} wrapWords /></h2>
                  <p>{activeCategory.description}</p>
                </motion.header>

                <motion.div
                  ref={focusVisualRef}
                  className="server-story-focus-visual"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.86 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.58, delay: 0, ease: [0.16, 1, 0.3, 1] }}
                >
                  {activeArt && FocusArt ? (
                    <svg className="server-machine original-refined server-focus-art" viewBox={activeArt.viewBox.join(" ")} role="img" aria-label={activeVisual.alt}>
                      <FocusArtDefinitions />
                      <FocusArt />
                    </svg>
                  ) : (
                    <img ref={focusImageRef} src={activeVisual.src} alt={activeVisual.alt} />
                  )}
                </motion.div>

                <svg ref={connectorFrameRef} className="server-story-service-connectors" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  {connectorLayouts && activeCategory.services.map((service, index) => {
                    const connector = connectorLayouts[index];
                    return (
                      <g key={service.id}>
                        {connector.segments.map(([x1, y1, x2, y2], segmentIndex) => (
                          <motion.line
                            key={segmentIndex}
                            x1={x1}
                            y1={y1}
                            initial={reduceMotion ? false : { x2: x1, y2: y1, opacity: 0 }}
                            animate={{ x2, y2, opacity: 1 }}
                            transition={reduceMotion
                              ? { duration: 0 }
                              : { duration: 0.16, delay: 0.12 + segmentIndex * 0.12, ease: [0.4, 0, 0.2, 1] }}
                          />
                        ))}
                        {connector.anchor ? (
                          // Zero-length round-capped strokes stay circular under preserveAspectRatio="none".
                          <motion.g
                            className="server-story-connector-anchor"
                            initial={reduceMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={reduceMotion ? { duration: 0 } : { duration: 0.2, delay: 0.1 }}
                          >
                            <line className="server-story-connector-anchor-ring" x1={connector.anchor[0]} y1={connector.anchor[1]} x2={connector.anchor[0]} y2={connector.anchor[1]} />
                            <line className="server-story-connector-anchor-core" x1={connector.anchor[0]} y1={connector.anchor[1]} x2={connector.anchor[0]} y2={connector.anchor[1]} />
                          </motion.g>
                        ) : null}
                        <motion.circle
                          cx={connector.endX}
                          cy={connector.endY}
                          r="0.3"
                          initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={reduceMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 430, damping: 24, delay: 0.46 }}
                          style={{ transformBox: "fill-box", transformOrigin: "center" }}
                        />
                      </g>
                    );
                  })}
                </svg>

                <ul className="server-story-module-list" aria-label={`${activeCategory.label}模块`}>
                  {activeCategory.services.map((service, index) => (
                    <motion.li
                      key={service.id}
                      style={connectorLayouts ? { left: `${connectorLayouts[index].endX}%`, top: `${connectorLayouts[index].endY}%` } : undefined}
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 320, damping: 25, delay: 0.46 }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedServiceId(service.id);
                          setOpenedServiceId(service.id);
                        }}
                        aria-label={`查看 ${service.name} 介绍`}
                        onPointerEnter={() => prefetchServiceImage(service.id)}
                        onFocus={() => prefetchServiceImage(service.id)}
                        onTouchStart={() => prefetchServiceImage(service.id)}
                      >
                        <span className="server-story-module-index">{String(index + 1).padStart(2, "0")}</span>
                        <span className="server-story-module-copy">
                          <span>
                            <strong>{service.name}</strong>
                            <em>{service.kind}</em>
                          </span>
                          <small>{service.connection}</small>
                        </span>
                        <span className="server-story-module-arrow" aria-hidden="true">↗</span>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ) : (
              <motion.div
                key="overview"
                className="server-story-overview-copy"
                initial={reduceMotion ? false : { opacity: 0, y: returningToOverview ? 10 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: 18, transition: { duration: 0.22, delay: 0 } }}
                transition={reduceMotion
                  ? { duration: 0 }
                  : { duration: returningToOverview ? 0.42 : 0.58, delay: returningToOverview ? 0.12 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="server-story-overview-heading">
                  <h2>{returningToOverview ? "我的服务器" : <BlurText text="我的服务器" delay={0.18} />}</h2>
                  <p>自己组装、自己维护，也真正承载项目与生活的 Linux 主机。</p>
                </div>
                <dl className="server-story-overview-facts" aria-label="服务器当前快照">
                  {facts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            )}
          </AnimatePresence>
        ) : null}

        {visualOnly ? null : <aside className="server-story-panel" aria-live="polite">
          <div className="server-story-panel-heading">
            <span aria-hidden="true">{activeCategory.icon}</span>
            <div>
              <small>{activeCategory.shortLabel}</small>
              <h2>{activeCategory.label}</h2>
            </div>
          </div>
          <p className="server-story-category-copy">{activeCategory.description}</p>

          <div className="server-story-services" aria-label={`${activeCategory.label}节点`}>
            {activeCategory.services.map((service) => {
              const isSelected = selectedService.id === service.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  className={`topology-satellite${isSelected ? " is-selected" : ""}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedServiceId(service.id)}
                  onPointerMove={() => setSelectedServiceId(service.id)}
                  onFocus={() => setSelectedServiceId(service.id)}
                >
                  <strong>{service.name}</strong>
                  <small>{service.kind}</small>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${activeCategory.id}-${selectedService.id}`}
              className="server-story-service-detail"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3>{selectedService.name}</h3>
              <p>{selectedService.description}</p>
              <span>{selectedService.connection}</span>
            </motion.div>
          </AnimatePresence>
        </aside>}

        {visualOnly ? null : <nav className="server-story-nav" aria-label="服务器结构章节">
          {categoryOrder.map((categoryId) => {
            const category = categories.find((item) => item.id === categoryId);
            if (!category) return null;
            return (
              <button
                key={category.id}
                type="button"
                className={`topology-category${activeCategoryId === category.id ? " is-active" : ""}`}
                data-topology-connector={category.id}
                aria-pressed={activeCategoryId === category.id}
                aria-current={activeCategoryId === category.id ? "step" : undefined}
                onClick={() => selectCategory(category)}
              >
                <span aria-hidden="true">{category.icon}</span>
                {category.label}
              </button>
            );
          })}
        </nav>}
      </div>
    </section>
  );
}
