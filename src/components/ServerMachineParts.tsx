/**
 * Overview line art for the exploded server on /systems.
 *
 * Every part keeps the footprint the camera frames, explode offsets, hotspots and
 * focus raster images in ServerExplodedStory are tuned to; only the drawing inside
 * each module changes. Depth is a consistent oblique extrusion towards the lower right.
 */

type Point = readonly [number, number];

const DEPTH_SLOPE = 0.85;

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

function pathFrom(points: readonly Point[]) {
  return `M${points.map(([x, y]) => `${+x.toFixed(1)} ${+y.toFixed(1)}`).join("L")}Z`;
}

function roundedRectPoints(x: number, y: number, width: number, height: number, radius: number): Point[] {
  const corners: Array<[number, number, number]> = [
    [x + width - radius, y + radius, -90],
    [x + width - radius, y + height - radius, 0],
    [x + radius, y + height - radius, 90],
    [x + radius, y + radius, 180],
  ];
  return corners.flatMap(([cx, cy, start]) => [0, 45, 90].map((step): Point => {
    const angle = ((start + step) * Math.PI) / 180;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  }));
}

/** The visible thickness of a face: the hull of the face and its copy pushed back along the depth axis. */
function Solid({ points, depth }: { points: Point[]; depth: number }) {
  const pushed = points.map(([x, y]): Point => [x + depth, y + depth * DEPTH_SLOPE]);
  return <path className="machine-extrude" d={pathFrom(convexHull([...points, ...pushed]))} />;
}

function Box({ x, y, width, height, radius = 2, depth = 5, className = "machine-component-fill" }: {
  x: number; y: number; width: number; height: number; radius?: number; depth?: number; className?: string;
}) {
  return <>
    <Solid points={roundedRectPoints(x, y, width, height, radius)} depth={depth} />
    <rect className={className} x={x} y={y} width={width} height={height} rx={radius} />
  </>;
}

function Screw({ x, y, r = 2.6 }: { x: number; y: number; r?: number }) {
  return <g className="machine-fastener">
    <circle className="machine-screw" cx={x} cy={y} r={r} />
    <path className="machine-detail" d={`M${x - r * .5} ${y - r * .5}L${x + r * .5} ${y + r * .5}M${x - r * .5} ${y + r * .5}L${x + r * .5} ${y - r * .5}`} />
  </g>;
}

function lines(count: number, draw: (index: number) => string) {
  return Array.from({ length: count }, (_, index) => draw(index)).join("");
}

function polar(radius: number, degrees: number) {
  const angle = (degrees * Math.PI) / 180;
  return `${+(radius * Math.cos(angle)).toFixed(2)} ${+(radius * Math.sin(angle)).toFixed(2)}`;
}

export function FanGraphic({
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
  const hub = r * 0.34;
  const tip = r * 0.86;
  const sweep = (360 / blades) * 0.8;
  const mid = (hub + tip) / 2;
  const blade = [
    `M${polar(hub, 0)}`,
    `Q${polar(mid, -sweep * 0.12)} ${polar(tip, sweep * 0.5)}`,
    `A${tip.toFixed(2)} ${tip.toFixed(2)} 0 0 1 ${polar(tip, sweep)}`,
    `Q${polar(mid, sweep * 0.82)} ${polar(hub, sweep * 0.42)}`,
    `A${hub.toFixed(2)} ${hub.toFixed(2)} 0 0 0 ${polar(hub, 0)}Z`,
  ].join("");
  const corner = r + 4;
  return (
    <g className={`${className}${reverse ? " is-reverse" : ""}`} transform={skew ? `translate(${x} ${y}) skewX(-8) scale(1 .52)` : `translate(${x} ${y})`}>
      {framed
        ? <rect className="machine-fan-bezel" x={-corner} y={-corner} width={corner * 2} height={corner * 2} rx="6" />
        : <circle className="machine-fan-bezel" r={r + 1.5} />}
      <circle className="machine-fan-well" r={r * 0.95} />
      <path className="machine-fan-stator" d={`M0 0L${polar(r * 0.95, 30)}M0 0L${polar(r * 0.95, 150)}M0 0L${polar(r * 0.95, 270)}`} />
      <g className="machine-fan-rotor">
        {Array.from({ length: blades }, (_, index) => (
          <path key={index} className="machine-fan-blade" transform={`rotate(${(index * 360) / blades})`} d={blade} />
        ))}
        <circle className="machine-fan-hub" r={hub} />
        <circle className="machine-detail" r={hub * 0.52} />
      </g>
      {framed ? [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => (
        <circle key={`${sx}${sy}`} className="machine-screw" cx={sx * (corner - 4.5)} cy={sy * (corner - 4.5)} r="2.1" />
      )) : null}
    </g>
  );
}

export function MachineDefinitions() {
  return (
    <defs>
      <pattern id="server-mesh" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle className="machine-mesh-hole" cx="1.5" cy="1.5" r="1" />
        <circle className="machine-mesh-hole" cx="4.5" cy="4.5" r="1" />
      </pattern>
      <pattern id="server-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <path className="machine-hatch-line" d="M0 0V4" />
      </pattern>
      <filter id="server-soft-shadow" x="-20%" y="-200%" width="140%" height="500%">
        <feGaussianBlur stdDeviation="10" />
      </filter>
    </defs>
  );
}

export function MachineBackdrop() {
  return (
    <g className="machine-load-group machine-load-backdrop" aria-hidden="true">
      <ellipse className="machine-ground" cx="506" cy="570" rx="286" ry="16" filter="url(#server-soft-shadow)" />
      <circle className="machine-orbit machine-orbit-a" cx="497" cy="344" r="304" />
      <path className="machine-measure" d="M246 112H742M246 106V118M742 106V118M776 136V552M770 136H782M770 552H782" />
      <path className="machine-measure machine-measure-fine" d={lines(9, (index) => `M${246 + index * 62} 112V115`)} />
      <path className="machine-register" d="M214 120V102H232M780 102H798V120M214 566V584H232M798 566V584H780" />
      <text x="246" y="100">HOME-SERVE / ASSEMBLY</text>
      <text x="742" y="100" textAnchor="end">496 × 416</text>
    </g>
  );
}

const caseOutline = roundedRectPoints(246, 136, 496, 416, 16);

export function ChassisArt() {
  return <>
    <Solid points={caseOutline} depth={8} />
    <rect className="machine-panel" x="246" y="136" width="496" height="416" rx="16" />
    <rect className="machine-inner-lip" x="253" y="143" width="482" height="402" rx="11" />

    <rect className="machine-front-panel" x="260" y="154" width="76" height="376" rx="7" />
    <rect className="machine-chip" x="270" y="166" width="56" height="34" rx="4" />
    <circle className="machine-power" cx="285" cy="183" r="7" />
    <path className="machine-detail" d="M285 178.6V183.4M281.7 180.1A4.7 4.7 0 1 0 288.3 180.1" />
    <rect className="machine-detail" x="298" y="175" width="5" height="16" rx="2.5" />
    <rect className="machine-detail" x="307" y="175" width="5" height="16" rx="2.5" />
    <circle className="machine-status" cx="319" cy="191" r="1.7" />
    <rect className="machine-mesh" x="270" y="212" width="56" height="188" rx="4" />
    <rect className="machine-chip" x="270" y="412" width="56" height="106" rx="4" />
    <circle className="machine-detail" cx="298" cy="447" r="19" />
    <circle className="machine-detail" cx="298" cy="447" r="12" />
    <path className="machine-detail" d="M279 447H317M298 428V466M284.6 433.6L311.4 460.4M311.4 433.6L284.6 460.4" />
    <circle className="machine-fan-hub" cx="298" cy="447" r="4" />
    <rect className="machine-port" x="285" y="482" width="26" height="18" rx="2" />
    <path className="machine-detail" d="M291 488V494M298 488V494M305 488V494" />
    {[[276, 418], [320, 418], [276, 512], [320, 512]].map(([x, y]) => <circle key={`${x}-${y}`} className="machine-screw" cx={x} cy={y} r="1.8" />)}

    <rect className="machine-bay" x="348" y="152" width="380" height="388" rx="9" />
    {Array.from({ length: 12 }, (_, index) => <rect key={index} className="machine-slot" x={388 + index * 26} y="164" width="16" height="5" rx="2.5" />)}
    {[206, 296, 386].map((y) => <rect key={y} className="machine-grommet" x="715" y={y} width="7" height="54" rx="3.5" />)}
    {[[257, 147], [731, 147], [257, 541], [731, 541]].map(([x, y]) => <Screw key={`${x}-${y}`} x={x} y={y} r={3.4} />)}
    <text x="262" y="548">LIAN LI B4 / HOME-SERVE</text>
  </>;
}

export function BoardArt() {
  return <>
    <Box x={360} y={198} width={344} height={272} radius={5} depth={4} className="machine-board-fill" />
    <rect className="machine-inner-lip" x="365" y="203" width="334" height="262" rx="3" />

    <Box x={366} y={204} width={88} height={50} radius={4} depth={5} className="machine-shroud" />
    <rect className="machine-shroud-hatch" x="372" y="210" width="40" height="38" rx="2" />
    <path className="machine-detail" d="M420 215H446M420 223H446M420 231H438" />

    <Box x={462} y={232} width={86} height={24} radius={2} depth={4} className="machine-heatsink" />
    <path className="machine-fin" d={lines(13, (index) => `M${468 + index * 6} 236V252`)} />
    <Box x={428} y={262} width={28} height={30} radius={2} depth={4} className="machine-heatsink" />
    <path className="machine-fin" d={lines(5, (index) => `M432 ${267 + index * 5}H452`)} />

    <rect className="machine-chip" x="674" y="284" width="22" height="72" rx="2" />
    <path className="machine-detail" d={lines(12, (index) => `M678 ${289 + index * 5.6}H682M688 ${289 + index * 5.6}H692`)} />
    <circle className="machine-chip" cx="381" cy="388" r="9" />
    <circle className="machine-detail" cx="381" cy="388" r="5.5" />
    <rect className="machine-chip" x="366" y="448" width="26" height="12" rx="1.5" />
    <path className="machine-detail" d={lines(5, (index) => `M${370 + index * 4.5} 452V456`)} />

    <path className="machine-trace machine-trace-a" d="M374 260V272H404L414 282H424M454 242H462M372 300V372M394 352H448L456 360M582 302H586M684 226V276" />
    <path className="machine-trace machine-trace-b" d="M386 404V436H400M684 362V376M700 222V280M548 258V264H560" />
    <path className="machine-scan-line" d="M366 206H698" />
    <g className="machine-board-nodes" aria-hidden="true">
      <circle cx="424" cy="282" r="2.6" />
      <circle cx="372" cy="372" r="2.6" />
      <circle cx="456" cy="360" r="2.6" />
      <circle cx="684" cy="226" r="2.6" />
      <circle cx="400" cy="436" r="2.2" />
    </g>
    {[[696, 208], [368, 462], [696, 462], [544, 462]].map(([x, y]) => <circle key={`${x}-${y}`} className="machine-screw" cx={x} cy={y} r="3.2" />)}
    <text x="404" y="467">ATX / X870E / LINUX</text>
  </>;
}

export function ProcessorArt() {
  return <>
    <Box x={466} y={266} width={100} height={100} radius={4} depth={5} />
    <rect className="machine-detail" x="472" y="272" width="88" height="88" rx="3" />
    <path className="machine-detail" d="M480 272A6 6 0 0 0 492 272M540 272A6 6 0 0 0 552 272M480 360A6 6 0 0 1 492 360M540 360A6 6 0 0 1 552 360" />
    <path className="machine-lever" d="M567 280H574V355Q574 362 567 362H561" />
    <circle className="machine-screw" cx="574" cy="277" r="3" />
    <Solid points={[[484, 284], [548, 284], [548, 348], [484, 348]]} depth={3} />
    <path className="machine-ihs" d="M490 284H542Q548 284 548 290V298H544V310H548V322H544V334H548V342Q548 348 542 348H490Q484 348 484 342V334H488V322H484V310H488V298H484V290Q484 284 490 284Z" />
    <path className="machine-detail" d="M498 314H534M504 321H528" />
    <path className="machine-detail" d="M489 343H495L489 337Z" />
    {[[478, 278], [554, 278], [478, 354], [554, 354]].map(([x, y]) => <circle key={`${x}-${y}`} className="machine-screw" cx={x} cy={y} r="2.2" />)}
    <text x="516" y="314" textAnchor="middle">RYZEN 9</text>
    <text x="516" y="328" textAnchor="middle">9950X</text>
  </>;
}

export function MemoryArt() {
  return <>
    {[588, 608, 628, 648].map((x) => (
      <g key={x}>
        <rect className="machine-slot" x={x - 2} y="262" width="17" height="122" rx="2" />
        <rect className="machine-latch" x={x + 3} y="257" width="7" height="6" rx="1" />
        <Solid points={[[x + 3, 268], [x + 13, 268], [x + 13, 378], [x, 378], [x, 271]]} depth={4} />
        <path className="machine-component-fill" d={`M${x} 271L${x + 3} 268H${x + 13}V378H${x}Z`} />
        <rect className="machine-lightbar" x={x + 3} y="272" width="7" height="13" rx="1.5" />
        <path className="machine-detail" d={`M${x + 3} 292H${x + 10}M${x + 3} 297H${x + 10}M${x + 6.5} 304V372`} />
      </g>
    ))}
    <text x="626" y="402" textAnchor="middle">4 x DDR5 / 59 GiB</text>
  </>;
}

export function NetworkArt() {
  return <>
    <Solid points={[[380, 300], [462, 300], [468, 306], [468, 342], [380, 342]]} depth={4} />
    <path className="machine-component-fill" d="M380 300H462L468 306V342H380Z" />
    <rect className="machine-fingers" x="404" y="342" width="52" height="7" rx="1" />
    <path className="machine-detail" d={lines(12, (index) => `M${408 + index * 4} 343.5V347.5`)} />
    <path className="machine-bracket" d="M372 295H382V351H372Z" />
    <circle className="machine-screw" cx="377" cy="299" r="1.8" />
    {[305, 323].map((y) => (
      <g key={y}>
        <rect className="machine-port" x="384" y={y} width="20" height="15" rx="1.5" />
        <path className="machine-detail" d={`M388 ${y + 4}H400V${y + 10}H397V${y + 12}H391V${y + 10}H388Z`} />
        <circle className="machine-status" cx="401" cy={y + 2.6} r="1.1" />
      </g>
    ))}
    <Box x={418} y={308} width={28} height={22} radius={2} depth={3} className="machine-heatsink" />
    <path className="machine-fin" d={lines(5, (index) => `M${422 + index * 5} 311V327`)} />
    <path className="machine-detail" d="M452 312H460M452 318H460M452 324H457M452 332H460" />
    <text x="426" y="362" textAnchor="middle">2.5 GbE / I226-V</text>
  </>;
}

const gpuShroud: Point[] = [[404, 364], [662, 364], [680, 380], [680, 436], [664, 452], [404, 452], [398, 446], [398, 370]];

export function GraphicsArt() {
  return <>
    <Solid points={gpuShroud} depth={8} />
    <path className="machine-component-fill" d={pathFrom(gpuShroud)} />
    <path className="machine-shroud-trim" d="M410 372H656L671 385V431L658 444H410Z" />
    <rect className="machine-heatsink" x="510" y="378" width="40" height="60" rx="2" />
    <path className="machine-fin" d={lines(9, (index) => `M${514 + index * 4} 382V434`)} />
    <FanGraphic x={472} y={408} r={31} blades={9} className="machine-gpu-fan" />
    <FanGraphic x={588} y={408} r={31} blades={9} reverse className="machine-gpu-fan" />
    <path className="machine-shroud-trim" d="M627 372L641 386V430L627 444M652 377L667 389V428L655 440" />
    <rect className="machine-lightbar" x="640" y="396" width="14" height="24" rx="2" />
    <rect className="machine-chip" x="600" y="356" width="30" height="9" rx="1.5" />
    <path className="machine-detail" d={lines(6, (index) => `M${604 + index * 4.4} 358.5V362.5`)} />
    <Box x={682} y={376} width={16} height={66} radius={1.5} depth={3} className="machine-bracket" />
    {[383, 397, 411, 425].map((y) => <rect key={y} className="machine-port" x="686" y={y} width="8" height="10" rx="1" />)}
    <text x="534" y="474" textAnchor="middle">RTX 4090 / LOCAL AI</text>
  </>;
}

export function StorageArt() {
  return <>
    <rect className="machine-pcb-tail" x="546" y="229" width="12" height="26" rx="1.5" />
    <path className="machine-detail" d="M549 233V251M552 233V251" />
    <Box x={556} y={222} width={120} height={40} radius={3} depth={5} />
    <path className="machine-fin" d={lines(18, (index) => `M${563 + index * 6} 226V258`)} />
    <rect className="machine-label-plate" x="592" y="233" width="48" height="18" rx="2" />
    <path className="machine-detail" d="M598 242H606M626 242H634" />
    <Screw x={683} y={242} r={4} />
    <text x="616" y="245" textAnchor="middle">NVMe</text>
    <text x="616" y="292" textAnchor="middle">5.4 TB NVMe ARRAY</text>
  </>;
}

export function FanTrayArt() {
  return <>
    <path className="machine-fan-deck-side" d="M380 508L400 526H658L678 504V516L660 538H399L380 520Z" />
    <path className="machine-component-fill machine-fan-deck" d="M394 484H652L678 504L658 526H400L380 508Z" />
    <path className="machine-detail" d="M398 490H648" />
    <FanGraphic x={440} y={505} r={27} blades={9} skew framed />
    <FanGraphic x={529} y={505} r={27} blades={9} reverse skew framed />
    <FanGraphic x={618} y={505} r={27} blades={9} skew framed />
    <path className="machine-airflow" d="M434 479L440 474L446 479M523 479L529 474L535 479M612 479L618 474L624 479" />
    <text x="528" y="558" textAnchor="middle">AIRFLOW / 119 CONTAINERS</text>
  </>;
}
