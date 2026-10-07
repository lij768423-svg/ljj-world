import { useEffect, useRef, useState } from "react";
import "./InteractivePortrait.css";

const videoSource = "/assets/portrait-loop/portrait-gentle-blink-local-fill-d07eb2b4cbd6.webm";

export function InteractivePortrait({ src, srcSet }: { src: string; srcSet: string }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const image = imageRef.current;
    const figure = image?.closest("figure");
    if (!image || !figure) return;
    const query = window.matchMedia("(min-width: 1081px) and (prefers-reduced-motion: no-preference)");
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean; effectiveType?: string } }).connection;
    let inView = false;
    const update = () => {
      const allowed = query.matches && !connection?.saveData && !["slow-2g", "2g"].includes(connection?.effectiveType ?? "");
      setEligible(allowed && image.complete && image.naturalWidth > 0);
      setVisible(inView && !document.hidden);
      if (!allowed) setReady(false);
    };
    const observer = new IntersectionObserver(entries => { inView = entries[0]?.isIntersecting ?? false; update(); });
    observer.observe(figure);
    image.addEventListener("load", update);
    query.addEventListener("change", update);
    connection?.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      image.removeEventListener("load", update);
      query.removeEventListener("change", update);
      connection?.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (eligible && visible && !failed) {
      let active = true;
      void video.play().catch(() => { if (active) setFailed(true); });
      return () => { active = false; video.pause(); };
    }
    video.pause();
  }, [eligible, visible, failed]);

  const verifyTransparency = () => {
    const video = videoRef.current;
    if (!video || ready || failed) return;
    try {
      const probe = document.createElement("canvas");
      probe.width = probe.height = 2;
      const context = probe.getContext("2d", { willReadFrequently: true });
      if (!context) { setFailed(true); return; }
      context.drawImage(video, 0, 0, 2, 2, 0, 0, 2, 2);
      if (context.getImageData(0, 0, 1, 1).data[3] > 10) { setFailed(true); return; }
      context.clearRect(0, 0, 2, 2);
      context.drawImage(video, video.videoWidth * .65, video.videoHeight * .5, 2, 2, 0, 0, 2, 2);
      if (context.getImageData(0, 0, 1, 1).data[3] < 200) { setFailed(true); return; }
      setReady(true);
    } catch { setFailed(true); }
  };

  const showVideo = eligible && ready && !failed;
  return <>
    <img ref={imageRef} className={`hero-portrait-image${showVideo ? " is-loop-source" : ""}`} src={src} srcSet={srcSet}
      sizes="(max-width: 1100px) 100vw, min(58vw, 920px)" alt="" width={2048} height={1152}
      loading="eager" fetchPriority="high" decoding="async" draggable={false} />
    {eligible && !failed ? <video ref={videoRef} className="hero-portrait-loop" data-loop-ready={ready}
      src={videoSource} muted loop playsInline preload={visible ? "auto" : "none"} aria-hidden="true" tabIndex={-1}
      onPlaying={verifyTransparency} onLoadedData={verifyTransparency} onError={() => setFailed(true)} /> : null}
  </>;
}
