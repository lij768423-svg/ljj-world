import * as THREE from "three";

// Blows a picture of an element away as dust. The picture is cut into small
// grains; a circle grows from a starting point (a random spot inside the card,
// different every time), fast at first and slowing like a ripple, and every
// grain it passes drifts away from the centre, rises, swirls and fades. A random
// seed also reshuffles the grains, so no two dissolves look the same.
// Until the front reaches a grain, that spot is drawn from the full-resolution
// picture, so the card looks untouched where the dust has not started yet.
//
// The picture comes from modern-screenshot (MIT), loaded only when needed. The
// rendering uses three.js, which the project helix already ships.

const GRAIN_PX = 2.5; // grain size in CSS pixels
const SWEEP_S = 0.62; // time for the front to cross the whole card
const LIFE_S = 0.95; // time a grain takes to blow away (each varies by ±30%)
const TOTAL_S = SWEEP_S + LIFE_S * 1.3 + 0.12;
const INK_MIX = 0.24; // moving grains lean toward the text colour, so pale paper dust stays visible

const loadScreenshot = () => import("modern-screenshot");

/** Fetches the screenshot code ahead of time, so the first snapshot doesn't wait for a download. */
export function preloadDust() {
  void loadScreenshot().catch(() => undefined);
}

/**
 * Takes the picture the dust is made from. It can run while the element is
 * still flying in: the copy is drawn without the element's own transform, as
 * it will look once it lands.
 */
export async function snapshotForDust(element: HTMLElement): Promise<HTMLCanvasElement | null> {
  try {
    await document.fonts?.ready;
    const { domToCanvas } = await loadScreenshot();
    // Width and height from the layout box: mid-flight the on-screen box is scaled down, and the copy would
    // otherwise be cropped to that smaller size.
    return await domToCanvas(element, {
      width: element.offsetWidth,
      height: element.offsetHeight,
      scale: Math.min(window.devicePixelRatio || 1, 2),
      timeout: 4000,
      style: { transform: "none", opacity: "1" },
    });
  } catch (error) {
    if (import.meta.env.DEV) console.warn("[DustDissolve] snapshot failed, closing without dust", error);
    return null;
  }
}

const shared = /* glsl */ `
  uniform vec4 uRect;      // card left, top, width, height (CSS px)
  uniform vec2 uCells;     // grains across, grains down
  uniform vec2 uOrigin;    // where the dust starts (CSS px)
  uniform float uReach;    // distance from the origin to the farthest corner
  uniform float uTime;
  uniform float uSeed;     // 0-1, new for every dissolve

  float hash(vec2 p) {
    p += uSeed * 97.0;
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // When the circle reaches this grain. Its radius grows as 1 - (1 - t)^2 (fast,
  // then slowing), so a grain at share f of the reach is hit at t = 1 - sqrt(1 - f).
  // A little per-grain jitter keeps the rim dusty without breaking the circle.
  float delayFor(vec2 cell) {
    vec2 p = uRect.xy + (cell + 0.5) / uCells * uRect.zw;
    float f = clamp(length(p - uOrigin) / uReach + 0.03 * (hash(cell + 3.0) - 0.5), 0.0, 1.0);
    return (1.0 - sqrt(1.0 - f)) * ${SWEEP_S.toFixed(2)};
  }
`;

const cardVertex = /* glsl */ `
  uniform vec4 uRect;
  uniform vec2 uViewport;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec2 p = uRect.xy + uv * uRect.zw;
    gl_Position = vec4(p.x / uViewport.x * 2.0 - 1.0, 1.0 - p.y / uViewport.y * 2.0, 0.0, 1.0);
  }
`;

const cardFragment = /* glsl */ `
  ${shared}
  uniform sampler2D uMap;
  varying vec2 vUv;
  void main() {
    if (uTime >= delayFor(floor(vUv * uCells))) discard;
    vec4 color = texture2D(uMap, vUv);
    gl_FragColor = vec4(color.rgb * color.a, color.a);
  }
`;

const grainVertex = /* glsl */ `
  ${shared}
  uniform sampler2D uMap;
  uniform vec2 uViewport;
  uniform float uGrain;     // grain size in device pixels
  uniform vec3 uInk;
  attribute vec2 aCell;
  varying vec4 vColor;
  void main() {
    float delay = delayFor(aCell);
    if (uTime < delay) {
      gl_PointSize = 0.0;
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      vColor = vec4(0.0);
      return;
    }
    float h1 = hash(aCell);
    float h2 = hash(aCell + 17.0);
    float h3 = hash(aCell + 41.0);
    float t = clamp((uTime - delay) / (${LIFE_S.toFixed(2)} * (0.7 + 0.6 * h1)), 0.0, 1.0);
    float e = t * (0.35 + 0.65 * t);

    vec2 uv = (aCell + 0.5) / uCells;
    vec2 home = uRect.xy + uv * uRect.zw;
    vec2 away = home - uOrigin;
    vec2 dir = length(away) > 0.001 ? normalize(away) : vec2(0.0, -1.0);
    vec2 swirl = vec2(sin(t * 5.0 + h1 * 6.2832), cos(t * 4.0 + h2 * 6.2832)) * 14.0 * t;
    vec2 p = home + dir * (30.0 + 110.0 * h2) * e + vec2(0.0, -(50.0 + 150.0 * h3)) * e + swirl;

    gl_Position = vec4(p.x / uViewport.x * 2.0 - 1.0, 1.0 - p.y / uViewport.y * 2.0, 0.0, 1.0);
    gl_PointSize = uGrain * (1.0 - 0.55 * t);
    vec4 color = texture2D(uMap, uv);
    color.rgb = mix(color.rgb, uInk, ${INK_MIX.toFixed(2)} * smoothstep(0.0, 0.35, t));
    // Some grains vanish almost at once and a few drift on, so the cloud thins out instead of hanging as a haze.
    vColor = vec4(color.rgb, color.a * pow(1.0 - t, 1.6 + 2.4 * h3));
  }
`;

const grainFragment = /* glsl */ `
  varying vec4 vColor;
  void main() {
    gl_FragColor = vec4(vColor.rgb * vColor.a, vColor.a);
  }
`;

/** A random centre for the circle, kept inside the card so the whole ring shows as it grows. */
function randomOrigin(rect: DOMRect) {
  return { x: rect.left + rect.width * (0.18 + Math.random() * 0.64), y: rect.top + rect.height * (0.22 + Math.random() * 0.56) };
}

/**
 * Starts the dust over `rect` and returns true, or returns false when it can't
 * run (no WebGL), so the caller can fall back to its normal exit. The canvas
 * removes itself when the dust has settled.
 */
export function playDust(snapshot: HTMLCanvasElement, rect: DOMRect, ink: string, origin = randomOrigin(rect)): boolean {
  const canvas = document.createElement("canvas");
  canvas.className = "dust-dissolve-canvas";
  canvas.setAttribute("aria-hidden", "true");

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true });
  } catch {
    return false;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);
  document.body.append(canvas);

  const texture = new THREE.CanvasTexture(snapshot);
  texture.flipY = false;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const columns = Math.ceil(rect.width / GRAIN_PX);
  const rows = Math.ceil(rect.height / GRAIN_PX);
  const corners = [[rect.left, rect.top], [rect.right, rect.top], [rect.left, rect.bottom], [rect.right, rect.bottom]];
  const reach = Math.max(1, ...corners.map(([x, y]) => Math.hypot(x - origin.x, y - origin.y)));
  const uniforms = {
    uMap: { value: texture },
    uRect: { value: new THREE.Vector4(rect.left, rect.top, rect.width, rect.height) },
    uCells: { value: new THREE.Vector2(columns, rows) },
    uOrigin: { value: new THREE.Vector2(origin.x, origin.y) },
    uReach: { value: reach },
    uViewport: { value: new THREE.Vector2(width, height) },
    uTime: { value: 0 },
    uSeed: { value: Math.random() },
    uGrain: { value: GRAIN_PX * dpr },
    uInk: { value: new THREE.Color(ink) },
  };

  // DoubleSide: mapping uv straight to y-down pixels flips the quad's winding.
  const blend = { transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide };
  const cardGeometry = new THREE.PlaneGeometry(1, 1);
  const cardMaterial = new THREE.ShaderMaterial({ uniforms, vertexShader: cardVertex, fragmentShader: cardFragment, ...blend });
  const card = new THREE.Mesh(cardGeometry, cardMaterial);

  const cells = new Float32Array(columns * rows * 2);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = (row * columns + column) * 2;
      cells[index] = column;
      cells[index + 1] = row;
    }
  }
  const grainGeometry = new THREE.BufferGeometry();
  grainGeometry.setAttribute("aCell", new THREE.BufferAttribute(cells, 2));
  // three.js needs a position attribute to draw; the shader places grains itself.
  grainGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(columns * rows * 3), 3));
  const grainMaterial = new THREE.ShaderMaterial({ uniforms, vertexShader: grainVertex, fragmentShader: grainFragment, ...blend });
  const grains = new THREE.Points(grainGeometry, grainMaterial);

  card.frustumCulled = false;
  grains.frustumCulled = false;
  grains.renderOrder = 1;
  const scene = new THREE.Scene();
  scene.add(card, grains);
  const camera = new THREE.OrthographicCamera();

  const start = performance.now();
  const frame = (now: number) => {
    uniforms.uTime.value = (now - start) / 1000;
    renderer.render(scene, camera);
    if (uniforms.uTime.value < TOTAL_S) {
      requestAnimationFrame(frame);
      return;
    }
    cardGeometry.dispose();
    cardMaterial.dispose();
    grainGeometry.dispose();
    grainMaterial.dispose();
    texture.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
  return true;
}
