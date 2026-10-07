/**
 * Motion layered over the raster focus drawings on /systems.
 *
 * Fans spin the drawing itself: the fan well (an ellipse in the drawing's projection) is mapped
 * back to a circle, rotated, and projected again, so the original hatched blades turn instead of
 * a redrawn stand-in. Only the blade ring rotates; the hub sits higher than the blades and
 * projects off-centre, so it stays as drawn. Geometry is in the drawings' 1024 px pixel space
 * and was fitted to each image (hub ellipses from image moments, wells checked by overlay).
 */
import { useId } from "react";

/** An ellipse in image pixels: centre, semi-major axis, minor/major ratio, rotation in degrees. */
type Ellipse = readonly [cx: number, cy: number, a: number, ratio: number, angle: number];

type Fan = { well: Ellipse; hub: Ellipse; period: number };

const IMAGE_SIZE = 1024;

const overlays: Partial<Record<string, { fans: readonly Fan[] }>> = {
  agent: {
    fans: [
      { well: [383, 502, 156, 0.779, -2.3], hub: [380.9, 498.1, 53, 0.779, -2.3], period: 2.6 },
      { well: [697, 320, 156, 0.75, -1.6], hub: [694.1, 316.5, 53, 0.75, -1.6], period: 2.3 },
    ],
  },
  containers: {
    fans: [
      { well: [250, 551, 129, 0.9, 15], hub: [251.5, 545.5, 52, 0.899, 13], period: 3.2 },
      { well: [516, 478, 126, 0.9, 18], hub: [519.6, 464.3, 51, 0.868, 20.8], period: 3.2 },
      { well: [780, 402, 126, 0.9, 18], hub: [778.5, 386, 51, 0.837, 19.2], period: 3.2 },
    ],
  },
};

function ellipsePath([cx, cy, a, ratio, angle]: Ellipse) {
  const b = a * ratio;
  const theta = (angle * Math.PI) / 180;
  const dx = a * Math.cos(theta);
  const dy = a * Math.sin(theta);
  const start = `${(cx + dx).toFixed(2)} ${(cy + dy).toFixed(2)}`;
  const end = `${(cx - dx).toFixed(2)} ${(cy - dy).toFixed(2)}`;
  return `M${start}A${a} ${b.toFixed(2)} ${angle} 1 0 ${end}A${a} ${b.toFixed(2)} ${angle} 1 0 ${start}Z`;
}

function SpinningFan({ fan, src, clipId }: { fan: Fan; src: string; clipId: string }) {
  const [cx, cy, , ratio, angle] = fan.well;
  return (
    <>
      <clipPath id={clipId}>
        <path clipRule="evenodd" d={`${ellipsePath(fan.well)}${ellipsePath(fan.hub)}`} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        {/* Blade gaps can be transparent: hide the static blades underneath. */}
        <rect className="server-story-focus-overlay-cover" width={IMAGE_SIZE} height={IMAGE_SIZE} />
        <g transform={`translate(${cx} ${cy}) rotate(${angle}) scale(1 ${ratio})`}>
          <g>
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur={`${fan.period}s`} repeatCount="indefinite" />
            <g transform={`scale(1 ${1 / ratio}) rotate(${-angle}) translate(${-cx} ${-cy})`}>
              <image href={src} width={IMAGE_SIZE} height={IMAGE_SIZE} />
            </g>
          </g>
        </g>
      </g>
    </>
  );
}

/** Animated layer for a module's raster drawing; render only when motion is allowed. */
export function FocusOverlay({ categoryId, src }: { categoryId: string; src: string }) {
  const id = useId().replace(/[^\w-]/g, "");
  const overlay = overlays[categoryId];
  if (!overlay) return null;
  return (
    <svg className="server-story-focus-overlay" viewBox={`0 0 ${IMAGE_SIZE} ${IMAGE_SIZE}`} aria-hidden="true">
      {overlay.fans.map((fan, index) => <SpinningFan key={index} fan={fan} src={src} clipId={`${id}-fan-${index}`} />)}
    </svg>
  );
}
