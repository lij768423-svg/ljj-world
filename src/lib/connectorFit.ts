/**
 * Stops the focus-view service connectors at the edge of the part artwork instead of
 * drawing across it. The artwork's alpha channel is sampled into a small mask, grown by a
 * clearance margin, and each connector is walked from its service card inwards until it
 * would enter that mask.
 */

export type ConnectorSegment = readonly [number, number, number, number];
export type ConnectorLayout = {
  segments: readonly ConnectorSegment[];
  endX: number;
  endY: number;
  anchor?: readonly [number, number];
};
/** The artwork's drawn area in the connector SVG's 0–100 coordinate space. */
export type ArtworkBox = { left: number; top: number; width: number; height: number };
type ArtworkMask = { width: number; height: number; cells: Uint8Array };
type Point = readonly [number, number];

const MASK_RESOLUTION = 160;
const ALPHA_THRESHOLD = 40;
/** Clearance around the artwork, as a share of the mask (≈ 12px at the desktop size). */
const CLEARANCE = 0.018;
/** How far past its original inner point a connector may extend to reach the artwork. */
const MAX_EXTENSION = 9;
const STEP = 0.2;

const masks = new Map<string, Promise<ArtworkMask | null>>();

export function loadArtworkMask(src: string) {
  let pending = masks.get(src);
  if (!pending) {
    pending = buildMask(src).catch(() => null);
    masks.set(src, pending);
  }
  return pending;
}

async function buildMask(src: string): Promise<ArtworkMask | null> {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  await image.decode();
  const scale = MASK_RESOLUTION / Math.max(image.naturalWidth, image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const radius = Math.max(1, Math.round(CLEARANCE * MASK_RESOLUTION));
  const cells = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] <= ALPHA_THRESHOLD) continue;
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (dx * dx + dy * dy > radius * radius || nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          cells[ny * width + nx] = 1;
        }
      }
    }
  }
  return { width, height, cells };
}

function covers(mask: ArtworkMask, box: ArtworkBox, [x, y]: Point) {
  const u = (x - box.left) / box.width;
  const v = (y - box.top) / box.height;
  if (u < 0 || v < 0 || u >= 1 || v >= 1) return false;
  return mask.cells[Math.floor(v * mask.height) * mask.width + Math.floor(u * mask.width)] === 1;
}

function toSegments(points: Point[]): ConnectorSegment[] {
  const segments: ConnectorSegment[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[index + 1];
    if (Math.hypot(x2 - x1, y2 - y1) > 0.05) segments.push([+x1.toFixed(2), +y1.toFixed(2), x2, y2]);
  }
  return segments;
}

/** Trim (or slightly extend) one connector so it ends just outside the artwork. */
export function fitConnector(layout: ConnectorLayout, mask: ArtworkMask, box: ArtworkBox): ConnectorLayout {
  const inner: Point = [layout.segments[0][0], layout.segments[0][1]];
  // Walk from the service card inwards: card → … → original inner point → a short extension.
  const route: Point[] = [[layout.endX, layout.endY], ...[...layout.segments].reverse().map(([x1, y1]): Point => [x1, y1])];
  const [beforeX, beforeY] = route[route.length - 2];
  const length = Math.hypot(inner[0] - beforeX, inner[1] - beforeY) || 1;
  route.push([inner[0] + ((inner[0] - beforeX) / length) * MAX_EXTENSION, inner[1] + ((inner[1] - beforeY) / length) * MAX_EXTENSION]);

  let previous = route[0];
  for (let index = 1; index < route.length; index += 1) {
    const [ax, ay] = route[index - 1];
    const [bx, by] = route[index];
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / STEP));
    for (let step = 1; step <= steps; step += 1) {
      const point: Point = [ax + ((bx - ax) * step) / steps, ay + ((by - ay) * step) / steps];
      if (covers(mask, box, point)) {
        const outward = [...route.slice(0, index), previous].reverse();
        return { ...layout, segments: toSegments(outward), anchor: previous };
      }
      previous = point;
    }
  }
  // Never reaches the artwork: keep the designed connector.
  return layout;
}

/**
 * The drawn area of artwork contained in `element` (an `object-fit: contain` image, or a
 * box holding a `meet` SVG), ignoring transforms that are still animating.
 */
export function measureArtworkBox(element: HTMLElement, naturalWidth: number, naturalHeight: number, frame: Element): ArtworkBox | null {
  if (!naturalWidth || !naturalHeight) return null;
  const stage = frame.getBoundingClientRect();
  if (!stage.width || !stage.height) return null;
  const rect = element.getBoundingClientRect();
  const scale = Math.min(element.offsetWidth / naturalWidth, element.offsetHeight / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return {
    left: ((centerX - width / 2 - stage.left) / stage.width) * 100,
    top: ((centerY - height / 2 - stage.top) / stage.height) * 100,
    width: (width / stage.width) * 100,
    height: (height / stage.height) * 100,
  };
}

/** Which way a service card may slide to make room for its connector. */
export type CardSlide = "up" | "down" | "right";
/** Card size in the connector SVG's 0–100 space, plus the stage's pixel size. */
export type PlacementFrame = { cardWidth: number; cardHeight: number; pixelWidth: number; pixelHeight: number };

/** Visible length a connector should keep (px); cards slide outwards until they reach it. */
const MIN_CONNECTOR_LENGTH = 88;
const SLIDE_STEP = 1;
const EDGE_MARGIN = 1.5;

function slideCard(layout: ConnectorLayout, slide: CardSlide, offset: number): ConnectorLayout {
  const segments = layout.segments.map((segment) => [...segment] as [number, number, number, number]);
  const last = segments[segments.length - 1];
  if (slide === "right") {
    last[2] += offset;
    return { segments, endX: layout.endX + offset, endY: layout.endY };
  }
  const dy = slide === "up" ? -offset : offset;
  // The card-side horizontal leg moves with the card; the vertical leg before it stretches.
  last[1] += dy;
  last[3] += dy;
  if (segments.length > 1) segments[segments.length - 2][3] += dy;
  return { segments, endX: layout.endX, endY: layout.endY + dy };
}

function pixelLength(layout: ConnectorLayout, frame: PlacementFrame) {
  return layout.segments.reduce((total, [x1, y1, x2, y2]) => total + Math.hypot(
    ((x2 - x1) / 100) * frame.pixelWidth,
    ((y2 - y1) / 100) * frame.pixelHeight,
  ), 0);
}

function withinStage(layout: ConnectorLayout, slide: CardSlide, frame: PlacementFrame) {
  if (slide === "right") return layout.endX + frame.cardWidth <= 100 - EDGE_MARGIN;
  const half = frame.cardHeight / 2 + EDGE_MARGIN;
  return layout.endY >= half && layout.endY <= 100 - half;
}

/**
 * Fit a connector to the artwork and, if the artwork leaves it too short to read, slide its
 * card outwards (staying on stage) until the connector is long enough again.
 */
export function placeConnector(layout: ConnectorLayout, slide: CardSlide, mask: ArtworkMask, box: ArtworkBox, frame: PlacementFrame) {
  let best = fitConnector(layout, mask, box);
  let bestLength = pixelLength(best, frame);
  for (let offset = SLIDE_STEP; bestLength < MIN_CONNECTOR_LENGTH; offset += SLIDE_STEP) {
    const moved = slideCard(layout, slide, offset);
    if (!withinStage(moved, slide, frame)) break;
    const fitted = fitConnector(moved, mask, box);
    const length = pixelLength(fitted, frame);
    if (length > bestLength) {
      best = fitted;
      bestLength = length;
    }
  }
  return best;
}
