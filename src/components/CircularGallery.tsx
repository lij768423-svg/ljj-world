import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "ogl";
import { useEffect, useRef } from "react";

export type CircularGalleryItem = {
  image: string;
  text: string;
};

export type CircularGalleryClick = {
  index: number;
  clientX: number;
  clientY: number;
};

type GalleryProps = {
  items: CircularGalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  showTitles?: boolean;
  entryDirection?: "left" | "right";
  introLead?: number;
  startIntro?: boolean;
  exiting?: boolean;
  onReady?: () => void;
  onItemClick?: (selection: CircularGalleryClick) => void;
  ariaLabel: string;
};

type GL = Renderer["gl"];
type Size = { width: number; height: number };

let warmupContext: WebGL2RenderingContext | WebGLRenderingContext | null = null;

export function prewarmCircularGallery() {
  if (warmupContext || typeof document === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  warmupContext = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  }) ?? canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  warmupContext?.clear(warmupContext.COLOR_BUFFER_BIT);
}

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const INTRO_LEAD = 180;
const INTRO_STAGGER = 500;
const INTRO_DURATION = 760;
const INTRO_SETTLE = 100;
const MEDIA_BUILD_BATCH = 1;

type GalleryImageResource = {
  texture: Texture;
  size: [number, number];
  ready: boolean;
  listeners: Set<(size: [number, number]) => void>;
};

function createTextTexture(gl: GL, text: string, font: string, color: string) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("CircularGallery could not create a text canvas.");

  context.font = font;
  const fontSize = Number(font.match(/(\d+)px/)?.[1] ?? 28);
  const textWidth = Math.ceil(context.measureText(text).width);
  canvas.width = textWidth + 32;
  canvas.height = Math.ceil(fontSize * 1.45) + 18;

  context.font = font;
  context.fillStyle = color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

class GalleryTitle {
  mesh: Mesh;

  constructor(gl: GL, parent: Mesh, text: string, font: string, color: string) {
    const { texture, width, height } = createTextTexture(gl, text, font, color);
    const geometry = new Plane(gl);
    const program = new Program(gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.08) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true,
    });

    this.mesh = new Mesh(gl, { geometry, program });
    const titleHeight = parent.scale.y * 0.105;
    this.mesh.scale.set(titleHeight * (width / height), titleHeight, 1);
    this.mesh.position.y = -parent.scale.y * 0.5 - titleHeight * 0.72;
    this.mesh.setParent(parent);
  }
}

class GalleryMedia {
  private extra = 0;
  private readonly geometry: Plane;
  private readonly gl: GL;
  private readonly index: number;
  private readonly length: number;
  private readonly scene: Transform;
  private readonly bend: number;
  private readonly borderRadius: number;
  private readonly reducedMotion: boolean;
  private readonly text: string;
  private readonly textColor: string;
  private readonly font: string;
  private screen: Size;
  private viewport: Size;
  private program!: Program;
  private plane!: Mesh;
  private title?: GalleryTitle;
  private focus = 0;
  private hover = 0;
  private hoverTarget = 0;
  private hoverPointerX = 0;
  private hoverPointerY = 0;
  private hoverPointerTargetX = 0;
  private hoverPointerTargetY = 0;
  private exitStartX: number | null = null;
  private exitStartIntro = 1;
  private width = 0;
  private widthTotal = 0;
  private x = 0;

  constructor({
    geometry,
    gl,
    imageResource,
    index,
    length,
    scene,
    screen,
    viewport,
    bend,
    borderRadius,
    reducedMotion,
    text,
    textColor,
    font,
    showTitles,
  }: {
    geometry: Plane;
    gl: GL;
    imageResource: GalleryImageResource;
    index: number;
    length: number;
    scene: Transform;
    screen: Size;
    viewport: Size;
    bend: number;
    borderRadius: number;
    reducedMotion: boolean;
    text: string;
    textColor: string;
    font: string;
    showTitles: boolean;
  }) {
    this.geometry = geometry;
    this.gl = gl;
    this.index = index;
    this.length = length;
    this.scene = scene;
    this.screen = screen;
    this.viewport = viewport;
    this.bend = bend;
    this.borderRadius = borderRadius;
    this.reducedMotion = reducedMotion;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    this.createShader(imageResource);
    this.createMesh();
    if (showTitles) this.createTitle();
    this.resize();
  }

  private createShader(imageResource: GalleryImageResource) {
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        uniform float uMotion;
        uniform float uFocus;
        uniform float uHover;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.xy *= mix(0.91, 1.08, uFocus) * mix(1.0, 1.055, uHover);
          float wave = sin(p.x * 4.0 + uTime) + cos(p.y * 2.0 + uTime);
          p.z = wave * (0.07 + min(abs(uSpeed), 0.22) * 0.42) * uMotion;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        uniform float uIntro;
        uniform float uFocus;
        uniform float uHover;
        varying vec2 vUv;

        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }

        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);
          color.rgb *= mix(0.78, 1.0, uFocus);
          color.rgb *= mix(1.0, 1.055, uHover);
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          float alpha = 1.0 - smoothstep(-0.002, 0.002, d);
          gl_FragColor = vec4(color.rgb, alpha * color.a * uIntro);
        }
      `,
      uniforms: {
        tMap: { value: imageResource.texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: imageResource.size },
        uSpeed: { value: 0 },
        uTime: { value: Math.random() * 100 },
        uMotion: { value: this.reducedMotion ? 0 : 1 },
        uFocus: { value: 0 },
        uHover: { value: 0 },
        uBorderRadius: { value: this.borderRadius },
        uIntro: { value: this.reducedMotion ? 1 : 0 },
      },
      transparent: true,
    });

    if (!imageResource.ready) {
      imageResource.listeners.add((size) => {
        this.program.uniforms.uImageSizes.value = size;
      });
    }
  }

  private createMesh() {
    this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
    this.plane.setParent(this.scene);
  }

  private createTitle() {
    this.title = new GalleryTitle(this.gl, this.plane, this.text, this.font, this.textColor);
  }

  resize(screen = this.screen, viewport = this.viewport) {
    this.screen = screen;
    this.viewport = viewport;
    const scale = Math.max(0.22, this.screen.height / 1450);
    this.plane.scale.y = (this.viewport.height * (1180 * scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (1235 * scale)) / this.screen.width;
    this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.width = this.plane.scale.x + 1.15;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
    if (this.title) {
      this.title.mesh.position.y = -0.5 - this.title.mesh.scale.y * 0.72;
    }
  }

  update(
    scroll: { current: number; last: number },
    direction: "left" | "right",
    introElapsed: number,
    entryDirection: "left" | "right",
    exitElapsed: number,
  ) {
    const finalX = this.x - scroll.current - this.extra;
    const halfWidth = this.viewport.width / 2;
    const spatialOrder = entryDirection === "left"
      ? (finalX + halfWidth) / (halfWidth * 2)
      : (halfWidth - finalX) / (halfWidth * 2);
    const delay = Math.min(1, Math.max(0, spatialOrder)) * INTRO_STAGGER;
    const rawProgress = Math.min(1, Math.max(0, (introElapsed - delay) / INTRO_DURATION));
    const easedProgress = this.reducedMotion ? 1 : 1 - (1 - rawProgress) ** 4;
    const startX = entryDirection === "left"
      ? -halfWidth - this.plane.scale.x * 0.72
      : halfWidth + this.plane.scale.x * 0.72;
    const exitDelay = Math.min(1, Math.max(0, spatialOrder)) * 110;
    const rawExitProgress = exitElapsed < 0 ? 0 : Math.min(1, Math.max(0, (exitElapsed - exitDelay) / 760));
    if (exitElapsed >= 0 && rawExitProgress > 0) {
      if (this.exitStartX === null) {
        this.exitStartX = this.plane.position.x;
        this.exitStartIntro = this.program.uniforms.uIntro.value;
      }
      const easedExit = 1 - (1 - rawExitProgress) ** 3;
      this.plane.position.x = lerp(this.exitStartX, startX, easedExit);
      const exitOpacity = rawExitProgress < 0.28
        ? 1
        : 1 - Math.min(1, (rawExitProgress - 0.28) / 0.6);
      this.program.uniforms.uIntro.value = this.exitStartIntro * exitOpacity;
    } else {
      this.plane.position.x = lerp(startX, finalX, easedProgress);
      this.program.uniforms.uIntro.value = rawProgress <= 0 ? 0 : Math.min(1, rawProgress / 0.18);
    }
    const x = this.plane.position.x;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const magnitude = Math.abs(this.bend);
      const radius = (halfWidth * halfWidth + magnitude * magnitude) / (2 * magnitude);
      const effectiveX = Math.min(Math.abs(x), halfWidth);
      const arc = radius - Math.sqrt(Math.max(0, radius * radius - effectiveX * effectiveX));
      this.plane.position.y = this.bend > 0 ? -arc : arc;
      this.plane.rotation.z = (this.bend > 0 ? -1 : 1) * Math.sign(x) * Math.asin(effectiveX / radius);
    }

    const speed = scroll.current - scroll.last;
    if (!this.reducedMotion) this.program.uniforms.uTime.value += 0.035;
    this.program.uniforms.uSpeed.value = speed;
    const focusTarget = Math.max(0, 1 - Math.abs(x) / Math.max(this.plane.scale.x * 1.35, 0.01));
    this.focus = this.reducedMotion ? focusTarget : lerp(this.focus, focusTarget, 0.1);
    this.program.uniforms.uFocus.value = this.focus;
    this.hover = this.reducedMotion ? this.hoverTarget : lerp(this.hover, this.hoverTarget, 0.13);
    this.hoverPointerX = this.reducedMotion
      ? this.hoverPointerTargetX
      : lerp(this.hoverPointerX, this.hoverPointerTargetX, 0.16);
    this.hoverPointerY = this.reducedMotion
      ? this.hoverPointerTargetY
      : lerp(this.hoverPointerY, this.hoverPointerTargetY, 0.16);
    this.program.uniforms.uHover.value = this.hover;
    this.plane.rotation.x = this.reducedMotion ? 0 : -this.hoverPointerY * this.hover * 0.06;
    this.plane.rotation.y = this.reducedMotion ? 0 : this.hoverPointerX * this.hover * 0.085;

    const introFinishedAt = INTRO_STAGGER + INTRO_DURATION + INTRO_SETTLE;
    if (exitElapsed < 0 && (introElapsed < 0 || introElapsed >= introFinishedAt)) {
      const planeOffset = this.plane.scale.x / 2;
      const viewportOffset = this.viewport.width / 2;
      const before = finalX + planeOffset < -viewportOffset;
      const after = finalX - planeOffset > viewportOffset;
      if (direction === "right" && before) this.extra -= this.widthTotal;
      if (direction === "left" && after) this.extra += this.widthTotal;
    }
  }

  get itemWidth() {
    return this.width;
  }

  get itemIndex() {
    return this.index;
  }

  get centerDistance() {
    return Math.abs(this.plane.position.x);
  }

  get hoverState() {
    return {
      amount: this.hover,
      x: this.hoverPointerX,
      y: this.hoverPointerY,
    };
  }

  setHover(active: boolean, pointX = 0, pointY = 0) {
    this.hoverTarget = active ? 1 : 0;
    if (!active) {
      this.hoverPointerTargetX = 0;
      this.hoverPointerTargetY = 0;
      return;
    }
    const dx = pointX - this.plane.position.x;
    const dy = pointY - this.plane.position.y;
    const angle = this.plane.rotation.z;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const localX = cos * dx + sin * dy;
    const localY = -sin * dx + cos * dy;
    this.hoverPointerTargetX = Math.max(-1, Math.min(1, localX / Math.max(this.plane.scale.x * 0.5, 0.01)));
    this.hoverPointerTargetY = Math.max(-1, Math.min(1, localY / Math.max(this.plane.scale.y * 0.5, 0.01)));
  }

  hitTest(pointX: number, pointY: number) {
    if (this.program.uniforms.uIntro.value < 0.5) return false;
    const dx = pointX - this.plane.position.x;
    const dy = pointY - this.plane.position.y;
    const angle = this.plane.rotation.z;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const localX = cos * dx + sin * dy;
    const localY = -sin * dx + cos * dy;
    const focusScale = 0.91 + this.focus * 0.17;
    return Math.abs(localX) <= this.plane.scale.x * focusScale * 0.5
      && Math.abs(localY) <= this.plane.scale.y * focusScale * 0.5;
  }
}

class CircularGalleryApp {
  private readonly container: HTMLElement;
  private readonly scrollSpeed: number;
  private readonly scrollEase: number;
  private readonly reducedMotion: boolean;
  private readonly entryDirection: "left" | "right";
  private readonly introLead: number;
  private readonly itemCount: number;
  private readonly renderer: Renderer;
  private readonly gl: GL;
  private readonly camera: Camera;
  private readonly scene = new Transform();
  private readonly geometry: Plane;
  private readonly medias: GalleryMedia[] = [];
  private readonly resizeObserver: ResizeObserver;
  private readonly scroll = { current: 0, target: 0, last: 0, startPosition: 0 };
  private raf = 0;
  private dragging = false;
  private startX = 0;
  private startY = 0;
  private pointerTravel = 0;
  private pointerInside = false;
  private pointerClientX = 0;
  private pointerClientY = 0;
  private snapTimer = 0;
  private mediaBuildRaf = 0;
  private readyCount = 0;
  private imagesReady = false;
  private mediasReady = false;
  private resourcesReady = false;
  private destroyed = false;
  private startRequested = false;
  private introStartedAt: number | null = null;
  private introComplete = false;
  private exitStartedAt: number | null = null;
  private onReady?: () => void;
  private onItemClick?: (selection: CircularGalleryClick) => void;

  constructor(container: HTMLElement, props: Required<Omit<GalleryProps, "ariaLabel" | "startIntro" | "exiting" | "onReady" | "onItemClick">>) {
    this.container = container;
    this.scrollSpeed = props.scrollSpeed;
    this.scrollEase = props.scrollEase;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.entryDirection = props.entryDirection;
    this.introLead = props.introLead;
    this.itemCount = props.items.length;
    this.renderer = new Renderer({
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      dpr: Math.min(window.devicePixelRatio || 1, 1.75),
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas as HTMLCanvasElement);
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
    this.geometry = new Plane(this.gl, { widthSegments: 48, heightSegments: 24 });

    const { screen, viewport } = this.measure();
    const doubledItems = props.items.concat(props.items);
    this.container.dataset.entryDirection = this.entryDirection;
    this.container.dataset.exitState = "idle";
    this.container.dataset.introState = this.reducedMotion ? "complete" : "waiting";
    this.container.dataset.hoveredItem = "";
    this.container.dataset.hoverIntensity = "0";
    this.container.dataset.hoverX = "0";
    this.container.dataset.hoverY = "0";
    this.introComplete = this.reducedMotion;
    const imageResources = new Map<string, GalleryImageResource>();
    const onImageReady = () => {
      if (this.destroyed) return;
      this.readyCount += 1;
      if (this.readyCount < imageResources.size) return;
      this.imagesReady = true;
      this.tryMarkResourcesReady();
    };
    props.items.forEach((item) => {
      if (imageResources.has(item.image)) return;
      const resource: GalleryImageResource = {
        texture: new Texture(this.gl, {
          generateMipmaps: true,
          minFilter: this.gl.LINEAR_MIPMAP_LINEAR,
          magFilter: this.gl.LINEAR,
          anisotropy: 4,
        }),
        size: [1, 1],
        ready: false,
        listeners: new Set(),
      };
      imageResources.set(item.image, resource);
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        resource.texture.image = image;
        resource.size = [image.naturalWidth, image.naturalHeight];
        resource.ready = true;
        resource.listeners.forEach((listener) => listener(resource.size));
        resource.listeners.clear();
        onImageReady();
      };
      image.onerror = () => {
        resource.ready = true;
        resource.listeners.clear();
        onImageReady();
      };
      image.src = item.image;
    });
    let mediaIndex = 0;
    const buildMediaBatch = () => {
      if (this.destroyed) return;
      const batchEnd = Math.min(doubledItems.length, mediaIndex + MEDIA_BUILD_BATCH);
      for (; mediaIndex < batchEnd; mediaIndex += 1) {
        const item = doubledItems[mediaIndex];
        this.medias.push(new GalleryMedia({
          geometry: this.geometry,
          gl: this.gl,
          imageResource: imageResources.get(item.image)!,
          index: mediaIndex,
          length: doubledItems.length,
          scene: this.scene,
          screen,
          viewport,
          bend: props.bend,
          borderRadius: props.borderRadius,
          reducedMotion: this.reducedMotion,
          text: item.text,
          textColor: props.textColor,
          font: props.font,
          showTitles: props.showTitles,
        }));
      }
      if (mediaIndex < doubledItems.length) {
        this.mediaBuildRaf = window.requestAnimationFrame(buildMediaBatch);
        return;
      }
      this.mediasReady = true;
      this.tryMarkResourcesReady();
    };
    this.mediaBuildRaf = window.requestAnimationFrame(buildMediaBatch);

    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.container);
    this.container.addEventListener("wheel", this.onWheel, { passive: false });
    this.container.addEventListener("pointerdown", this.onPointerDown);
    this.container.addEventListener("pointermove", this.onPointerMove);
    this.container.addEventListener("pointerup", this.onPointerUp);
    this.container.addEventListener("pointercancel", this.onPointerUp);
    this.container.addEventListener("pointerleave", this.onPointerLeave);
    this.container.addEventListener("keydown", this.onKeyDown);
    this.update();
  }

  private measure() {
    const screen = {
      width: Math.max(1, this.container.clientWidth),
      height: Math.max(1, this.container.clientHeight),
    };
    this.renderer.setSize(screen.width, screen.height);
    this.camera.perspective({ aspect: screen.width / screen.height });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    return { screen, viewport: { width: height * this.camera.aspect, height } };
  }

  private resize = () => {
    const { screen, viewport } = this.measure();
    this.medias.forEach((media) => media.resize(screen, viewport));
  };

  private snap = () => {
    const width = this.medias[0]?.itemWidth;
    if (!width) return;
    this.scroll.target = Math.round(this.scroll.target / width) * width;
  };

  private requestSnap() {
    window.clearTimeout(this.snapTimer);
    this.snapTimer = window.setTimeout(this.snap, 150);
  }

  private onWheel = (event: WheelEvent) => {
    event.preventDefault();
    if (!this.introComplete) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    this.scroll.target += Math.sign(delta) * this.scrollSpeed * Math.min(2.2, Math.max(0.7, Math.abs(delta) / 45));
    this.requestSnap();
  };

  private onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !this.introComplete) return;
    this.pointerClientX = event.clientX;
    this.pointerClientY = event.clientY;
    this.dragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.pointerTravel = 0;
    this.scroll.startPosition = this.scroll.current;
    this.container.setPointerCapture(event.pointerId);
    this.container.classList.add("is-dragging");
  };

  private onPointerMove = (event: PointerEvent) => {
    this.pointerInside = true;
    this.pointerClientX = event.clientX;
    this.pointerClientY = event.clientY;
    if (!this.dragging) return;
    this.pointerTravel = Math.max(this.pointerTravel, Math.hypot(event.clientX - this.startX, event.clientY - this.startY));
    this.scroll.target = this.scroll.startPosition + (this.startX - event.clientX) * this.scrollSpeed * 0.018;
  };

  private onPointerUp = (event: PointerEvent) => {
    if (!this.dragging) return;
    const wasClick = this.pointerTravel < 7;
    this.dragging = false;
    if (this.container.hasPointerCapture(event.pointerId)) this.container.releasePointerCapture(event.pointerId);
    this.container.classList.remove("is-dragging");
    this.snap();
    if (wasClick) this.selectAt(event.clientX, event.clientY);
  };

  private onPointerLeave = () => {
    this.pointerInside = false;
    this.clearHover();
  };

  private clientToViewportPoint(clientX: number, clientY: number) {
    const bounds = this.container.getBoundingClientRect();
    const fov = (this.camera.fov * Math.PI) / 180;
    const viewportHeight = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const viewportWidth = viewportHeight * this.camera.aspect;
    return {
      x: ((clientX - bounds.left) / bounds.width - 0.5) * viewportWidth,
      y: (0.5 - (clientY - bounds.top) / bounds.height) * viewportHeight,
    };
  }

  private clearHover() {
    this.medias.forEach((media) => media.setHover(false));
    this.container.classList.remove("is-hovering-card");
    this.container.dataset.hoveredItem = "";
    this.container.dataset.hoverIntensity = "0";
    this.container.dataset.hoverX = "0";
    this.container.dataset.hoverY = "0";
  }

  private refreshHover() {
    if (!this.pointerInside || this.dragging || !this.introComplete || this.exitStartedAt !== null) {
      this.clearHover();
      return;
    }
    const point = this.clientToViewportPoint(this.pointerClientX, this.pointerClientY);
    const hit = this.medias
      .filter((media) => media.hitTest(point.x, point.y))
      .sort((a, b) => a.centerDistance - b.centerDistance)[0];
    this.medias.forEach((media) => media.setHover(media === hit, point.x, point.y));
    this.container.classList.toggle("is-hovering-card", Boolean(hit));
    this.container.dataset.hoveredItem = hit ? String(hit.itemIndex % this.itemCount) : "";
    const hoverState = hit?.hoverState;
    this.container.dataset.hoverIntensity = hoverState?.amount.toFixed(3) ?? "0";
    this.container.dataset.hoverX = hoverState?.x.toFixed(3) ?? "0";
    this.container.dataset.hoverY = hoverState?.y.toFixed(3) ?? "0";
  }

  private selectAt(clientX: number, clientY: number) {
    if (!this.onItemClick || this.exitStartedAt !== null) return;
    const point = this.clientToViewportPoint(clientX, clientY);
    const hit = this.medias
      .filter((media) => media.hitTest(point.x, point.y))
      .sort((a, b) => a.centerDistance - b.centerDistance)[0];
    if (hit) {
      this.onItemClick({
        index: hit.itemIndex % this.itemCount,
        clientX,
        clientY,
      });
    }
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if ((event.key !== "ArrowLeft" && event.key !== "ArrowRight") || !this.introComplete) return;
    event.preventDefault();
    const width = this.medias[0]?.itemWidth ?? this.scrollSpeed * 5;
    this.scroll.target += event.key === "ArrowRight" ? width : -width;
  };

  private update = (timestamp = performance.now()) => {
    const ease = this.reducedMotion ? 1 : this.scrollEase;
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, ease);
    const direction = this.scroll.current > this.scroll.last ? "right" : "left";
    const introElapsed = this.reducedMotion
      ? Number.POSITIVE_INFINITY
      : this.introStartedAt === null
        ? Number.NEGATIVE_INFINITY
        : timestamp - this.introStartedAt;
    const exitElapsed = this.exitStartedAt === null ? Number.NEGATIVE_INFINITY : timestamp - this.exitStartedAt;
    this.medias.forEach((media) => media.update(this.scroll, direction, introElapsed, this.entryDirection, exitElapsed));
    this.refreshHover();
    if (!this.introComplete && introElapsed >= INTRO_STAGGER + INTRO_DURATION + INTRO_SETTLE) {
      this.introComplete = true;
      this.container.dataset.introState = "complete";
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update);
  };

  private tryStartIntro() {
    if (!this.resourcesReady || !this.startRequested || this.introStartedAt !== null || this.introComplete) return;
    this.introStartedAt = performance.now() + this.introLead;
    this.container.dataset.introState = "running";
  }

  private tryMarkResourcesReady() {
    if (!this.imagesReady || !this.mediasReady || this.resourcesReady || this.destroyed) return;
    this.resourcesReady = true;
    this.container.dataset.resourcesReady = "true";
    this.onReady?.();
    this.tryStartIntro();
  }

  setOnReady(onReady?: () => void) {
    this.onReady = onReady;
    if (this.resourcesReady) this.onReady?.();
  }

  setStartIntro(startIntro: boolean) {
    this.startRequested = startIntro;
    this.tryStartIntro();
  }

  setOnItemClick(onItemClick?: (selection: CircularGalleryClick) => void) {
    this.onItemClick = onItemClick;
  }

  setExiting(exiting: boolean) {
    if (!exiting || this.exitStartedAt !== null) return;
    this.exitStartedAt = performance.now();
    this.dragging = false;
    this.container.classList.remove("is-dragging");
    this.container.dataset.exitState = "running";
  }

  destroy() {
    this.destroyed = true;
    window.cancelAnimationFrame(this.raf);
    window.cancelAnimationFrame(this.mediaBuildRaf);
    window.clearTimeout(this.snapTimer);
    this.resizeObserver.disconnect();
    this.container.removeEventListener("wheel", this.onWheel);
    this.container.removeEventListener("pointerdown", this.onPointerDown);
    this.container.removeEventListener("pointermove", this.onPointerMove);
    this.container.removeEventListener("pointerup", this.onPointerUp);
    this.container.removeEventListener("pointercancel", this.onPointerUp);
    this.container.removeEventListener("pointerleave", this.onPointerLeave);
    this.container.removeEventListener("keydown", this.onKeyDown);
    this.gl.canvas.remove();
    const contextLoss = this.gl.getExtension("WEBGL_lose_context");
    const releaseContext = () => contextLoss?.loseContext();
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(releaseContext, { timeout: 1200 });
    } else {
      setTimeout(releaseContext, 320);
    }
  }
}

export default function CircularGallery({
  items,
  bend = 3,
  textColor = "#121210",
  borderRadius = 0.025,
  font = "650 27px Geist Variable, sans-serif",
  scrollSpeed = 2,
  scrollEase = 0.075,
  showTitles = true,
  entryDirection = "left",
  introLead = INTRO_LEAD,
  startIntro = true,
  exiting = false,
  onReady,
  onItemClick,
  ariaLabel,
}: GalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<CircularGalleryApp | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const gallery = new CircularGalleryApp(containerRef.current, {
      items,
      bend,
      textColor,
      borderRadius,
      font,
      scrollSpeed,
      scrollEase,
      showTitles,
      entryDirection,
      introLead,
    });
    galleryRef.current = gallery;
    return () => {
      galleryRef.current = null;
      gallery.destroy();
    };
  }, [items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase, showTitles, entryDirection, introLead]);

  useEffect(() => {
    galleryRef.current?.setOnItemClick(onItemClick);
  }, [onItemClick]);

  useEffect(() => {
    galleryRef.current?.setOnReady(onReady);
  }, [onReady]);

  useEffect(() => {
    galleryRef.current?.setStartIntro(startIntro);
  }, [startIntro]);

  useEffect(() => {
    galleryRef.current?.setExiting(exiting);
  }, [exiting]);

  return (
    <div
      ref={containerRef}
      className="circular-gallery"
      tabIndex={0}
      role="region"
      aria-label={ariaLabel}
    />
  );
}
