import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { GithubLogo } from "@phosphor-icons/react/GithubLogo";
import { GlobeHemisphereWest } from "@phosphor-icons/react/GlobeHemisphereWest";
import { X } from "@phosphor-icons/react/X";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import * as THREE from "three";

type HelixPreview = {
  image: string;
  alt: string;
  width: number;
  height: number;
  srcSet?: string;
  fit?: "cover" | "contain";
  position?: string;
};

export type HelixProject = {
  id: string;
  title: string;
  description: string;
  category: "product" | "ai" | "system";
  kind: string;
  status: string;
  tags: string[];
  href: string;
  repo?: string;
  site?: string;
  icon: ReactNode;
  preview?: HelixPreview;
};

type PaperSelection = {
  project: HelixProject;
  rect: DOMRect;
  direction: number;
  trigger: HTMLAnchorElement;
};

const HELIX_PHASE_SPEED = 0.34;
const HELIX_VERTICAL_LIMIT = 4.2;
const HELIX_AXIS_MS = 460;
const HELIX_BLOOM_MS = 1040;

async function waitForProjectImages(stage: HTMLElement) {
  const images = Array.from(stage.querySelectorAll<HTMLImageElement>(".project-card-media img"));
  await Promise.all(images.map(async (image) => {
    if (!image.complete) {
      await new Promise<void>((resolve) => {
        const finish = () => {
          image.removeEventListener("load", finish);
          image.removeEventListener("error", finish);
          resolve();
        };
        image.addEventListener("load", finish, { once: true });
        image.addEventListener("error", finish, { once: true });
        if (image.complete) finish();
      });
    }
    if (!image.decode || image.naturalWidth === 0) return;
    try {
      await image.decode();
    } catch {
      // A failed preview must not hold the whole DNA sequence in its loading state.
    }
  }));
}

function readThemeColor(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function ProjectPaperFlight({ selection, onClose }: { selection: PaperSelection; onClose: () => void }) {
  const { project, rect, direction } = selection;
  const reduceMotion = useReducedMotion();
  const sheetRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const targetWidth = Math.min(window.innerWidth - 96, 1120);
  const targetHeight = Math.min(window.innerHeight - 104, 680);
  const targetLeft = (window.innerWidth - targetWidth) / 2;
  const targetTop = (window.innerHeight - targetHeight) / 2;
  const startX = rect.left + rect.width / 2 - (targetLeft + targetWidth / 2);
  const startY = rect.top + rect.height / 2 - (targetTop + targetHeight / 2);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  const keepFocusInside = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !sheetRef.current) return;

    const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <motion.div
      className="project-paper-flight"
      data-project-paper={project.id}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-paper-title"
      aria-describedby="project-paper-description"
      initial={reduceMotion ? false : { opacity: 0.72 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={keepFocusInside}
    >
      <motion.article
        ref={sheetRef}
        className={`project-paper-sheet project-paper-${project.category}`}
        style={{
          left: targetLeft,
          top: targetTop,
          width: targetWidth,
          height: targetHeight,
        }}
        initial={reduceMotion ? false : {
          x: startX,
          y: startY,
          scaleX: Math.max(0.12, rect.width / targetWidth),
          scaleY: Math.max(0.12, rect.height / targetHeight),
          rotateX: -5,
          rotateY: direction * 9,
          borderRadius: 8,
        }}
        animate={{
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotateX: 0,
          rotateY: 0,
          borderRadius: 2,
        }}
        exit={reduceMotion ? undefined : { opacity: 0, scaleX: 0.97, scaleY: 0.97 }}
        transition={{ duration: reduceMotion ? 0 : 0.74, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          ref={closeRef}
          className="project-paper-close"
          type="button"
          onClick={onClose}
          aria-label="关闭项目预览"
          title="关闭项目预览"
        >
          <X size={18} weight="bold" aria-hidden="true" />
        </button>

        <motion.div
          className="project-paper-layout"
          initial={false}
          animate={{ opacity: 1 }}
        >
          <div className="project-paper-visual">
            {project.preview ? (
              <img
                className={project.preview.fit === "contain" ? "is-contain" : ""}
                src={project.preview.image}
                srcSet={project.preview.srcSet}
                sizes="min(64vw, 720px)"
                alt={project.preview.alt}
                width={project.preview.width}
                height={project.preview.height}
                style={{ objectPosition: project.preview.position }}
              />
            ) : (
              <div className="project-paper-mark" aria-hidden="true">{project.icon}</div>
            )}
          </div>
          <div className="project-paper-copy">
            <span>{project.kind}</span>
            <h2 id="project-paper-title">{project.title}</h2>
            <p id="project-paper-description">{project.description}</p>
            <div className="project-paper-tags">{project.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className="project-paper-links" aria-label={`${project.title} 项目地址`}>
              {project.repo ? (
                <a href={project.repo} target="_blank" rel="noreferrer">
                  <GithubLogo size={17} weight="fill" aria-hidden="true" />
                  <span>GitHub</span>
                  <strong>{project.repo.replace(/^https?:\/\//, "")}</strong>
                  <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
                </a>
              ) : null}
              {project.site ? (
                <a href={project.site} target="_blank" rel="noreferrer">
                  <GlobeHemisphereWest size={17} weight="bold" aria-hidden="true" />
                  <span>在线地址</span>
                  <strong>{project.site.replace(/^https?:\/\//, "").replace(/\/$/, "")}</strong>
                  <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        </motion.div>
        <motion.div
          className="project-paper-fold-lines"
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 0.7 }}
          animate={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.42, delay: reduceMotion ? 0 : 0.56 }}
        />
      </motion.article>
    </motion.div>,
    document.body,
  );
}

export function ProjectHelix({ projects }: { projects: HelixProject[] }) {
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const pausedRef = useRef(false);
  const selectedRef = useRef(false);
  const [selection, setSelection] = useState<PaperSelection | null>(null);
  const [animationReady, setAnimationReady] = useState(Boolean(reduceMotion));
  const [axisSeedExpired, setAxisSeedExpired] = useState(Boolean(reduceMotion));

  useEffect(() => {
    if (reduceMotion) {
      setAxisSeedExpired(true);
      return;
    }

    if (!animationReady) {
      setAxisSeedExpired(false);
      return;
    }

    const timeout = window.setTimeout(() => setAxisSeedExpired(true), 1100);
    return () => window.clearTimeout(timeout);
  }, [animationReady, reduceMotion]);

  useEffect(() => {
    selectedRef.current = Boolean(selection);
    pausedRef.current = false;
    if (!selection) return;

    document.body.classList.add("project-transition-active");

    return () => {
      document.body.classList.remove("project-transition-active");
    };
  }, [selection]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas || window.innerWidth <= 1080) return;
    let disposed = false;
    setAnimationReady(Boolean(reduceMotion));

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-4, 4, HELIX_VERTICAL_LIMIT, -HELIX_VERTICAL_LIMIT, 0.1, 30);
    camera.position.set(0, 0, 10);

    const sampleCount = 180;
    const rungCount = 24;
    const strandOnePositions = new Float32Array(sampleCount * 3);
    const strandTwoPositions = new Float32Array(sampleCount * 3);
    const rungPositions = new Float32Array(rungCount * 2 * 3);
    const tetherPositions = new Float32Array(Math.max(1, projects.length) * 2 * 3);
    const nodePositions = new Float32Array(Math.max(1, projects.length) * 3);

    const strandOneGeometry = new THREE.BufferGeometry();
    const strandTwoGeometry = new THREE.BufferGeometry();
    const rungGeometry = new THREE.BufferGeometry();
    const tetherGeometry = new THREE.BufferGeometry();
    const nodeGeometry = new THREE.BufferGeometry();
    strandOneGeometry.setAttribute("position", new THREE.BufferAttribute(strandOnePositions, 3).setUsage(THREE.DynamicDrawUsage));
    strandTwoGeometry.setAttribute("position", new THREE.BufferAttribute(strandTwoPositions, 3).setUsage(THREE.DynamicDrawUsage));
    rungGeometry.setAttribute("position", new THREE.BufferAttribute(rungPositions, 3).setUsage(THREE.DynamicDrawUsage));
    tetherGeometry.setAttribute("position", new THREE.BufferAttribute(tetherPositions, 3).setUsage(THREE.DynamicDrawUsage));
    nodeGeometry.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3).setUsage(THREE.DynamicDrawUsage));

    const strandOneMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.54, depthWrite: false });
    const strandTwoMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.28, depthWrite: false });
    const rungMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.2, depthWrite: false });
    const tetherMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.36, depthWrite: false });
    const nodeMaterial = new THREE.PointsMaterial({ transparent: true, opacity: 0.88, size: 5, sizeAttenuation: false, depthWrite: false });

    const strandOne = new THREE.Line(strandOneGeometry, strandOneMaterial);
    const strandTwo = new THREE.Line(strandTwoGeometry, strandTwoMaterial);
    const rungs = new THREE.LineSegments(rungGeometry, rungMaterial);
    const tethers = new THREE.LineSegments(tetherGeometry, tetherMaterial);
    const nodes = new THREE.Points(nodeGeometry, nodeMaterial);
    scene.add(strandOne, strandTwo, rungs, tethers, nodes);

    const updateTheme = () => {
      const text = new THREE.Color(readThemeColor("--text", "#151613"));
      const accent = new THREE.Color(readThemeColor("--accent", "#b93b28"));
      strandOneMaterial.color.copy(accent);
      strandTwoMaterial.color.copy(text);
      rungMaterial.color.copy(text);
      tetherMaterial.color.copy(accent);
      nodeMaterial.color.copy(accent);
    };

    let width = 1;
    let height = 1;
    let frame: number | null = null;
    let visible = true;
    let lastTimestamp = performance.now();
    let expansionStartedAt: number | null = reduceMotion ? performance.now() - HELIX_AXIS_MS - HELIX_BLOOM_MS : null;
    let phase = 0.44;
    const vector = new THREE.Vector3();

    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const easeInOutCubic = (value: number) => value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
    const easeOutBack = (value: number) => {
      const overshoot = 1.42;
      return 1 + (overshoot + 1) * Math.pow(value - 1, 3) + overshoot * Math.pow(value - 1, 2);
    };

    const columnCount = Math.max(1, Math.ceil(projects.length / 2));
    const helixHalfSpan = Math.min(6.55, Math.max(2.4, (columnCount - 1) * 1.31));
    const nodeX = (column: number) => columnCount === 1
      ? 0
      : -helixHalfSpan + (column / (columnCount - 1)) * helixHalfSpan * 2;
    const helixAt = (x: number, strand: number, currentPhase: number) => {
      const direction = strand === 0 ? 1 : -1;
      const angle = x * 1.08 + currentPhase;
      return {
        y: Math.sin(angle) * 0.92 * direction,
        z: Math.cos(angle) * 1.16 * direction,
      };
    };

    const resize = () => {
      const bounds = stage.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const aspect = width / height;
      const horizontalExtent = Math.max(
        HELIX_VERTICAL_LIMIT * aspect + 1.08,
        helixHalfSpan + 1.42,
      );
      camera.left = -horizontalExtent;
      camera.right = horizontalExtent;
      camera.top = HELIX_VERTICAL_LIMIT;
      camera.bottom = -HELIX_VERTICAL_LIMIT;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const renderFrame = (timestamp: number) => {
      frame = null;
      if (!visible) return;

      const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.08);
      lastTimestamp = timestamp;
      const elapsed = expansionStartedAt === null ? 0 : timestamp - expansionStartedAt;
      const axisLinear = reduceMotion ? 1 : clamp(elapsed / HELIX_AXIS_MS);
      const bloomLinear = reduceMotion ? 1 : clamp((elapsed - HELIX_AXIS_MS) / HELIX_BLOOM_MS);
      const axisExpansion = 1 - Math.pow(1 - axisLinear, 4);
      const bloomExpansion = easeInOutCubic(bloomLinear);
      if (!reduceMotion && bloomLinear > 0 && !pausedRef.current) {
        phase = (phase + delta * HELIX_PHASE_SPEED) % (Math.PI * 2);
      }
      stage.dataset.helixPhase = phase.toFixed(4);
      stage.dataset.helixPaused = pausedRef.current ? "true" : "false";
      stage.dataset.helixAxis = axisExpansion.toFixed(4);
      stage.dataset.helixBloom = bloomExpansion.toFixed(4);
      stage.dataset.helixExpansion = bloomExpansion.toFixed(4);
      stage.dataset.helixStage = axisLinear < 1 ? "axis" : bloomLinear < 1 ? "bloom" : "live";
      stage.dataset.helixExpanded = bloomLinear >= 1 ? "true" : "false";

      rungMaterial.opacity = 0.2 * bloomExpansion;
      tetherMaterial.opacity = 0.36 * clamp((bloomExpansion - 0.34) / 0.66);
      nodeMaterial.opacity = 0.88 * clamp((bloomExpansion - 0.42) / 0.58);

      for (let index = 0; index < sampleCount; index += 1) {
        const progress = index / (sampleCount - 1);
        const targetX = -helixHalfSpan - 0.46 + progress * (helixHalfSpan * 2 + 0.92);
        const x = targetX * axisExpansion;
        const one = helixAt(targetX, 0, phase);
        const two = helixAt(targetX, 1, phase);
        const offset = index * 3;
        strandOnePositions.set([x, one.y * bloomExpansion, one.z * bloomExpansion], offset);
        strandTwoPositions.set([x, two.y * bloomExpansion, two.z * bloomExpansion], offset);
      }

      for (let index = 0; index < rungCount; index += 1) {
        const progress = index / (rungCount - 1);
        const targetX = -helixHalfSpan + progress * helixHalfSpan * 2;
        const x = targetX * axisExpansion;
        const one = helixAt(targetX, 0, phase);
        const two = helixAt(targetX, 1, phase);
        const offset = index * 6;
        rungPositions.set([
          x,
          one.y * bloomExpansion,
          one.z * bloomExpansion,
          x,
          two.y * bloomExpansion,
          two.z * bloomExpansion,
        ], offset);
      }

      projects.forEach((project, index) => {
        const column = Math.floor(index / 2);
        const strand = index % 2;
        const direction = strand === 0 ? 1 : -1;
        const targetX = nodeX(column);
        const x = targetX * axisExpansion;
        const targetBackbone = helixAt(targetX, strand, phase);
        const backbone = {
          y: targetBackbone.y * bloomExpansion,
          z: targetBackbone.z * bloomExpansion,
        };
        const y = (direction * 2.2 + targetBackbone.y * 0.5) * bloomExpansion;
        const z = targetBackbone.z * 1.22 * bloomExpansion;
        const tetherOffset = index * 6;
        const nodeOffset = index * 3;
        tetherPositions.set([x, backbone.y, backbone.z, x, y, z], tetherOffset);
        nodePositions.set([x, backbone.y, backbone.z], nodeOffset);

        const card = cardRefs.current.get(project.id);
        if (!card) return;
        vector.set(x, y, z).project(camera);
        const screenX = (vector.x * 0.5 + 0.5) * width;
        const screenY = (-vector.y * 0.5 + 0.5) * height;
        const depth = (targetBackbone.z + 1.16) / 2.32;
        const distanceFromCenter = helixHalfSpan === 0 ? 0 : Math.abs(targetX) / helixHalfSpan;
        const revealAt = 0.54 + distanceFromCenter * 0.2;
        const entryLinear = clamp((bloomExpansion - revealAt) / 0.13);
        const entry = easeOutBack(entryLinear);
        const scale = 0.58 + entry * 0.42;
        card.style.setProperty("--helix-x", `${screenX}px`);
        card.style.setProperty("--helix-y", `${screenY}px`);
        card.style.setProperty("--helix-scale", scale.toFixed(4));
        card.style.setProperty("--helix-rotate", `${(Math.cos(x * 1.08 + phase) * direction * 7).toFixed(3)}deg`);
        card.style.setProperty("--helix-opacity", clamp(entry).toFixed(3));
        card.dataset.helixEntry = clamp(entryLinear).toFixed(3);
        card.dataset.helixInteractive = entryLinear >= 0.72 ? "true" : "false";
        card.style.zIndex = String(12 + Math.round(depth * 16));
      });

      for (const geometry of [strandOneGeometry, strandTwoGeometry, rungGeometry, tetherGeometry, nodeGeometry]) {
        geometry.attributes.position.needsUpdate = true;
      }
      renderer.render(scene, camera);
      if (!reduceMotion && expansionStartedAt !== null) frame = window.requestAnimationFrame(renderFrame);
    };

    const requestFrame = () => {
      if (frame === null && visible) frame = window.requestAnimationFrame(renderFrame);
    };
    const resizeObserver = new ResizeObserver(() => {
      resize();
      requestFrame();
    });
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        lastTimestamp = performance.now();
        requestFrame();
      } else if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
    });
    const themeObserver = new MutationObserver(() => {
      updateTheme();
      requestFrame();
    });

    resizeObserver.observe(stage);
    intersectionObserver.observe(stage);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    updateTheme();
    resize();
    requestFrame();

    const prepareAnimation = async () => {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      if (disposed) return;
      renderer.compile(scene, camera);
      renderer.render(scene, camera);
      await waitForProjectImages(stage);
      if (disposed) return;
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      if (disposed) return;
      expansionStartedAt = performance.now();
      lastTimestamp = expansionStartedAt;
      setAnimationReady(true);
      requestFrame();
    };
    if (!reduceMotion) void prepareAnimation();

    return () => {
      disposed = true;
      if (frame !== null) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      scene.clear();
      strandOneGeometry.dispose();
      strandTwoGeometry.dispose();
      rungGeometry.dispose();
      tetherGeometry.dispose();
      nodeGeometry.dispose();
      strandOneMaterial.dispose();
      strandTwoMaterial.dispose();
      rungMaterial.dispose();
      tetherMaterial.dispose();
      nodeMaterial.dispose();
      renderer.dispose();
    };
  }, [projects, reduceMotion]);

  const openProject = (event: MouseEvent<HTMLAnchorElement>, project: HelixProject, index: number) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (window.matchMedia("(max-width: 767px)").matches) return;
    event.preventDefault();
    if (selectedRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    selectedRef.current = true;
    pausedRef.current = false;
    setSelection({ project, rect, direction: index % 2 === 0 ? -1 : 1, trigger: event.currentTarget });
  };

  const closeProject = () => {
    const trigger = selection?.trigger;
    selectedRef.current = false;
    pausedRef.current = false;
    setSelection(null);
    window.requestAnimationFrame(() => trigger?.focus({ preventScroll: true }));
  };

  return (
    <div
      ref={stageRef}
      className={`index-items project-cloud project-helix project-cloud-count-${projects.length}${selection ? " is-transitioning" : ""}`}
      data-reduced-motion={reduceMotion ? "true" : "false"}
      data-helix-entry="line-to-dna"
      data-helix-sequence="axis-bloom-live"
      data-helix-ready={animationReady ? "true" : "false"}
      data-axis-seed-expired={axisSeedExpired ? "true" : "false"}
    >
      {!reduceMotion && animationReady ? (
        <motion.div
          className="project-helix-axis-seed"
          aria-hidden="true"
          initial={{ opacity: 1, scaleX: 0.035 }}
          animate={{ opacity: [1, 1, 0], scaleX: [0.035, 1, 1] }}
          transition={{
            duration: 0.9,
            times: [0, HELIX_AXIS_MS / 900, 1],
            ease: [0.16, 1, 0.3, 1],
          }}
          onAnimationComplete={() => setAxisSeedExpired(true)}
        />
      ) : null}
      <canvas ref={canvasRef} className="project-helix-canvas" aria-hidden="true" />
      <div className="project-helix-nodes" role="list">
        {projects.map((project, index) => (
          <article
            ref={(node) => {
              if (node) cardRefs.current.set(project.id, node);
              else cardRefs.current.delete(project.id);
            }}
            className={`index-item helix-node${selection?.project.id === project.id ? " is-selected" : ""}`}
            data-project-id={project.id}
            role="listitem"
            key={project.id}
          >
            <Link
              className="project-card-link"
              to={project.href}
              onClick={(event) => openProject(event, project, index)}
            >
              <div className="project-card-kinetic">
                <div className="project-card-float">
                  <div className={`project-card-surface helix-poster-card project-card-${project.category}`}>
                    {project.preview ? (
                      <div className="project-card-media">
                        <img
                          className={project.preview.fit === "contain" ? "is-contain" : ""}
                          src={project.preview.image}
                          srcSet={project.preview.srcSet}
                          sizes="190px"
                          alt=""
                          width={project.preview.width}
                          height={project.preview.height}
                          loading="eager"
                          style={{ objectPosition: project.preview.position }}
                        />
                      </div>
                    ) : (
                      <div className="project-card-mark" aria-hidden="true">
                        {project.icon}
                        <span>{project.category === "product" ? "产品" : project.category === "ai" ? "AI 工具" : "系统"}</span>
                      </div>
                    )}
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
      <AnimatePresence>
        {selection ? <ProjectPaperFlight key={selection.project.id} selection={selection} onClose={closeProject} /> : null}
      </AnimatePresence>
    </div>
  );
}
