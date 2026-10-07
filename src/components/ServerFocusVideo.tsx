import { useEffect, useRef, useState, type Ref } from "react";

/**
 * A module's focus drawing: the transparent poster is always rendered (it sizes the view, feeds
 * the connector clearance mask and is the fallback), and a looping VP9-with-alpha clip whose first
 * frame equals the poster fades in over it once playback is confirmed to keep its transparency.
 * Browsers that drop the alpha channel (Safari decodes VP9 opaque), reduced motion and Save-Data
 * keep the still poster.
 */
export function ServerFocusVideo({ poster, video, alt, imageRef }: {
  poster: string;
  video: string;
  alt: string;
  imageRef: Ref<HTMLImageElement>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [eligible, setEligible] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean; effectiveType?: string } }).connection;
    const update = () => setEligible(motion.matches && !connection?.saveData && !["slow-2g", "2g"].includes(connection?.effectiveType ?? ""));
    update();
    motion.addEventListener("change", update);
    connection?.addEventListener("change", update);
    return () => {
      motion.removeEventListener("change", update);
      connection?.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    setReady(false);
    setFailed(false);
  }, [video]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !eligible || failed) return;
    let active = true;
    void element.play().catch(() => { if (active) setFailed(true); });
    return () => {
      active = false;
      element.pause();
    };
  }, [eligible, failed, video]);

  const verifyTransparency = () => {
    const element = videoRef.current;
    if (!element || ready || failed || !element.videoWidth) return;
    try {
      const probe = document.createElement("canvas");
      probe.width = probe.height = 2;
      const context = probe.getContext("2d", { willReadFrequently: true });
      if (!context) { setFailed(true); return; }
      context.drawImage(element, 0, 0, 2, 2, 0, 0, 2, 2);
      // The corner lies outside every drawing: it must come through transparent.
      if (context.getImageData(0, 0, 1, 1).data[3] > 10) { setFailed(true); return; }
      setReady(true);
    } catch {
      setFailed(true);
    }
  };

  return <>
    <img ref={imageRef} src={poster} alt={alt} />
    {eligible && !failed ? (
      <video
        key={video}
        ref={videoRef}
        className="server-story-focus-video"
        data-ready={ready}
        src={video}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        onLoadedData={verifyTransparency}
        onPlaying={verifyTransparency}
        onError={() => setFailed(true)}
      />
    ) : null}
  </>;
}
