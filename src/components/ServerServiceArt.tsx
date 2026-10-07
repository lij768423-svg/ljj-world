import { useEffect, useId, useState } from "react";
import { serviceArtImages } from "../assets/serviceArt";
import { loadServiceImage } from "../lib/serviceImageLoader";
import "./ServerServiceArt.css";

export function ServerServiceArt({
  serviceId,
  name,
  className = "",
}: {
  serviceId: string;
  name: string;
  className?: string;
}) {
  const identifier = useId().replace(/:/g, "");
  const artwork = serviceArtImages[serviceId];
  const [result, setResult] = useState<{ source: string; state: "ready" | "error" } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const state = !artwork ? "error" : result?.source === artwork ? result.state : "loading";
  useEffect(() => {
    if (!artwork) return;
    let active = true;
    loadServiceImage(artwork).then(
      () => { if (active) setResult({ source: artwork, state: "ready" }); },
      () => { if (active) setResult({ source: artwork, state: "error" }); },
    );
    return () => { active = false; };
  }, [artwork, attempt]);
  const retry = () => {
    setResult(null);
    setAttempt(value => value + 1);
  };
  return (
    <svg
      className={`service-art ${className}`}
      data-service-art={serviceId}
      data-image-state={state}
      aria-busy={state === "loading"}
      role={state === "error" ? "group" : "img"}
      aria-labelledby={`${identifier}-title`}
      viewBox="0 0 1024 1024"
    >
      <title id={`${identifier}-title`}>{name}{state === "loading" ? " · 图片加载中" : state === "error" ? " · 图片加载失败" : ""}</title>
      <g className="service-art-objects" aria-hidden="true">
        {state === "ready" ? (
          <image
            className="service-art-raster"
            href={artwork}
            width="1024"
            height="1024"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <g className="service-art-placeholder">
            <rect className="service-art-missing" x="300" y="340" width="424" height="304" rx="8" />
            <path className="service-art-missing" d="m330 604 105-120 88 80 73-70 96 110M450 686h124" />
            <circle className="service-art-missing" cx="625" cy="415" r="27" />
            <text x="512" y="735" textAnchor="middle">{state === "error" ? "图片暂时无法加载" : "正在加载插图…"}</text>
          </g>
        )}
      </g>
      {state === "error" && artwork ? (
        <g role="button" tabIndex={0} aria-label="重试加载图片" className="service-art-retry" onClick={retry} onKeyDown={event => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); retry(); }
        }}>
          <rect x="412" y="765" width="200" height="64" rx="6" />
          <text x="512" y="807" textAnchor="middle">重试</text>
        </g>
      ) : null}
    </svg>
  );
}
