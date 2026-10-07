/**
 * Focus-view illustrations for /systems, drawn in the same line language as the overview
 * (ServerMachineParts) but in isometric projection. Parts are laid out in plan coordinates
 * (x to the right-back, y to the left-front, z up) and projected with `iso`; flat detail is
 * drawn in plan space inside `onPlane` groups so it lands on the right face automatically.
 */
import type { CSSProperties, ReactNode } from "react";

type Point = readonly [number, number];

const COS30 = Math.cos(Math.PI / 6);

function iso(x: number, y: number, z = 0): Point {
  return [(x - y) * COS30, (x + y) * 0.5 - z];
}

function pathFrom(points: readonly Point[]) {
  return `M${points.map(([x, y]) => `${+x.toFixed(2)} ${+y.toFixed(2)}`).join("L")}Z`;
}

function cross(origin: Point, first: Point, second: Point) {
  return (first[0] - origin[0]) * (second[1] - origin[1]) - (first[1] - origin[1]) * (second[0] - origin[0]);
}

function convexHull(points: Point[]) {
  const sorted = [...points].sort((first, second) => first[0] - second[0] || first[1] - second[1]);
  const lower: Point[] = [];
  const upper: Point[] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
    lower.push(point);
  }
  for (const point of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
    upper.push(point);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** Draw children on the horizontal plane at height z, in plan coordinates. */
function OnPlane({ z = 0, children }: { z?: number; children: ReactNode }) {
  return <g transform={`matrix(${COS30} 0.5 ${-COS30} 0.5 0 ${-z})`}>{children}</g>;
}

/** Draw children on the vertical plane x = const, in (y, z) coordinates (z up). */
function OnRightFace({ x, children }: { x: number; children: ReactNode }) {
  return <g transform={`matrix(${-COS30} 0.5 0 -1 ${x * COS30} ${x * 0.5})`}>{children}</g>;
}

type BoxProps = {
  x: number; y: number; w: number; d: number; h: number; z?: number;
  top?: string; radius?: number; children?: ReactNode; face?: ReactNode;
};

/** An extruded block: front (+y) and right (+x) sides, then the top with optional plan-space detail. */
function IsoBox({ x, y, w, d, h, z = 0, top = "machine-component-fill", radius = 0, children, face }: BoxProps) {
  const t = z + h;
  return <>
    <path className="machine-extrude" d={pathFrom([iso(x, y + d, z), iso(x + w, y + d, z), iso(x + w, y + d, t), iso(x, y + d, t)])} />
    <path className="machine-extrude focus-shade" d={pathFrom([iso(x + w, y, z), iso(x + w, y + d, z), iso(x + w, y + d, t), iso(x + w, y, t)])} />
    {face ? <OnRightFace x={x + w}>{face}</OnRightFace> : null}
    <OnPlane z={t}>
      <rect className={top} x={x} y={y} width={w} height={d} rx={radius} />
      {children}
    </OnPlane>
  </>;
}

function boxCorners(x: number, y: number, w: number, d: number, h: number, z = 0): Point[] {
  return [z, z + h].flatMap((level) => [iso(x, y, level), iso(x + w, y, level), iso(x + w, y + d, level), iso(x, y + d, level)]);
}

function lines(count: number, draw: (index: number) => string) {
  return Array.from({ length: count }, (_, index) => draw(index)).join("");
}

export type FocusArtwork = {
  viewBox: readonly [number, number, number, number];
  /** Outline of the drawing in viewBox coordinates; connectors stop just outside it. */
  silhouette: string;
  Art: () => ReactNode;
};

/* ------------------------------------------------------------------------------------------
 * CPU + RAM: the core of the X870E board — AM5 socket, VRM, four DDR5 sticks, 24-pin power,
 * sensor hub. The memory bus carries pulses between socket and DIMMs; DIMM light bars breathe.
 * ---------------------------------------------------------------------------------------- */

const BOARD = { x: 0, y: 0, w: 300, d: 240, h: 4 } as const;
const BOARD_TOP = BOARD.h;
const DIMMS = [0, 1, 2, 3].map((index) => ({ x: 204 + index * 16, y: 40, w: 6, d: 160, h: 34, z: BOARD_TOP + 3 }));
const IHS = { x: 82, y: 88, w: 68, d: 68 };
const AM5_IHS = (({ x, y, w, d }) => {
  const notch = (from: number) => [from, from + 9];
  const [a1, a2] = notch(y + 14);
  const [b1, b2] = notch(y + d - 23);
  const r = 4;
  // Plan-space outline with two cut-outs on each x edge, as on the AM5 heat spreader.
  return `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${a1}H${x + w - 6}V${a2}H${x + w}V${b1}H${x + w - 6}V${b2}H${x + w}V${y + d - r}`
    + `Q${x + w} ${y + d} ${x + w - r} ${y + d}H${x + r}Q${x} ${y + d} ${x} ${y + d - r}V${b2}H${x + 6}V${b1}H${x}V${a2}H${x + 6}V${a1}H${x}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
})(IHS);

function HardwareArt() {
  return (
    <g className="focus-art focus-art-hardware">
      <ellipse className="machine-ground" cx="30" cy="282" rx="230" ry="20" filter="url(#focus-soft-shadow)" />

      <IsoBox {...BOARD} top="machine-board-fill">
        <rect className="machine-inner-lip" x="6" y="6" width="288" height="228" />
        {[[10, 10], [290, 10], [10, 230], [290, 230], [190, 230]].map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}><circle className="machine-screw" cx={cx} cy={cy} r="4.2" /><circle className="machine-detail" cx={cx} cy={cy} r="2" /></g>
        ))}
        <path className="machine-trace" d="M30 196H120L130 186H186M48 60V40H100M250 150H262V200H240M186 30H250L262 42V58M24 190V140" />
        {DIMMS.map((dimm) => <rect key={dimm.x} className="machine-slot" x={dimm.x - 2} y={dimm.y - 8} width={dimm.w + 4} height={dimm.d + 16} rx="1.5" />)}
        <g className="focus-bus">{[0, 1, 2, 3, 4, 5].map((index) => <path key={index} d={`M178 ${100 + index * 9}H202`} />)}</g>
        <g className="focus-bus-pulse">{[0, 1, 2, 3, 4, 5].map((index) => <path key={index} d={`M178 ${100 + index * 9}H202`} />)}</g>
        <text className="focus-silk" x="30" y="233">X870E  /  ATX</text>
        <circle className="focus-led" cx="258" cy="224" r="2.4" />
      </IsoBox>

      {/* VRM: left and rear heatsinks with their chokes. */}
      <IsoBox x={18} y={64} w={26} d={120} h={24} z={BOARD_TOP} top="machine-heatsink">
        <path className="machine-fin" d={lines(14, (index) => `M20 ${70 + index * 8}H42`)} />
      </IsoBox>
      <IsoBox x={58} y={20} w={118} d={26} h={24} z={BOARD_TOP} top="machine-heatsink">
        <path className="machine-fin" d={lines(14, (index) => `M${64 + index * 8} 22V44`)} />
      </IsoBox>
      {Array.from({ length: 7 }, (_, index) => <IsoBox key={`r${index}`} x={64 + index * 15} y={50} w={9} d={9} h={8} z={BOARD_TOP} top="machine-chip" />)}
      {Array.from({ length: 7 }, (_, index) => <IsoBox key={`l${index}`} x={47} y={70 + index * 15} w={9} d={9} h={8} z={BOARD_TOP} top="machine-chip" />)}

      {/* AM5 socket, load plate and lever. */}
      <IsoBox x={64} y={70} w={104} d={104} h={5} z={BOARD_TOP} radius={3}>
        <rect className="machine-detail" x="70" y="76" width="92" height="92" rx="2" />
        <path className="machine-detail" d="M80 76A6 6 0 0 0 92 76M140 76A6 6 0 0 0 152 76M80 168A6 6 0 0 1 92 168M140 168A6 6 0 0 1 152 168" />
        {[[72, 78], [160, 78], [72, 166], [160, 166]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} className="machine-screw" cx={cx} cy={cy} r="2.4" />)}
      </IsoBox>
      <IsoBox x={170} y={74} w={4} d={98} h={6} z={BOARD_TOP} top="machine-chip" />
      <IsoBox x={IHS.x} y={IHS.y} w={IHS.w} d={IHS.d} h={6} z={BOARD_TOP + 5} top="focus-ihs-base">
        <path className="machine-ihs" d={AM5_IHS} />
        <text className="focus-etch" x="96" y="116">AMD RYZEN 9</text>
        <text className="focus-etch focus-etch-strong" x="96" y="128">9950X</text>
        <text className="focus-etch" x="96" y="140">16C / 32T</text>
        <path className="machine-detail" d="M87 151H93L87 145Z" />
      </IsoBox>

      {/* Four DDR5 sticks, back to front. */}
      {DIMMS.map((dimm, index) => (
        <g key={dimm.x} className="focus-dimm">
          <IsoBox x={dimm.x - 1} y={dimm.y - 6} w={dimm.w + 2} d={5} h={4} z={BOARD_TOP} top="machine-latch" />
          <IsoBox
            {...dimm}
            face={<>
              <path className="machine-detail" d={`M${dimm.y + 6} ${dimm.z + 4}H${dimm.y + dimm.d - 6}M${dimm.y + 6} ${dimm.z + 24}H${dimm.y + dimm.d - 6}`} />
              {Array.from({ length: 8 }, (_, chip) => <rect key={chip} className="machine-detail" x={dimm.y + 10 + chip * 18.5} y={dimm.z + 8} width={13} height={12} />)}
              <rect className="focus-lightbar" style={{ animationDelay: `${index * -0.65}s` } as CSSProperties} x={dimm.y + 4} y={dimm.z + dimm.h - 7} width={dimm.d - 8} height={4} rx="1.5" />
            </>}
          />
          <IsoBox x={dimm.x - 1} y={dimm.y + dimm.d + 1} w={dimm.w + 2} d={5} h={4} z={BOARD_TOP} top="machine-latch" />
        </g>
      ))}

      {/* 24-pin ATX power, sensor hub, CMOS cell, PCIe x16. */}
      <IsoBox x={270} y={60} w={18} d={86} h={14} z={BOARD_TOP} top="machine-chip">
        {Array.from({ length: 12 }, (_, pin) => <g key={pin}><rect className="machine-port" x="272.5" y={63 + pin * 6.8} width="5" height="4.6" /><rect className="machine-port" x="280.5" y={63 + pin * 6.8} width="5" height="4.6" /></g>)}
      </IsoBox>
      <IsoBox x={224} y={212} w={24} d={20} h={3} z={BOARD_TOP} top="machine-chip">
        <path className="machine-detail" d={lines(5, (index) => `M${228 + index * 4} 210V212M${228 + index * 4} 232V234`)} />
        <circle className="machine-detail" cx="229" cy="217" r="1.4" />
      </IsoBox>
      <OnPlane z={BOARD_TOP}><circle className="machine-extrude" cx="140" cy="194" r="12" /></OnPlane>
      <OnPlane z={BOARD_TOP + 4}><circle className="machine-chip" cx="140" cy="194" r="12" /><circle className="machine-detail" cx="140" cy="194" r="7.5" /></OnPlane>
      <IsoBox x={24} y={212} w={150} d={9} h={6} z={BOARD_TOP} top="machine-slot">
        <path className="machine-detail" d="M30 216.5H168" />
      </IsoBox>
    </g>
  );
}

const hardwareSilhouette = pathFrom(convexHull([
  ...boxCorners(BOARD.x, BOARD.y, BOARD.w, BOARD.d, BOARD.h),
  ...DIMMS.flatMap((dimm) => boxCorners(dimm.x, dimm.y, dimm.w, dimm.d, dimm.h, dimm.z)),
  ...boxCorners(58, 20, 118, 26, 24, BOARD_TOP),
  ...boxCorners(18, 64, 26, 120, 24, BOARD_TOP),
]));

export const focusArtwork: Partial<Record<string, FocusArtwork>> = {
  hardware: { viewBox: [-216, -16, 484, 304], silhouette: hardwareSilhouette, Art: HardwareArt },
};

export function FocusArtDefinitions() {
  return (
    <defs>
      <filter id="focus-soft-shadow" x="-20%" y="-200%" width="140%" height="500%">
        <feGaussianBlur stdDeviation="12" />
      </filter>
    </defs>
  );
}

/** A black-on-transparent image of the silhouette, for the connector clearance mask. */
export function silhouetteMaskSrc({ viewBox, silhouette }: FocusArtwork) {
  const [x, y, width, height] = viewBox;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}" width="${width * 2}" height="${height * 2}"><path d="${silhouette}" fill="#000"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
