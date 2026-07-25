import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

type PointerPosition = { x: number; y: number; active: boolean };

/** Canvas dot field inspired by React Bits DotGrid, without GSAP or a second animation runtime. */
export function InteractiveDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !host || !context) return;

    const pointer: PointerPosition = { x: 0, y: 0, active: false };
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let isVisible = true;
    let color = "rgba(21, 22, 19, 0.14)";

    const readColor = () => {
      color = getComputedStyle(canvas).getPropertyValue("--kinetic-dot-color").trim() || color;
    };

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.ceil(width * pixelRatio);
      canvas.height = Math.ceil(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      readColor();
    };

    const draw = (timestamp: number) => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = color;
      const gap = width > 1080 ? 30 : 25;
      const influence = 128;

      for (let row = -1; row <= Math.ceil(height / gap); row += 1) {
        for (let column = -1; column <= Math.ceil(width / gap); column += 1) {
          const baseX = column * gap + (row % 2) * gap * 0.5;
          const baseY = row * gap;
          const deltaX = baseX - pointer.x;
          const deltaY = baseY - pointer.y;
          const distance = Math.hypot(deltaX, deltaY);
          const force = pointer.active ? Math.max(0, 1 - distance / influence) : 0;
          const wave = reduceMotion ? 0 : Math.sin(timestamp * 0.0012 + row * 0.52 + column * 0.31) * 0.65;
          const offsetX = force > 0 ? (deltaX / Math.max(distance, 1)) * force * 13 : 0;
          const offsetY = force > 0 ? (deltaY / Math.max(distance, 1)) * force * 13 : 0;
          const radius = 0.85 + force * 1.55 + wave * 0.12;

          context.globalAlpha = 0.5 + force * 0.5;
          context.beginPath();
          context.arc(baseX + offsetX, baseY + offsetY + wave, radius, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.globalAlpha = 1;

      if (!reduceMotion && isVisible) animationFrame = window.requestAnimationFrame(draw);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const bounds = host.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const resizeObserver = new ResizeObserver(resize);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !reduceMotion) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(draw);
      }
    });
    const themeObserver = new MutationObserver(readColor);

    resizeObserver.observe(host);
    visibilityObserver.observe(host);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    host.addEventListener("pointermove", handlePointerMove, { passive: true });
    host.addEventListener("pointerleave", handlePointerLeave);
    resize();
    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      themeObserver.disconnect();
      host.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerleave", handlePointerLeave);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [reduceMotion]);

  return <canvas ref={canvasRef} className="interactive-dot-grid" aria-hidden="true" />;
}
