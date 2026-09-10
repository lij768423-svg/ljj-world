# Service illustrations

The 25 service details use generated isometric technical line drawings in
`public/assets/service-art/`, mounted by `src/components/ServerServiceArt.tsx`.
Category overview hardware illustrations are unchanged.

Shared art direction matches the existing server-part drawings: 30-degree
isometric product views, white filled surfaces, fine black outlines, hatched
side faces, transparent backgrounds, no text in the raster. Theme inversion
uses the same filter as the category hardware images. Desktop details and
mobile detail cards share the same artwork.

Each service has a distinct physical object keyed by its service ID. Unknown
IDs render an empty frame rather than an unrelated category hardware image.

Official project marks are kept locally for provenance but are not shown on
the service drawings. See `ASSET_LICENSE.md` for the portfolio's asset policy.

The rasters are local, content-fingerprinted files. A title identifies each
drawing for assistive technology.

Verification: `tests/server-service-art.spec.ts` covers all 25 services in
light and dark themes on desktop and mobile, local mark responses, raster
hrefs, and keyboard/animated entry and return.
