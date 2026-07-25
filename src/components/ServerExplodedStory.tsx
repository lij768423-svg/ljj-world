import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { BlurText } from "./effects/BlurText";
import { SceneLineOrnaments } from "./effects/SceneLineOrnaments";

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
  network: { src: "/assets/server-parts/nic-line.png", alt: "服务器双口网卡线稿" },
  hardware: { src: "/assets/server-parts/cpu-line.png", alt: "服务器处理器线稿" },
  agent: { src: "/assets/server-parts/gpu-line.png", alt: "服务器显卡线稿" },
  data: { src: "/assets/server-parts/nvme-line.png", alt: "服务器 NVMe 存储线稿" },
  containers: { src: "/assets/server-parts/container-line.png", alt: "服务器容器运行核心线稿" },
};

const serviceConnectorLayouts = [
  { segments: [[43, 38, 38, 31], [38, 31, 38, 22], [38, 22, 31, 22]], endX: 31, endY: 22 },
  { segments: [[57, 38, 62, 31], [62, 31, 62, 22], [62, 22, 69, 22]], endX: 69, endY: 22 },
  { segments: [[63, 50, 72, 50], [72, 50, 77, 50], [77, 50, 84, 50]], endX: 84, endY: 50 },
  { segments: [[57, 62, 62, 69], [62, 69, 62, 78], [62, 78, 69, 78]], endX: 69, endY: 78 },
  { segments: [[43, 62, 38, 69], [38, 69, 38, 78], [38, 78, 31, 78]], endX: 31, endY: 78 },
] as const;

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
      <svg className="server-machine" viewBox="0 0 1000 640" role="img" aria-label="home-serve 主机分层爆炸结构图">
        <defs>
          <pattern id="server-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" className="machine-grid-line" />
          </pattern>
          <filter id="server-line-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodOpacity="0.08" />
          </filter>
          <pattern id="server-vent" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0V8" className="machine-vent-line" />
          </pattern>
        </defs>

        <g className="machine-load-group machine-load-backdrop">
          <rect className="machine-grid-surface" x="62" y="34" width="876" height="572" fill="url(#server-grid)" opacity="0.55" />
          <circle className="machine-orbit machine-orbit-a" cx="500" cy="320" r="262" />
          <circle className="machine-orbit machine-orbit-b" cx="500" cy="320" r="212" />
          <path className="machine-axis" d="M98 320H902M500 62V578" />
          <g className="machine-rotor-disc" aria-hidden="true">
            <circle className="machine-rotor-ring machine-rotor-ring-outer" cx="500" cy="320" r="292" />
            <circle className="machine-rotor-ring machine-rotor-ring-mid" cx="500" cy="320" r="274" />
            <circle className="machine-rotor-ring machine-rotor-ring-inner" cx="500" cy="320" r="228" />
            {Array.from({ length: 12 }, (_, tickIndex) => (
              <path
                key={tickIndex}
                className="machine-rotor-tick"
                d="M500 28V52"
                transform={`rotate(${tickIndex * 30} 500 320)`}
              />
            ))}
          </g>
        </g>

        <motion.g className="server-machine-part server-machine-shell" animate={{ x: exploded * -210, rotate: exploded * -5 }} transition={movementTransition}>
          <g className="machine-load-group machine-load-shell">
            <path className="machine-panel" d="M286 128H680L752 190V500L680 554H286L232 500V190Z" filter="url(#server-line-shadow)" />
            <path className="machine-panel-flow" d="M278 116H688L766 182V508L688 566H278L218 508V182Z" />
            <path d="M286 128L350 190H752M286 554L350 500H752M350 190V500" />
            <path className="machine-detail" d="M248 204H334V486H248M270 217V472M302 217V472M723 208V482M699 208V482" />
            <path className="machine-detail" d="M259 230H322M259 258H322M259 286H322M259 314H322M259 342H322M259 370H322M259 398H322M259 426H322M259 454H322" />
            <rect className="machine-vent" x="255" y="220" width="72" height="260" fill="url(#server-vent)" />
            <circle className="machine-screw" cx="368" cy="208" r="4" />
            <circle className="machine-screw" cx="730" cy="208" r="4" />
            <circle className="machine-screw" cx="368" cy="482" r="4" />
            <circle className="machine-screw" cx="730" cy="482" r="4" />
            <text x="252" y="522">OPEN FRAME / HOME-SERVE</text>
          </g>
        </motion.g>

        <motion.g className="server-machine-part server-machine-board" animate={{ x: exploded * -24 }} transition={movementTransition}>
          <g className="machine-load-group machine-load-board">
            <path className="machine-board-fill" d="M360 198H670L704 228V445L676 470H360Z" />
            <path d="M360 198H670L704 228V445L676 470H360ZM374 214H660L687 238V434L665 452H374Z" />
            <path className="machine-detail" d="M382 224H437V258H382ZM382 268H421V292H382ZM628 278H674V326H628ZM382 414H438V442H382Z" />
            <path className="machine-detail" d="M396 231H424M396 240H424M641 292H661M641 302H661M641 312H661M396 423H425M396 432H425" />
            <path className="machine-trace machine-trace-a" d="M437 240H472V225H583V249H627M421 280H448V319H470M438 428H473V407H536M608 339H670V362H684M400 392H455V370H633M517 225V249M552 225V249" />
            <path className="machine-trace machine-trace-b" d="M448 291V337H418V382M665 326V345H621M575 432H657V414H682" />
            <path className="machine-scan-line" d="M366 206H688" />
            <g className="machine-board-nodes" aria-hidden="true">
              <circle cx="470" cy="319" r="2.6" />
              <circle cx="536" cy="407" r="2.6" />
              <circle cx="621" cy="345" r="2.6" />
              <circle cx="583" cy="249" r="2.6" />
            </g>
            <circle className="machine-screw" cx="378" cy="216" r="5" />
            <circle className="machine-screw" cx="663" cy="216" r="5" />
            <circle className="machine-screw" cx="378" cy="448" r="5" />
            <circle className="machine-screw" cx="663" cy="448" r="5" />
            <text x="368" y="489">ATX MAINBOARD / LINUX</text>
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-cpu${activeCategoryId === "hardware" ? " is-active" : ""}`} animate={{ y: exploded * -118 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            <rect className="machine-component-fill" x="466" y="266" width="100" height="100" />
            <rect x="476" y="276" width="80" height="80" />
            <rect className="machine-chip" x="486" y="286" width="60" height="60" />
            <path className="machine-detail" d="M476 289H466M476 307H466M476 325H466M476 343H466M556 289H566M556 307H566M556 325H566M556 343H566" />
            <path className="machine-detail" d="M489 276V266M507 276V266M525 276V266M543 276V266M489 356V366M507 356V366M525 356V366M543 356V366" />
            <path d="M558 278H576V351H558" />
            <circle className="machine-screw" cx="570" cy="287" r="3" />
            <text x="516" y="312" textAnchor="middle">RYZEN 9</text>
            <text x="516" y="330" textAnchor="middle">9950X</text>
          </g>
          <g className="machine-real-layer">
            <image className="machine-real-image" href="/assets/server-parts/cpu-line.png" x="353" y="132" width="360" height="360" preserveAspectRatio="xMidYMid meet" />
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-ram${activeCategoryId === "hardware" ? " is-active" : ""}`} animate={{ x: exploded * 112, y: exploded * -60 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            {[586, 608, 630, 652].map((x) => (
              <g key={x}>
                <rect className="machine-component-fill" x={x} y="268" width="14" height="112" />
                <path className="machine-detail" d={`M${x + 3} 281H${x + 11}M${x + 3} 300H${x + 11}M${x + 3} 319H${x + 11}M${x + 3} 338H${x + 11}M${x + 3} 357H${x + 11}`} />
              </g>
            ))}
            <path className="machine-detail" d="M582 260H670M582 388H670" />
            <text x="626" y="402" textAnchor="middle">4 x DDR5 / 59 GiB</text>
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-nic${activeCategoryId === "network" ? " is-active" : ""}`} animate={{ x: exploded * -155, y: exploded * 76 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            <path className="machine-component-fill" d="M374 298H458L474 314V350H374Z" />
            <rect className="machine-chip" x="388" y="310" width="29" height="25" />
            <path d="M424 308H452V338H424ZM431 315H445V331H431M458 315H482V342H458" />
            <path className="machine-detail" d="M388 342H454M396 342V350M408 342V350M420 342V350M432 342V350M444 342V350" />
            <path className="machine-flow" d="M392 326H334C304 326 296 328 266 328H220" />
            <circle cx="220" cy="328" r="6" /><circle cx="266" cy="328" r="3" />
            <text x="426" y="368" textAnchor="middle">2.5 GbE / I226-V</text>
          </g>
          <g className="machine-real-layer">
            <image className="machine-real-image" href="/assets/server-parts/nic-line.png" x="295" y="252" width="330" height="330" preserveAspectRatio="xMidYMid meet" />
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-gpu${activeCategoryId === "agent" ? " is-active" : ""}`} animate={{ x: exploded * 178, y: exploded * 84 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            <path className="machine-component-fill" d="M400 362H658L678 378V432L660 448H400Z" />
            <path d="M414 374H644L663 387V420L648 435H414Z" />
            {[474, 584].map((x, fanIndex) => (
              <g key={x} className={`machine-gpu-fan${fanIndex === 1 ? " is-reverse" : ""}`} transform={`translate(${x} 405)`}>
                <circle className="machine-fan-bezel" r="31" />
                <g className="machine-fan-rotor">
                  {Array.from({ length: 4 }, (_, bladeIndex) => (
                    <path
                      key={bladeIndex}
                      className="machine-fan-blade"
                      transform={`rotate(${bladeIndex * 90})`}
                      d="M-2-8C0-16 7-25 18-25C22-18 19-10 14-4C10 1 5 5 1 8C3 2 3-4-2-8Z"
                    />
                  ))}
                  <circle className="machine-fan-hub" r="7" />
                </g>
              </g>
            ))}
            <path className="machine-detail" d="M415 381H437M415 389H437M621 381H645M621 389H645M621 421H645M621 429H645" />
            <path d="M678 384H696V425H678M432 448V458H598V448" />
            <path className="machine-flow" d="M696 405H730C758 405 764 370 792 370H838" />
            <text x="534" y="474" textAnchor="middle">RTX 5060 Ti / LOCAL AI</text>
          </g>
          <g className="machine-real-layer">
            <image className="machine-real-image" href="/assets/server-parts/gpu-line.png" x="343" y="265" width="400" height="300" preserveAspectRatio="xMidYMid meet" />
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-storage${activeCategoryId === "data" ? " is-active" : ""}`} animate={{ x: exploded * 218, y: exploded * -112 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            <path className="machine-component-fill" d="M552 218H676L690 232V260L676 274H552Z" />
            <rect className="machine-chip" x="566" y="229" width="30" height="34" />
            <rect className="machine-chip" x="603" y="229" width="30" height="34" />
            <rect className="machine-chip" x="640" y="229" width="22" height="34" />
            <path className="machine-detail" d="M570 236H592M570 244H592M570 252H592M607 236H629M607 244H629M607 252H629" />
            <circle className="machine-screw" cx="677" cy="246" r="4" />
            <path className="machine-flow" d="M690 246H734C762 246 768 210 796 210H842" />
            <text x="621" y="295" textAnchor="middle">3.6 TB NVMe ARRAY</text>
          </g>
          <g className="machine-real-layer">
            <image className="machine-real-image" href="/assets/server-parts/nvme-line.png" x="431" y="110" width="420" height="300" preserveAspectRatio="xMidYMid meet" />
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-fans${activeCategoryId === "containers" ? " is-active" : ""}`} animate={{ y: exploded * 146 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            <path className="machine-fan-deck-side" d="M380 508L400 526H658L678 504V518L660 538H399L380 520Z" />
            <path className="machine-component-fill machine-fan-deck" d="M392 484H650L678 504L658 526H400L380 508Z" />
            {[438, 528, 618].map((x, fanIndex) => (
              <g key={x} className={`machine-fan${fanIndex === 1 ? " is-reverse" : ""}`} transform={`translate(${x} 506) skewX(-8) scale(1 .46)`}>
                <circle className="machine-fan-bezel" r="33" />
                <g className="machine-fan-rotor">
                  {Array.from({ length: 4 }, (_, bladeIndex) => (
                    <path
                      key={bladeIndex}
                      className="machine-fan-blade"
                      transform={`rotate(${bladeIndex * 90})`}
                      d="M-2-8C0-17 7-27 19-27C23-20 20-11 15-4C11 1 5 6 1 9C3 2 3-4-2-8Z"
                    />
                  ))}
                  <circle className="machine-fan-hub" r="7" />
                </g>
              </g>
            ))}
            <path className="machine-detail" d="M394 490H410M389 516H405M646 490H660M649 520H663" />
            <text x="528" y="558" textAnchor="middle">AIRFLOW / 70 CONTAINERS</text>
          </g>
          <g className="machine-real-layer">
            <image className="machine-real-image" href="/assets/server-parts/container-line.png" x="315" y="353" width="420" height="260" preserveAspectRatio="xMidYMid meet" />
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

  const selectCategory = (category: ServerCategory) => {
    setHasFocusedModule(true);
    setIsExploded(true);
    setActiveCategoryId(category.id);
    setSelectedServiceId(category.services[0].id);
    setOpenedServiceId(null);
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
                <motion.img
                  className="server-story-service-page-image"
                  src={activeVisual.src}
                  alt={activeVisual.alt}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.62, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                />
                <motion.div
                  className="server-story-service-page-copy"
                  initial={reduceMotion ? false : { opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span>{activeCategory.shortLabel} / {openedService.kind}</span>
                  <h2><BlurText text={openedService.name} delay={0.14} /></h2>
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
                  <h2><BlurText text={activeCategory.label} delay={0.2} /></h2>
                  <p>{activeCategory.description}</p>
                </motion.header>

                <motion.div
                  className="server-story-focus-visual"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.86 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.58, delay: 0, ease: [0.16, 1, 0.3, 1] }}
                >
                  <img src={activeVisual.src} alt={activeVisual.alt} />
                </motion.div>

                <svg className="server-story-service-connectors" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  {activeCategory.services.map((service, index) => {
                    const connector = serviceConnectorLayouts[index];
                    return (
                      <g key={service.id}>
                        {connector.segments.map(([x1, y1, x2, y2], segmentIndex) => (
                          <motion.line
                            key={`${x1}-${y1}-${x2}-${y2}`}
                            x1={x1}
                            y1={y1}
                            initial={reduceMotion ? false : { x2: x1, y2: y1, opacity: 0 }}
                            animate={{ x2, y2, opacity: 1 }}
                            transition={reduceMotion
                              ? { duration: 0 }
                              : { duration: 0.16, delay: 0.12 + segmentIndex * 0.12, ease: [0.4, 0, 0.2, 1] }}
                          />
                        ))}
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
                initial={reduceMotion || returningToOverview ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: 18, transition: { duration: 0.22, delay: 0 } }}
                transition={reduceMotion || returningToOverview
                  ? { duration: 0 }
                  : { duration: 0.58, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
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
