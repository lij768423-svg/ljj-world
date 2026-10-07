#!/usr/bin/env python3
"""Punch enclosed near-black fills, then emit lossless fingerprint WebP.

AI cutouts left opaque black inside cable loops, chassis holes, and
apertures. On the light systems grid those reads as solid black patches.
This keeps thin dark strokes (cables, ports) and clears compact blobs.
"""
from __future__ import annotations

import hashlib
import json
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BLACK = 28
MIN_AREA = 350
MIN_FILL = 0.18


def luma(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def punch(image: Image.Image) -> tuple[Image.Image, int]:
    image = image.convert("RGBA")
    width, height = image.size
    pixels = image.load()
    visited = bytearray(width * height)
    punched = 0
    for y in range(height):
        for x in range(width):
            index = y * width + x
            if visited[index]:
                continue
            red, green, blue, alpha = pixels[x, y]
            if alpha < 180 or luma(red, green, blue) > BLACK:
                continue
            queue = deque([(x, y)])
            visited[index] = 1
            cells: list[tuple[int, int]] = []
            min_x = max_x = x
            min_y = max_y = y
            while queue:
                cx, cy = queue.popleft()
                cells.append((cx, cy))
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    neighbor = ny * width + nx
                    if visited[neighbor]:
                        continue
                    rr, gg, bb, aa = pixels[nx, ny]
                    if aa >= 180 and luma(rr, gg, bb) <= BLACK:
                        visited[neighbor] = 1
                        queue.append((nx, ny))
            area = len(cells)
            box_w = max_x - min_x + 1
            box_h = max_y - min_y + 1
            fill = area / (box_w * box_h)
            aspect = max(box_w, box_h) / max(1, min(box_w, box_h))
            if not (area >= MIN_AREA and fill >= MIN_FILL and not (aspect > 8 and fill < 0.25)):
                continue
            for cx, cy in cells:
                pixels[cx, cy] = (0, 0, 0, 0)
                punched += 1
            fringe: set[tuple[int, int]] = set()
            for cx, cy in cells:
                for nx, ny in (
                    (cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1),
                    (cx - 1, cy - 1), (cx + 1, cy + 1), (cx - 1, cy + 1), (cx + 1, cy - 1),
                ):
                    if 0 <= nx < width and 0 <= ny < height:
                        rr, gg, bb, aa = pixels[nx, ny]
                        if aa > 0 and luma(rr, gg, bb) <= BLACK + 18:
                            fringe.add((nx, ny))
            for nx, ny in fringe:
                rr, gg, bb, aa = pixels[nx, ny]
                if luma(rr, gg, bb) <= BLACK + 8:
                    pixels[nx, ny] = (0, 0, 0, 0)
                    punched += 1
                else:
                    pixels[nx, ny] = (rr, gg, bb, max(0, aa // 3))
    cleaned = [
        (0, 0, 0, 0) if pixel[3] == 0 else pixel
        for pixel in list(image.getdata())
    ]
    image.putdata(cleaned)
    return image, punched


def write_mapping(path: Path, export_name: str, mapping: dict[str, str]) -> None:
    body = json.dumps(mapping, indent=2)
    path.write_text(f"export const {export_name}: Record<string, string> = {body};\n")


def convert_folder(folder: str, export_name: str, mapping_file: str, punch_blobs: bool) -> list[dict]:
    directory = ROOT / "public" / "assets" / folder
    mapping: dict[str, str] = {}
    report: list[dict] = []
    produced: set[str] = set()
    for png_path in sorted(directory.glob("*.png")):
        identifier = png_path.name.replace(".png", "")
        if "-" in identifier and len(identifier.rsplit("-", 1)[-1]) == 12:
            identifier = identifier.rsplit("-", 1)[0]
        if identifier in mapping:
            raise RuntimeError(f"duplicate identifier {identifier}")
        image = Image.open(png_path)
        punched = 0
        if punch_blobs:
            image, punched = punch(image)
        else:
            image = image.convert("RGBA")
        payload = image.tobytes("raw", "RGBA")
        fingerprint = hashlib.sha256(payload).hexdigest()[:12]
        png_name = f"{identifier}-{fingerprint}.png"
        target_name = f"{identifier}-{fingerprint}.webp"
        next_png = directory / png_name
        image.save(next_png, "PNG", optimize=True)
        if next_png != png_path:
            png_path.unlink()
        target = directory / target_name
        image.save(target, "WEBP", quality=88, method=6, exact=True)
        mapping[identifier] = f"/assets/{folder}/{target_name}"
        produced.add(target_name)
        produced.add(png_name)
        report.append({
            "folder": folder,
            "filename": png_path.name,
            "target": target_name,
            "width": image.width,
            "height": image.height,
            "punched": punched,
            "after": target.stat().st_size,
        })
    for leftover in directory.iterdir():
        if leftover.suffix == ".webp" and leftover.name not in produced:
            leftover.unlink()
    write_mapping(ROOT / "src" / "assets" / mapping_file, export_name, mapping)
    return report


def main() -> None:
    report = []
    report.extend(convert_folder("service-art", "serviceArtImages", "serviceArt.ts", punch_blobs=True))
    report.extend(convert_folder("server-parts", "serverPartImages", "serverParts.ts", punch_blobs=False))
    output = ROOT / "tmp" / "server-image-optimization"
    output.mkdir(parents=True, exist_ok=True)
    (output / "conversion.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({
        "count": len(report),
        "punched": sum(item["punched"] for item in report),
        "after": sum(item["after"] for item in report),
    }))


if __name__ == "__main__":
    main()
