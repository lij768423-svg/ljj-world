import { useLayoutEffect, useRef, useState } from "react";
import type { ThemeMode } from "../App";

// One picture per theme: the light one is the full painting, the dark one is the same painting cut out of its paper.
// A theme's picture is only requested once that theme is used, and it only takes over once it has decoded. The cut-out
// lies above the painting and matches it pixel for pixel, so during a switch the figure stays put and only the paper
// behind it fades (see .about-console-portrait in styles.css).

const sources: Record<ThemeMode, string> = {
  light: "/assets/about-avatar-three-quarter",
  dark: "/assets/about-avatar-three-quarter-dark",
};

const order: ThemeMode[] = ["light", "dark"];

export function AboutPortrait({ theme, onReady }: { theme: ThemeMode; onReady: () => void }) {
  const [requested, setRequested] = useState<ThemeMode[]>([theme]);
  const [decoded, setDecoded] = useState<ThemeMode[]>([]);
  const [shown, setShown] = useState<ThemeMode>(theme);
  const mounted = useRef(true);

  if (!requested.includes(theme)) setRequested([...requested, theme]);

  useLayoutEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useLayoutEffect(() => {
    if (decoded.includes(theme)) setShown(theme);
  }, [decoded, theme]);

  const markDecoded = (mode: ThemeMode, image: HTMLImageElement) => {
    void image.decode().catch(() => undefined).then(() => {
      if (!mounted.current) return;
      setDecoded((current) => current.includes(mode) ? current : [...current, mode]);
      onReady();
    });
  };

  return (
    <figure className="about-console-portrait" data-portrait={shown}>
      {order.filter((mode) => requested.includes(mode)).map((mode) => (
        <img
          key={mode}
          className={`is-${mode}`}
          src={`${sources[mode]}.webp`}
          srcSet={`${sources[mode]}-768.webp 768w, ${sources[mode]}.webp 1024w`}
          sizes="(max-width: 1360px) 34vw, 500px"
          alt="ljj 三分之四侧面的虚拟开发者形象"
          aria-hidden={mode === shown ? undefined : true}
          width={1024}
          height={1024}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onLoad={(event) => markDecoded(mode, event.currentTarget)}
        />
      ))}
    </figure>
  );
}
