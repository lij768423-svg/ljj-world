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

/** Draw children on the vertical plane y = const, in (x, z) coordinates (z up). */
function OnFrontFace({ y, children }: { y: number; children: ReactNode }) {
  return <g transform={`matrix(${COS30} 0.5 0 -1 ${-y * COS30} ${y * 0.5})`}>{children}</g>;
}

/** Text on a front face: face coordinates have z pointing up, so flip glyphs back upright. */
function FaceText({ x, z, className, children }: { x: number; z: number; className: string; children: ReactNode }) {
  return <text className={className} transform={`translate(${x} ${z}) scale(1 -1)`}>{children}</text>;
}

type BoxProps = {
  x: number; y: number; w: number; d: number; h: number; z?: number;
  top?: string; radius?: number; children?: ReactNode; face?: ReactNode; front?: ReactNode;
};

/**
 * An extruded block: front (+y) and right (+x) sides, then the top with optional plan-space
 * detail. `front` and `face` draw on the front and right sides in (x|y, z) coordinates.
 */
function IsoBox({ x, y, w, d, h, z = 0, top = "machine-component-fill", radius = 0, children, face, front }: BoxProps) {
  const t = z + h;
  return <>
    <path className="machine-extrude" d={pathFrom([iso(x, y + d, z), iso(x + w, y + d, z), iso(x + w, y + d, t), iso(x, y + d, t)])} />
    {front ? <OnFrontFace y={y + d}>{front}</OnFrontFace> : null}
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

function polar(radius: number, degrees: number) {
  const angle = (degrees * Math.PI) / 180;
  return `${+(radius * Math.cos(angle)).toFixed(2)} ${+(radius * Math.sin(angle)).toFixed(2)}`;
}

/** A fan in plan coordinates (place it inside OnPlane); the rotor spins via .focus-rotor. */
function FocusFan({ cx, cy, r, blades = 9, reverse = false, framed = false }: {
  cx: number; cy: number; r: number; blades?: number; reverse?: boolean; framed?: boolean;
}) {
  const hub = r * 0.3;
  const tip = r * 0.9;
  const sweep = (360 / blades) * 0.78;
  const mid = (hub + tip) / 2;
  const blade = `M${polar(hub, 0)}Q${polar(mid, -sweep * 0.14)} ${polar(tip, sweep * 0.5)}A${tip} ${tip} 0 0 1 ${polar(tip, sweep)}`
    + `Q${polar(mid, sweep * 0.84)} ${polar(hub, sweep * 0.45)}A${hub} ${hub} 0 0 0 ${polar(hub, 0)}Z`;
  const pad = r + 8;
  return (
    <g transform={`translate(${cx} ${cy})`}>
      {framed ? <rect className="machine-fan-bezel" x={-pad} y={-pad} width={pad * 2} height={pad * 2} rx="9" /> : null}
      <circle className="machine-fan-bezel" r={r + 3} />
      <circle className="machine-fan-well" r={r} />
      <path className="machine-fan-stator" d={`M0 0L${polar(r, 45)}M0 0L${polar(r, 165)}M0 0L${polar(r, 285)}`} />
      <g className={`focus-rotor${reverse ? " is-reverse" : ""}`}>
        {Array.from({ length: blades }, (_, index) => <path key={index} className="machine-fan-blade" transform={`rotate(${(index * 360) / blades})`} d={blade} />)}
        <circle className="machine-fan-hub" r={hub} />
        <circle className="machine-detail" r={hub * 0.55} />
      </g>
      {framed ? [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => (
        <g key={`${sx}${sy}`}><circle className="machine-screw" cx={sx * (pad - 7)} cy={sy * (pad - 7)} r="4" /><circle className="machine-detail" cx={sx * (pad - 7)} cy={sy * (pad - 7)} r="1.6" /></g>
      )) : null}
    </g>
  );
}

function bounds(points: Point[]) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/** Soft floor shadow under a drawing whose projected extent is `points`. */
function GroundShadow({ points }: { points: Point[] }) {
  const { minX, maxX, maxY } = bounds(points);
  return <ellipse className="machine-ground" cx={(minX + maxX) / 2 + 12} cy={maxY + 6} rx={(maxX - minX) * 0.44} ry="18" filter="url(#focus-soft-shadow)" />;
}

/** Silhouette and a viewBox fitted to the projected points (with room for the floor shadow). */
function defineArtwork(points: Point[], Art: () => ReactNode, margin = 14): FocusArtwork {
  const { minX, maxX, minY, maxY } = bounds(points);
  return {
    viewBox: [+(minX - margin).toFixed(1), +(minY - margin).toFixed(1), +(maxX - minX + margin * 2).toFixed(1), +(maxY - minY + margin * 2 + 18).toFixed(1)],
    silhouette: pathFrom(convexHull(points)),
    Art,
  };
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

/* ------------------------------------------------------------------------------------------
 * Network: dual-port 2.5 GbE card (I226-V). Packets run from the PCIe fingers through the
 * controller to the jacks; link/activity LEDs blink at different rhythms.
 * ---------------------------------------------------------------------------------------- */

const NIC = { x: 0, y: 0, w: 120, d: 196, h: 3 } as const;
const NIC_JACKS = [10, 64].map((x) => ({ x, y: 150, w: 42, d: 46, h: 32, z: NIC.h }));
const NIC_BRACKET = { x: -10, y: 196, w: 140, d: 4, h: 76, z: -18 } as const;
const NIC_POINTS = [
  ...boxCorners(NIC.x, NIC.y, NIC.w, NIC.d, NIC.h),
  ...boxCorners(NIC_BRACKET.x, NIC_BRACKET.y, NIC_BRACKET.w, NIC_BRACKET.d, NIC_BRACKET.h, NIC_BRACKET.z),
  ...boxCorners(120, 52, 7, 88, 2),
  ...boxCorners(34, 60, 52, 52, 18, NIC.h),
];

function NetworkArt() {
  return (
    <g className="focus-art focus-art-network">
      <GroundShadow points={NIC_POINTS} />
      <IsoBox {...NIC} top="machine-board-fill" radius={2}>
        <rect className="machine-inner-lip" x="4" y="4" width="112" height="188" rx="1.5" />
        <circle className="machine-screw" cx="12" cy="12" r="4" />
        <path className="machine-trace" d="M100 30H108V48M14 40H28V56M100 146V128H88M20 120H30L34 116" />
        <g className="focus-bus">{[0, 1, 2, 3].map((index) => <path key={index} d={`M120 ${72 + index * 9}H96L${88 - index * 2} ${80 + index * 9}`} />)}</g>
        <g className="focus-bus-pulse">{[0, 1, 2, 3].map((index) => <path key={index} d={`M120 ${72 + index * 9}H96L${88 - index * 2} ${80 + index * 9}`} />)}</g>
        <g className="focus-bus">{[0, 1, 2].map((index) => <path key={index} d={`M${44 + index * 14} 112V146`} />)}</g>
        <g className="focus-bus-pulse">{[0, 1, 2].map((index) => <path key={index} d={`M${44 + index * 14} 112V146`} />)}</g>
        <text className="focus-silk" x="8" y="186">2.5GbE · I226-V</text>
      </IsoBox>
      <IsoBox x={120} y={52} w={7} d={88} h={2} top="machine-fingers">
        <path className="machine-detail" d={lines(26, (index) => `M120.5 ${55 + index * 3.3}H126.5`)} />
      </IsoBox>
      <IsoBox x={92} y={38} w={14} d={9} h={4} z={NIC.h} top="machine-chip" />
      <IsoBox x={90} y={118} w={18} d={18} h={3} z={NIC.h} top="machine-chip">
        <circle className="machine-detail" cx="94" cy="122" r="1.2" />
      </IsoBox>
      {[0, 1, 2, 3].map((index) => <IsoBox key={index} x={12 + index * 9} y={66} w={5} d={8} h={4} z={NIC.h} top="machine-chip" />)}
      <IsoBox x={34} y={60} w={52} d={52} h={18} z={NIC.h} top="machine-heatsink">
        <path className="machine-fin" d={lines(12, (index) => `M${38 + index * 4} 63V109`)} />
        <circle className="machine-screw" cx="39" cy="65" r="3" />
        <circle className="machine-screw" cx="81" cy="107" r="3" />
      </IsoBox>
      {NIC_JACKS.map((jack) => <IsoBox key={jack.x} {...jack} top="machine-chip">
        <path className="machine-detail" d={`M${jack.x + 4} ${jack.y + 6}H${jack.x + jack.w - 4}M${jack.x + 4} ${jack.y + 12}H${jack.x + jack.w - 4}`} />
      </IsoBox>)}
      <IsoBox
        {...NIC_BRACKET}
        top="machine-bracket"
        front={<>
          {NIC_JACKS.map((jack, index) => (
            <g key={jack.x}>
              <rect className="machine-port" x={jack.x + 4} y={NIC.h + 4} width={jack.w - 8} height={22} rx="1.5" />
              <path className="machine-detail" d={`M${jack.x + 10} ${NIC.h + 8}H${jack.x + jack.w - 10}V${NIC.h + 18}H${jack.x + jack.w / 2 + 5}V${NIC.h + 22}H${jack.x + jack.w / 2 - 5}V${NIC.h + 18}H${jack.x + 10}Z`} />
              <circle className="focus-port-led" style={{ animationDelay: `${index * -0.37}s` } as CSSProperties} cx={jack.x + 7} cy={NIC.h + 30} r="2.2" />
              <circle className="focus-port-led is-activity" style={{ animationDelay: `${index * -0.21}s` } as CSSProperties} cx={jack.x + jack.w - 7} cy={NIC.h + 30} r="2.2" />
            </g>
          ))}
          <path className="machine-detail" d={lines(5, (index) => `M${112 + index * 3.5} 6V40`)} />
          <circle className="machine-screw" cx="120" cy="50" r="3.2" />
        </>}
      />
    </g>
  );
}

/* ------------------------------------------------------------------------------------------
 * GPU: a three-slot card with twin counter-rotating fans, the fin stack showing through the
 * side, a breathing light bar, 16-pin power and the display-output bracket.
 * ---------------------------------------------------------------------------------------- */

const GPU = { x: 0, y: 0, w: 300, d: 128, h: 54 } as const;
const GPU_BRACKET = { x: 300, y: -8, w: 4, d: 144, h: 76, z: -14 } as const;
const GPU_POINTS = [
  ...boxCorners(GPU.x, GPU.y, GPU.w, GPU.d, GPU.h),
  ...boxCorners(GPU_BRACKET.x, GPU_BRACKET.y, GPU_BRACKET.w, GPU_BRACKET.d, GPU_BRACKET.h, GPU_BRACKET.z),
  ...boxCorners(196, 128, 30, 8, 12, 30),
];

function GraphicsArt() {
  return (
    <g className="focus-art focus-art-gpu">
      <GroundShadow points={GPU_POINTS} />
      <IsoBox
        {...GPU}
        front={<>
          <path className="machine-fin" d={lines(72, (index) => `M${8 + index * 4} 6V36`)} />
          <path className="machine-shroud-trim" d="M4 4H296M4 38H296" />
          <rect className="focus-lightbar" x="16" y="42" width="168" height="5" rx="2" />
          <FaceText x={196} z={42} className="focus-etch focus-etch-face">GEFORCE RTX 4090</FaceText>
        </>}
        face={<path className="machine-shroud-trim" d="M10 8H118M10 46H118" />}
      >
        <path className="machine-shroud-trim" d="M12 8H286L294 16V112L286 120H12L6 114V14Z" />
        <path className="machine-shroud-trim" d="M150 14L142 24V104L150 114M158 14L166 24V104L158 114" />
        <rect className="machine-heatsink" x="140" y="26" width="28" height="76" rx="2" />
        <path className="machine-fin" d={lines(6, (index) => `M${144 + index * 4} 30V98`)} />
        <FocusFan cx={84} cy={64} r={50} blades={11} />
        <FocusFan cx={224} cy={64} r={50} blades={11} reverse />
      </IsoBox>
      <IsoBox
        x={196} y={128} w={30} d={8} h={12} z={30} top="machine-chip"
        front={<path className="machine-port" d={lines(6, (index) => `M${200 + index * 4} 33V39`)} />}
      />
      <IsoBox
        {...GPU_BRACKET}
        top="machine-bracket"
        face={<>
          {[8, 34, 60].map((y) => <path key={y} className="machine-port" d={`M${y} 20H${y + 20}V30L${y + 17} 33H${y + 3}L${y} 30Z`} />)}
          <path className="machine-port" d="M88 20H112V30L108 33H92L88 30Z" />
          <path className="machine-detail" d={lines(12, (index) => `M${10 + index * 9} 40V54`)} />
          <circle className="machine-screw" cx="128" cy="56" r="3" />
        </>}
      />
    </g>
  );
}

/* ------------------------------------------------------------------------------------------
 * Data: two M.2 2280 drives — one under a finned heatsink, one bare with its controller,
 * DRAM and NAND. NAND cells light up in sequence (reads/writes) and the bus carries pulses.
 * ---------------------------------------------------------------------------------------- */

const DRIVE_A = { x: 0, y: 30, w: 280, d: 76, h: 3 } as const;
const DRIVE_B = { x: 0, y: -66, w: 280, d: 76, h: 3 } as const;
const NVME_POINTS = [
  ...boxCorners(-14, DRIVE_B.y + 4, 294, DRIVE_B.d - 8, 23),
  ...boxCorners(-14, DRIVE_A.y + 4, 294, DRIVE_A.d - 8, 8),
];

function M2Fingers({ y }: { y: number }) {
  return <>
    <IsoBox x={-14} y={y + 4} w={14} d={24} h={1.6} top="machine-fingers">
      <path className="machine-detail" d={lines(7, (index) => `M-13 ${y + 7 + index * 3.2}H-1`)} />
    </IsoBox>
    <IsoBox x={-14} y={y + 34} w={14} d={38} h={1.6} top="machine-fingers">
      <path className="machine-detail" d={lines(11, (index) => `M-13 ${y + 37 + index * 3.2}H-1`)} />
    </IsoBox>
  </>;
}

function StorageArt() {
  return (
    <g className="focus-art focus-art-data">
      <GroundShadow points={NVME_POINTS} />
      <M2Fingers y={DRIVE_B.y} />
      <IsoBox {...DRIVE_B} top="machine-board-fill" radius={2} />
      <IsoBox x={4} y={DRIVE_B.y + 4} w={268} d={68} h={20} z={DRIVE_B.h} top="machine-heatsink" radius={3}
        face={<path className="machine-fin" d={lines(9, (index) => `M${DRIVE_B.y + 10 + index * 7} 6V20`)} />}
      >
        <path className="machine-fin" d={lines(10, (index) => `M10 ${DRIVE_B.y + 9 + index * 6.4}H266`)} />
        <rect className="machine-label-plate" x="96" y={DRIVE_B.y + 22} width="86" height="32" rx="2" />
        <text className="focus-etch focus-etch-strong" x="104" y={DRIVE_B.y + 37}>NVMe 4TB</text>
        <text className="focus-etch" x="104" y={DRIVE_B.y + 48}>PCIe 4.0 x4</text>
        <circle className="machine-screw" cx="264" cy={DRIVE_B.y + 38} r="4" />
      </IsoBox>

      <M2Fingers y={DRIVE_A.y} />
      <IsoBox {...DRIVE_A} top="machine-board-fill" radius={2}>
        <circle className="machine-screw" cx="274" cy={DRIVE_A.y + 38} r="5" />
        <g className="focus-bus">{[0, 1, 2, 3].map((index) => <path key={index} d={`M66 ${DRIVE_A.y + 24 + index * 9}H116M176 ${DRIVE_A.y + 24 + index * 9}H192`} />)}</g>
        <g className="focus-bus-pulse">{[0, 1, 2, 3].map((index) => <path key={index} d={`M66 ${DRIVE_A.y + 24 + index * 9}H116M176 ${DRIVE_A.y + 24 + index * 9}H192`} />)}</g>
        <path className="machine-trace" d={`M0 ${DRIVE_A.y + 20}H18L26 ${DRIVE_A.y + 28}M0 ${DRIVE_A.y + 58}H18L26 ${DRIVE_A.y + 50}`} />
        <circle className="focus-led" cx="14" cy={DRIVE_A.y + 68} r="2.6" />
        <text className="focus-silk" x="200" y={DRIVE_A.y + 72}>M.2 2280 · 1TB</text>
      </IsoBox>
      <IsoBox x={26} y={DRIVE_A.y + 18} w={40} d={40} h={4} z={DRIVE_A.h} top="machine-chip">
        <circle className="machine-detail" cx="31" cy={DRIVE_A.y + 23} r="1.4" />
        <text className="focus-etch" x="32" y={DRIVE_A.y + 42}>CTRL</text>
      </IsoBox>
      <IsoBox x={76} y={DRIVE_A.y + 22} w={24} d={32} h={3} z={DRIVE_A.h} top="machine-chip" />
      {[116, 192].map((x) => (
        <IsoBox key={x} x={x} y={DRIVE_A.y + 12} w={60} d={52} h={4} z={DRIVE_A.h} top="machine-chip">
          {Array.from({ length: 24 }, (_, cell) => (
            <rect
              key={cell}
              className="focus-nand-cell"
              style={{ animationDelay: `${((cell * 7 + x) % 24) * 0.11}s` } as CSSProperties}
              x={x + 5 + (cell % 6) * 8.6}
              y={DRIVE_A.y + 17 + Math.floor(cell / 6) * 10.6}
              width="6.4"
              height="8"
              rx="1"
            />
          ))}
        </IsoBox>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------------------------------
 * Containers: the three-fan intake tray from the overview, fans turning (the middle one the
 * other way) and air rising off it.
 * ---------------------------------------------------------------------------------------- */

const TRAY = { x: 0, y: 0, w: 420, d: 140, h: 26 } as const;
const TRAY_FANS = [70, 210, 350];
/** Height above the tray where the airflow chevrons start, and how far they drift up. */
const AIRFLOW_BASE = TRAY.h + 30;
const AIRFLOW_DRIFT = 28;
const TRAY_POINTS = [
  ...boxCorners(TRAY.x, TRAY.y, TRAY.w, TRAY.d, TRAY.h),
  ...TRAY_FANS.map((x): Point => { const [sx, sy] = iso(x, 70, AIRFLOW_BASE); return [sx, sy - AIRFLOW_DRIFT - 6]; }),
];

function ContainersArt() {
  return (
    <g className="focus-art focus-art-containers">
      <GroundShadow points={TRAY_POINTS} />
      <IsoBox
        {...TRAY}
        radius={6}
        front={<>
          <path className="machine-detail" d={lines(26, (index) => `M${18 + index * 6} 6V18`)} />
          <path className="machine-detail" d={lines(26, (index) => `M${258 + index * 6} 6V18`)} />
          <FaceText x={192} z={8} className="focus-silk">AIRFLOW · 119 CONTAINERS</FaceText>
        </>}
        face={<path className="machine-detail" d={lines(14, (index) => `M${10 + index * 9} 6V18`)} />}
      >
        <path className="machine-detail" d="M140 6V134M280 6V134" />
        {TRAY_FANS.map((x, index) => <FocusFan key={x} cx={x} cy={70} r={58} blades={9} reverse={index === 1} />)}
        {TRAY_FANS.flatMap((x) => [[x - 64, 6], [x + 64, 6], [x - 64, 134], [x + 64, 134]]).map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}><circle className="machine-screw" cx={cx} cy={cy} r="3.4" /><circle className="machine-detail" cx={cx} cy={cy} r="1.4" /></g>
        ))}
      </IsoBox>
      <g className="focus-airflow" aria-hidden="true">
        {TRAY_FANS.map((x, index) => {
          const [sx, sy] = iso(x, 70, AIRFLOW_BASE);
          return (
            <g key={x} transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)})`}>
              {[0, 1].map((step) => (
                <path
                  key={step}
                  className="focus-air-chevron"
                  style={{ animationDelay: `${index * -0.37 + step * -0.7}s` } as CSSProperties}
                  d="M-11 5L0 -4L11 5"
                />
              ))}
            </g>
          );
        })}
      </g>
    </g>
  );
}

export const focusArtwork: Partial<Record<string, FocusArtwork>> = {
  network: defineArtwork(NIC_POINTS, NetworkArt),
  hardware: { viewBox: [-216, -16, 484, 304], silhouette: hardwareSilhouette, Art: HardwareArt },
  agent: defineArtwork(GPU_POINTS, GraphicsArt),
  data: defineArtwork(NVME_POINTS, StorageArt),
  containers: defineArtwork(TRAY_POINTS, ContainersArt),
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
