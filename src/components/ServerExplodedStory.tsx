import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { BlurText } from "./effects/BlurText";
import { SceneLineOrnaments } from "./effects/SceneLineOrnaments";
import { ServerServiceArt } from "./ServerServiceArt";

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
  { segments: [[63, 50, 72, 50], [72, 50, 77, 50], [77, 50, 82, 50]], endX: 82, endY: 50 },
  { segments: [[57, 62, 62, 69], [62, 69, 62, 78], [62, 78, 69, 78]], endX: 69, endY: 78 },
  { segments: [[43, 62, 38, 69], [38, 69, 38, 78], [38, 78, 31, 78]], endX: 31, endY: 78 },
] as const;

function FanGraphic({
  x,
  y,
  r = 31,
  blades = 7,
  reverse = false,
  className = "machine-fan",
  skew = false,
  framed = false,
}: {
  x: number;
  y: number;
  r?: number;
  blades?: number;
  reverse?: boolean;
  className?: string;
  skew?: boolean;
  framed?: boolean;
}) {
  const inner = r * 0.32;
  const outer = r * 0.88;
  const blade = [
    `M${(r * 0.04).toFixed(1)} ${(-inner).toFixed(1)}`,
    `C ${(r * 0.3).toFixed(1)} ${(-r * 0.4).toFixed(1)} ${(r * 0.5).toFixed(1)} ${(-r * 0.7).toFixed(1)} ${(r * 0.2).toFixed(1)} ${(-outer).toFixed(1)}`,
    `C ${(r * 0.4).toFixed(1)} ${(-r * 0.58).toFixed(1)} ${(r * 0.26).toFixed(1)} ${(-r * 0.32).toFixed(1)} ${(r * 0.1).toFixed(1)} ${(-inner * 0.52).toFixed(1)}`,
    `C ${(r * 0.06).toFixed(1)} ${(-inner * 0.76).toFixed(1)} ${(r * 0.04).toFixed(1)} ${(-inner).toFixed(1)} ${(r * 0.04).toFixed(1)} ${(-inner).toFixed(1)}Z`,
  ].join("");
  const corner = r + 3;
  return (
    <g className={`${className}${reverse ? " is-reverse" : ""}`} transform={skew ? `translate(${x} ${y}) skewX(-8) scale(1 .52)` : `translate(${x} ${y})`}>
      {framed ? (
        <rect className="machine-fan-bezel" x={-corner} y={-corner} width={corner * 2} height={corner * 2} rx="3" />
      ) : (
        <circle className="machine-fan-bezel" r={r} />
      )}
      <circle className="machine-detail" r={r * 0.92} />
      <g className="machine-fan-rotor">
        {Array.from({ length: blades }, (_, bladeIndex) => (
          <path key={bladeIndex} className="machine-fan-blade" transform={`rotate(${(bladeIndex * 360) / blades})`} d={blade} />
        ))}
        <circle className="machine-fan-hub" r={inner} />
        <circle className="machine-detail" r={inner * 0.42} />
      </g>
      {framed ? (
        <>
          <circle className="machine-screw" cx={-corner + 3.5} cy={-corner + 3.5} r="1.6" />
          <circle className="machine-screw" cx={corner - 3.5} cy={-corner + 3.5} r="1.6" />
          <circle className="machine-screw" cx={-corner + 3.5} cy={corner - 3.5} r="1.6" />
          <circle className="machine-screw" cx={corner - 3.5} cy={corner - 3.5} r="1.6" />
        </>
      ) : null}
    </g>
  );
}

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
            <path className="machine-inner-lip" d="M302 146H666L734 204V486L666 538H302L250 486V204Z" />
            <path className="machine-panel-flow" d="M278 116H688L766 182V508L688 566H278L218 508V182Z" />
            <path d="M286 128L350 190H752M286 554L350 500H752M350 190V500" />
            <path className="machine-detail" d="M248 204H338V486H248M262 216V474M290 216V474M318 216V474M722 206V486M698 206V486" />
            <rect className="machine-vent" x="254" y="222" width="78" height="168" fill="url(#server-vent)" />
            <path className="machine-detail" d="M262 236H324M262 258H324M262 280H324M262 302H324M262 324H324M262 346H324M262 368H324" />
            <g className="machine-front-io">
              <rect className="machine-chip" x="258" y="188" width="68" height="26" rx="2" />
              <rect className="machine-detail" x="266" y="196" width="14" height="10" rx="1" />
              <rect className="machine-detail" x="284" y="196" width="14" height="10" rx="1" />
              <circle className="machine-screw" cx="312" cy="201" r="3.2" />
              <circle cx="322" cy="201" r="2.2" />
            </g>
            <g className="machine-psu">
              <path className="machine-component-fill" d="M250 398H334V476H250Z" />
              <path className="machine-detail" d="M258 408H326M258 418H326M258 428H326M258 438H326M258 448H326" />
              <rect className="machine-chip" x="270" y="452" width="28" height="14" rx="1" />
              <circle className="machine-screw" cx="260" cy="406" r="2.4" />
              <circle className="machine-screw" cx="324" cy="406" r="2.4" />
              <circle className="machine-screw" cx="260" cy="468" r="2.4" />
              <circle className="machine-screw" cx="324" cy="468" r="2.4" />
            </g>
            <path className="machine-detail" d="M360 136H606M372 136V150H594V136" />
            <path className="machine-detail" d="M368 200H384V216H368ZM716 200H732V216H716ZM368 468H384V484H368ZM716 468H732V484H716Z" />
            <circle className="machine-screw" cx="368" cy="208" r="4" />
            <circle className="machine-screw" cx="730" cy="208" r="4" />
            <circle className="machine-screw" cx="368" cy="482" r="4" />
            <circle className="machine-screw" cx="730" cy="482" r="4" />
            <text x="252" y="522">LIAN LI B4 / HOME-SERVE</text>
          </g>
        </motion.g>

        <motion.g className="server-machine-part server-machine-board" animate={{ x: exploded * -24 }} transition={movementTransition}>
          <g className="machine-load-group machine-load-board">
            <path className="machine-board-fill" d="M360 198H670L704 228V445L676 470H360Z" />
            <path d="M360 198H670L704 228V445L676 470H360ZM374 214H660L687 238V434L665 452H374Z" />
            <path className="machine-heatsink" d="M382 224H448V262H382Z" />
            <path className="machine-detail" d="M390 230H440M390 236H440M390 242H440M390 248H440M390 254H440" />
            <path className="machine-chip" d="M382 272H424V304H382Z" />
            <path className="machine-detail" d="M388 278H418M388 286H418M388 294H418" />
            <path className="machine-heatsink" d="M488 348H548V376H488Z" />
            <path className="machine-detail" d="M494 354H542M494 360H542M494 366H542" />
            <path className="machine-pcie" d="M400 356H656V368H400Z" />
            <path className="machine-detail" d="M408 359H420V365H408ZM428 359H440V365H428ZM448 359H460V365H448ZM468 359H480V365H468ZM488 359H500V365H488ZM508 359H520V365H508ZM528 359H540V365H528ZM548 359H560V365H548ZM568 359H580V365H568ZM588 359H600V365H588ZM608 359H620V365H608ZM628 359H640V365H628Z" />
            <path className="machine-chip" d="M382 412H438V442H382Z" />
            <path className="machine-detail" d="M390 418H430M390 426H430M390 434H430" />
            <circle className="machine-chip" cx="456" cy="428" r="10" />
            <circle className="machine-detail" cx="456" cy="428" r="4" />
            <path className="machine-detail" d="M360 248H378V268H360ZM360 272H378V304H360Z" />
            <path className="machine-detail" d="M582 260H674V268H582ZM582 388H674V396H582Z" />
            <path className="machine-trace machine-trace-a" d="M448 242H476V226H584V250H628M424 288H452V320H470M438 428H476V408H538M608 338H670V362H684M400 394H456V372H634M518 226V250M552 226V250" />
            <path className="machine-trace machine-trace-b" d="M452 292V338H418V382M666 326V346H622M576 432H658V414H682M548 376V408" />
            <path className="machine-scan-line" d="M366 206H688" />
            <g className="machine-board-nodes" aria-hidden="true">
              <circle cx="470" cy="319" r="2.6" />
              <circle cx="536" cy="407" r="2.6" />
              <circle cx="621" cy="345" r="2.6" />
              <circle cx="583" cy="249" r="2.6" />
              <circle cx="518" cy="376" r="2.2" />
            </g>
            <circle className="machine-screw" cx="378" cy="216" r="5" />
            <circle className="machine-screw" cx="663" cy="216" r="5" />
            <circle className="machine-screw" cx="378" cy="448" r="5" />
            <circle className="machine-screw" cx="663" cy="448" r="5" />
            <text x="368" y="489">ATX / X870E / LINUX</text>
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-cpu${activeCategoryId === "hardware" ? " is-active" : ""}`} animate={{ y: exploded * -118 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            <rect className="machine-component-fill" x="466" y="266" width="100" height="100" rx="3" />
            <rect x="476" y="276" width="80" height="80" rx="2" />
            <rect className="machine-chip" x="488" y="288" width="56" height="56" rx="2" />
            <rect className="machine-detail" x="500" y="300" width="32" height="32" />
            <path className="machine-detail" d="M476 288H466M476 300H466M476 312H466M476 324H466M476 336H466M476 348H466M556 288H566M556 300H566M556 312H566M556 324H566M556 336H566M556 348H566" />
            <path className="machine-detail" d="M488 276V266M500 276V266M512 276V266M524 276V266M536 276V266M548 276V266M488 356V366M500 356V366M512 356V366M524 356V366M536 356V366M548 356V366" />
            <path d="M558 278H578V352H558" />
            <circle className="machine-screw" cx="480" cy="280" r="2.4" />
            <circle className="machine-screw" cx="552" cy="280" r="2.4" />
            <circle className="machine-screw" cx="480" cy="352" r="2.4" />
            <circle className="machine-screw" cx="552" cy="352" r="2.4" />
            <circle className="machine-screw" cx="572" cy="288" r="3" />
            <text x="516" y="314" textAnchor="middle">RYZEN 9</text>
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
                <rect className="machine-component-fill" x={x} y="268" width="14" height="112" rx="1" />
                <path className="machine-heatsink" d={`M${x + 1.5} 274H${x + 12.5}V372H${x + 1.5}Z`} />
                <path className="machine-detail" d={`M${x + 3} 282H${x + 11}M${x + 3} 296H${x + 11}M${x + 3} 310H${x + 11}M${x + 3} 324H${x + 11}M${x + 3} 338H${x + 11}M${x + 3} 352H${x + 11}M${x + 3} 366H${x + 11}`} />
                <path className="machine-detail" d={`M${x + 4} 268V262M${x + 10} 268V262M${x + 4} 380V386M${x + 10} 380V386`} />
              </g>
            ))}
            <path className="machine-detail" d="M582 260H670M582 388H670" />
            <text x="626" y="402" textAnchor="middle">4 x DDR5 / 59 GiB</text>
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-nic${activeCategoryId === "network" ? " is-active" : ""}`} animate={{ x: exploded * -155, y: exploded * 76 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            <path className="machine-component-fill" d="M374 298H458L474 314V350H374Z" />
            <rect className="machine-chip" x="386" y="308" width="28" height="24" rx="1" />
            <path className="machine-detail" d="M390 314H410M390 320H410M390 326H410" />
            <rect className="machine-chip" x="424" y="308" width="26" height="28" rx="1" />
            <rect className="machine-detail" x="429" y="314" width="7" height="16" rx="1" />
            <rect className="machine-detail" x="438" y="314" width="7" height="16" rx="1" />
            <circle cx="432.5" cy="312" r="1.2" />
            <circle cx="441.5" cy="312" r="1.2" />
            <path className="machine-pcie" d="M458 316H484V342H458Z" />
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
            <path className="machine-heatsink" d="M508 380H550V430H508Z" />
            <path className="machine-detail" d="M512 386H546M512 392H546M512 398H546M512 404H546M512 410H546M512 416H546M512 422H546" />
            <FanGraphic x={474} y={405} r={30} blades={9} className="machine-gpu-fan" />
            <FanGraphic x={584} y={405} r={30} blades={9} reverse className="machine-gpu-fan" />
            <path className="machine-detail" d="M416 380H438M416 388H438M622 380H646M622 388H646M622 422H646M622 430H646" />
            <path className="machine-pcie" d="M432 448V458H598V448" />
            <path d="M678 384H698V426H678" />
            <path className="machine-chip" d="M682 392H694V410H682Z" />
            <path className="machine-flow" d="M698 405H730C758 405 764 370 792 370H838" />
            <text x="534" y="474" textAnchor="middle">RTX 4090 / LOCAL AI</text>
          </g>
          <g className="machine-real-layer">
            <image className="machine-real-image" href="/assets/server-parts/gpu-line.png" x="343" y="265" width="400" height="300" preserveAspectRatio="xMidYMid meet" />
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-storage${activeCategoryId === "data" ? " is-active" : ""}`} animate={{ x: exploded * 218, y: exploded * -112 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            <path className="machine-component-fill" d="M552 218H676L690 232V260L676 274H552Z" />
            <path className="machine-heatsink" d="M560 224H672V268H560Z" />
            <rect className="machine-chip" x="566" y="230" width="22" height="22" rx="1" />
            <rect className="machine-chip" x="592" y="230" width="22" height="22" rx="1" />
            <rect className="machine-chip" x="618" y="230" width="22" height="22" rx="1" />
            <rect className="machine-chip" x="644" y="230" width="16" height="22" rx="1" />
            <path className="machine-detail" d="M568 254H584M594 254H610M620 254H636" />
            <circle className="machine-screw" cx="677" cy="246" r="4" />
            <path className="machine-flow" d="M690 246H734C762 246 768 210 796 210H842" />
            <text x="621" y="295" textAnchor="middle">5.4 TB NVMe ARRAY</text>
          </g>
          <g className="machine-real-layer">
            <image className="machine-real-image" href="/assets/server-parts/nvme-line.png" x="431" y="110" width="420" height="300" preserveAspectRatio="xMidYMid meet" />
          </g>
        </motion.g>

        <motion.g className={`server-machine-part server-machine-fans${activeCategoryId === "containers" ? " is-active" : ""}`} animate={{ y: exploded * 146 }} transition={movementTransition}>
          <g className="machine-wire machine-load-group machine-load-component">
            <path className="machine-fan-deck-side" d="M380 508L400 526H658L678 504V518L660 538H399L380 520Z" />
            <path className="machine-component-fill machine-fan-deck" d="M392 484H650L678 504L658 526H400L380 508Z" />
            <path className="machine-detail" d="M404 496H646M412 512H638M420 522H630" />
            <FanGraphic x={438} y={506} r={28} blades={7} skew framed />
            <FanGraphic x={528} y={506} r={28} blades={7} reverse skew framed />
            <FanGraphic x={618} y={506} r={28} blades={7} skew framed />
            <path className="machine-detail" d="M394 490H412M388 516H406M644 490H662M648 520H666" />
            <text x="528" y="558" textAnchor="middle">AIRFLOW / 119 CONTAINERS</text>
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
