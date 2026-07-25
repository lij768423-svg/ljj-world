import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

type Spark = {
  x: number;
  y: number;
  angle: number;
  bornAt: number;
};

const SPARK_COUNT = 10;
const SPARK_DURATION = 520;

/**
 * Adapted for an event-driven global canvas from React Bits ClickSpark.
 * Copyright (c) 2026 David Haz, MIT + Commons Clause License Condition v1.0.
 */
export function ClickSpark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduceMotion) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const sparks: Spark[] = [];
    let animationFrame: number | null = null;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      canvas.width = Math.ceil(viewportWidth * pixelRatio);
      canvas.height = Math.ceil(viewportHeight * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = (timestamp: number) => {
      context.clearRect(0, 0, viewportWidth, viewportHeight);
      const color = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#1d39f5";

      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];
        const progress = Math.min((timestamp - spark.bornAt) / SPARK_DURATION, 1);
        if (progress >= 1) {
          sparks.splice(index, 1);
          continue;
        }

        const eased = 1 - (1 - progress) ** 3;
        const distance = 12 + eased * 38;
        const lineLength = 14 * (1 - eased);
        const x = spark.x + Math.cos(spark.angle) * distance;
        const y = spark.y + Math.sin(spark.angle) * distance;

        context.globalAlpha = 1 - progress;
        context.strokeStyle = color;
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + Math.cos(spark.angle) * lineLength, y + Math.sin(spark.angle) * lineLength);
        context.stroke();
      }

      context.globalAlpha = 1;
      if (sparks.length > 0) {
        animationFrame = window.requestAnimationFrame(draw);
      } else {
        animationFrame = null;
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button > 0) return;
      const bornAt = performance.now();
      for (let index = 0; index < SPARK_COUNT; index += 1) {
        sparks.push({
          x: event.clientX,
          y: event.clientY,
          angle: (Math.PI * 2 * index) / SPARK_COUNT + (index % 2) * 0.08,
          bornAt,
        });
      }
      if (animationFrame === null) animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", handlePointerDown);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;
  return <canvas ref={canvasRef} className="click-spark-canvas" aria-hidden="true" />;
}
