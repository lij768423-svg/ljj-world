import { useId } from "react";
import { serviceArtImages } from "../assets/serviceArt";
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
  return (
    <svg
      className={`service-art ${className}`}
      data-service-art={serviceId}
      role="img"
      aria-labelledby={`${identifier}-title`}
      viewBox="0 0 1024 1024"
    >
      <title id={`${identifier}-title`}>{name}</title>
      <g className="service-art-objects" aria-hidden="true">
        {artwork ? (
          <image
            className="service-art-raster"
            href={artwork}
            width="1024"
            height="1024"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <rect className="service-art-missing" x="180" y="180" width="664" height="664" rx="8" />
        )}
      </g>
    </svg>
  );
}
