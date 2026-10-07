import { useId } from "react";

export function MachineArtDefinitions() {
  return <defs>
    <linearGradient id="assembly-alloy" x1="0" y1="0" x2="1" y2="1">
      <stop className="assembly-stop-light" offset="0" /><stop className="assembly-stop-mid" offset=".45" /><stop className="assembly-stop-shade" offset="1" />
    </linearGradient>
    <linearGradient id="assembly-carbon" x1="0" y1="0" x2="0" y2="1">
      <stop stopColor="#424844" offset="0" /><stop stopColor="#202623" offset="1" />
    </linearGradient>
    <pattern id="assembly-mesh" width="7" height="7" patternUnits="userSpaceOnUse">
      <path className="assembly-mesh-hole" d="M2 1H4L5 3L4 5H2L1 3Z" />
    </pattern>
  </defs>;
}

function Screw({ x, y }: { x: number; y: number }) {
  return <g className="assembly-fastener" transform={`translate(${x} ${y})`}><circle r="3" /><path d="M-1.3-1.3L1.3 1.3M-1.3 1.3L1.3-1.3" /></g>;
}

function Rotor({ x, y, radius = 32 }: { x: number; y: number; radius?: number }) {
  const identifier = useId();
  return <g transform={`translate(${x} ${y})`}>
    <circle className="assembly-fan-rim" r={radius + 4} />
    <circle className="assembly-fan-well" r={radius} />
    <g transform={`scale(${radius / 32})`}>
      <g className="assembly-rotor">
        {Array.from({ length: 9 }, (_, index) => <path key={`${identifier}-${index}`} className="assembly-blade" transform={`rotate(${index * 40})`} d="M-5-8C-20-10-27-20-17-26C-6-32 6-29 14-25C0-25-6-19-2-10Z" />)}
        <circle className="assembly-hub" r="9" /><circle className="assembly-hub-ring" r="6" />
      </g>
    </g>
    <path className="assembly-fan-highlight" d={`M${-radius * .72} ${-radius * .72}A${radius} ${radius} 0 0 1 ${radius * .72} ${-radius * .72}`} />
  </g>;
}

export function AssemblyBackdrop() {
  return <g className="assembly-backdrop" aria-hidden="true" pointerEvents="none">
    <ellipse className="assembly-ground" cx="497" cy="574" rx="250" ry="14" />
    <path className="assembly-measure" d="M260 112H716M260 107V117M716 107V117M772 159V539M767 159H777M767 539H777" />
    <text className="assembly-caption" x="260" y="98">HOME-SERVE / COMPONENT ATLAS</text>
    <text className="assembly-caption" x="717" y="98" textAnchor="end">01 — ASSEMBLY</text>
    <path className="assembly-register" d="M207 186V162H231M745 565H769V541M207 545V565H227" />
  </g>;
}

export function ChassisArtwork() {
  return <g className="assembly-art assembly-chassis" aria-hidden="true" pointerEvents="none">
    <path className="assembly-foot" d="M283 536H317V565H277V551ZM646 532H679V562H639V550Z" />
    <path className="assembly-side" d="M253 145L319 169V547L253 520Z" />
    <path className="assembly-metal" d="M253 145H664L726 169H319Z" />
    <path className="assembly-frame" d="M319 169H726V547H319Z M332 183V533H712V183Z" fillRule="evenodd" />
    <path className="assembly-edge" d="M259 153H661L711 171M259 158V514L312 536M327 174H719" />
    <path className="assembly-rear" d="M271 211L307 224V428L271 415Z" />
    <path className="assembly-perforated" d="M275 215L303 225V419L275 409Z" />
    <g transform="translate(288 270) skewY(20) scale(.48 .8)"><Rotor x={0} y={0} radius={27} /></g>
    <g transform="translate(288 337) skewY(20) scale(.48 .8)"><Rotor x={0} y={0} radius={27} /></g>
    <path className="assembly-dark" d="M269 438L307 451V515L269 501Z" />
    <path className="assembly-port" d="M278 465L297 472V488L278 481Z" />
    <path className="assembly-fine" d="M276 447L300 456M276 453L300 462M276 496L300 505" />
    <path className="assembly-port" d="M271 178L287 184V192L271 186ZM290 185L302 189V197L290 193Z" />
    <circle className="assembly-status" cx="308" cy="187" r="2.1" />
    <path className="assembly-lip" d="M340 191H702V524H340Z" />
    <path className="assembly-cable" d="M686 278C703 279 704 295 704 320V451Q704 476 680 476H647" />
    <path className="assembly-cable-secondary" d="M694 269C716 272 717 299 717 322V465Q717 489 675 489" />
    <path className="assembly-fine" d="M354 179H622M344 539H681" />
    {[[326,177],[719,177],[326,539],[719,539],[261,157],[261,513]].map(([x,y]) => <Screw key={`${x}-${y}`} x={x} y={y} />)}
    <text className="assembly-caption" x="350" y="560">MODULAR / SELF-HOSTED / ALWAYS ON</text>
  </g>;
}

export function MainboardArtwork() {
  return <g className="assembly-art" aria-hidden="true" pointerEvents="none">
    <path className="assembly-board" d="M350 204H658L687 232V464H350Z" />
    <path className="assembly-board-edge" d="M356 209H655L681 236V458H356Z" />
    <path className="assembly-traces" d="M361 231H433L459 257V285M362 239H429L451 261V285M362 247H423L443 267V285M369 379H455L475 359M370 385H460L481 364M370 391H465L487 369M572 289H581V233H611M572 299H576V223H649M557 351V434H635L656 413M550 351V442H639L665 416M543 351V450H643L674 419" />
    <path className="assembly-copper" d="M366 426H404L420 442H491M593 421H638V396H677" />
    <rect className="assembly-socket" x="452" y="263" width="126" height="113" rx="6" />
    <rect className="assembly-socket-inner" x="464" y="275" width="102" height="88" rx="3" />
    {[0,1,2,3,4,5].map(index => <g key={index} transform={`translate(${366+index*13} 218)`}><rect className="assembly-dark" width="10" height="20" rx="1" /><path className="assembly-fin" d="M3 2V18M6 2V18" /></g>)}
    <rect className="assembly-metal" x="365" y="251" width="57" height="29" rx="2" />
    {[0,1,2,3,4].map(index => <path key={index} className="assembly-fine" d={`M370 ${256+index*4}H416`} />)}
    <rect className="assembly-slot" x="367" y="389" width="284" height="9" rx="1" />
    <rect className="assembly-slot" x="367" y="406" width="197" height="7" rx="1" />
    <circle className="assembly-metal" cx="457" cy="432" r="14" /><path className="assembly-fine" d="M451 432H463M457 426V438" />
    {[[363,215],[669,240],[363,452],[672,452]].map(([x,y]) => <Screw key={`${x}-${y}`} x={x} y={y} />)}
    {[0,1,2,3,4].map(index => <g key={index}><circle className="assembly-capacitor" cx={475+index*13} cy="420" r="4" /><path className="assembly-fine" d={`M${472+index*13} 420H${478+index*13}`} /></g>)}
    <text className="assembly-board-caption" x="584" y="454">X870E / ATX</text>
  </g>;
}

export function ProcessorArtwork() {
  return <g className="assembly-art" aria-hidden="true" pointerEvents="none">
    <path className="assembly-component machine-component-fill" d="M467 270H554L568 282V364H480L467 352Z" />
    <path className="assembly-chip-side" d="M480 352H568V364H480L467 352V339Z" />
    <path className="assembly-metal" d="M482 280H548L557 288V345H482Z" />
    <path className="assembly-edge" d="M487 284H547L553 290M487 287V339" />
    <text className="assembly-brand" x="519" y="309" textAnchor="middle">RYZEN</text>
    <text className="assembly-part-caption" x="519" y="323" textAnchor="middle">9950X</text>
    <path className="assembly-copper" d="M475 345V351H481" />
    <path className="assembly-latch" d="M573 277V351Q573 359 578 359H583V347" />
    {Array.from({length:10},(_,index) => <path key={index} className="assembly-pin" d={`M${484+index*7} 355V361`} />)}
  </g>;
}

export function MemoryArtwork() {
  return <g className="assembly-art" aria-hidden="true" pointerEvents="none">
    {[586,608,630,652].map((position,index) => <g key={position}>
      <path className="assembly-chip-side" d={`M${position} 271L${position+5} 266H${position+18}V375L${position+13} 381H${position}Z`} />
      <rect className="assembly-dark" x={position} y="273" width="13" height="104" rx="1" />
      <path className="assembly-memory-strip" d={`M${position+2} 275V373`} />
      {[0,1,2,3,4].map(chip => <rect key={chip} className="assembly-memory-chip" x={position+5} y={282+chip*17} width="6" height="12" rx=".7" />)}
      <path className="assembly-fin" d={`M${position+5} 269H${position+15}M${position+1} 379H${position+11}`} />
      <text className="assembly-memory-caption" x={position+7} y="393" textAnchor="middle">{index+1}</text>
    </g>)}
  </g>;
}

export function NetworkArtwork() {
  return <g className="assembly-art" aria-hidden="true" pointerEvents="none">
    <path className="assembly-component machine-component-fill" d="M375 298H456L473 309V347H375Z" />
    <path className="assembly-chip-side" d="M375 347H473V353H375Z" />
    <rect className="assembly-dark" x="383" y="307" width="32" height="30" rx="2" />
    {[0,1,2,3,4].map(index => <path key={index} className="assembly-fin" d={`M${387+index*5} 310V334`} />)}
    {[426,448].map(position => <g key={position}><path className="assembly-metal" d={`M${position} 310H${position+17}V336H${position}Z`} /><rect className="assembly-port" x={position+3} y="319" width="11" height="12" /><circle className="assembly-status" cx={position+4} cy="314" r="1.2" /></g>)}
    {Array.from({length:12},(_,index) => <path key={index} className="assembly-pin" d={`M${383+index*6} 348V352`} />)}
    <path className="assembly-flow" d="M373 327H345L330 342H315" />
  </g>;
}

export function GraphicsArtwork() {
  return <g className="assembly-art" aria-hidden="true" pointerEvents="none">
    <path className="assembly-metal" d="M399 370L421 359H669L688 376L670 386H414Z" />
    <path className="assembly-dark machine-component-fill" d="M398 372H662L680 387V438L665 452H414L398 439Z" />
    <path className="assembly-gpu-side" d="M414 452H665L685 436V446L667 462H414Z" />
    <path className="assembly-gpu-edge" d="M404 379H660L672 390V434L663 444H417L405 435Z" />
    <Rotor x={458} y={412} radius={33} /><Rotor x={552} y={412} radius={33} />
    <path className="assembly-fin" d="M498 384V440M503 381V443M508 381V443M513 384V440" />
    {[0,1,2,3,4,5,6,7].map(index => <path key={index} className="assembly-fin" d={`M608 ${384+index*7}H655`} />)}
    <path className="assembly-copper" d="M435 459H594" />
    {Array.from({length:20},(_,index) => <path key={index} className="assembly-pin" d={`M${438+index*7.5} 455V460`} />)}
    <text className="assembly-gpu-caption" x="633" y="417" textAnchor="middle">RTX</text>
    <path className="assembly-metal" d="M685 382H697V435H685Z" /><path className="assembly-port" d="M688 391H694V403H688ZM688 413H694V425H688Z" />
    {[[412,384],[661,435]].map(([x,y]) => <Screw key={`${x}-${y}`} x={x} y={y} />)}
  </g>;
}

export function StorageArtwork() {
  return <g className="assembly-art" aria-hidden="true" pointerEvents="none">
    <path className="assembly-component machine-component-fill" d="M551 217H676L692 229V253L681 263H551Z" />
    <path className="assembly-chip-side" d="M551 263H681L692 253V260L681 270H551Z" />
    <rect className="assembly-dark" x="564" y="224" width="99" height="32" rx="2" />
    {Array.from({length:15},(_,index) => <path key={index} className="assembly-fin" d={`M${568+index*6.3} 227V253`} />)}
    <rect className="assembly-metal" x="593" y="233" width="42" height="15" rx="1" />
    <text className="assembly-part-caption" x="614" y="244" textAnchor="middle">NVMe</text>
    <Screw x={681} y={241} />
    {[0,1,2,3,4,5].map(index => <path key={index} className="assembly-pin" d={`M551 ${225+index*5}H557`} />)}
  </g>;
}

export function CoolingArtwork() {
  return <g className="assembly-art" aria-hidden="true" pointerEvents="none">
    <path className="assembly-chip-side" d="M381 501L407 522H674V533H405L381 513Z" />
    <path className="assembly-metal machine-component-fill machine-fan-deck" d="M399 476H650L674 501V522H407L381 501Z" />
    {[436,526,616].map(position => <g key={position} transform={`translate(${position} 499) matrix(1 0 .35 .5 0 0)`}>
      <rect className="assembly-fan-frame" x="-37" y="-37" width="74" height="74" rx="5" />
      <Rotor x={0} y={0} radius={29} />
      <Screw x={-31} y={-31} /><Screw x={31} y={31} />
    </g>)}
    <path className="assembly-edge" d="M410 527H665" />
    <path className="assembly-airflow" d="M436 472V455M526 472V455M616 472V455" />
  </g>;
}
