import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const directory = path.join(root, "public/assets/project-covers");
const covers = {};
const browser = await chromium.launch({ args: ["--no-sandbox"] });

try {
  const page = await browser.newPage();
  for (const name of ["grok-register-panel", "grok2api-egress-enhancements"]) {
    const source = await readFile(path.join(directory, `${name}.png`));
    const variants = [];
    for (const width of [480, 960, 1600]) {
      const encoded = await page.evaluate(async ({ data, targetWidth }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(targetWidth, image.naturalWidth);
        canvas.height = Math.round(canvas.width * image.naturalHeight / image.naturalWidth);
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Canvas 2D unavailable");
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return { width: canvas.width, height: canvas.height, data: canvas.toDataURL("image/webp", 0.84).split(",")[1] };
      }, { data: source.toString("base64"), targetWidth: width });
      const bytes = Buffer.from(encoded.data, "base64");
      const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
      const filename = `${name}-${encoded.width}-${hash}.webp`;
      await writeFile(path.join(directory, filename), bytes);
      variants.push({ image: `/assets/project-covers/${filename}`, width: encoded.width, height: encoded.height });
      console.log(`${filename}: ${bytes.length} bytes`);
    }
    const largest = variants.at(-1);
    covers[name] = { ...largest, srcSet: variants.map(variant => `${variant.image} ${variant.width}w`).join(", ") };
  }
  await mkdir(path.join(root, "src/assets"), { recursive: true });
  await writeFile(path.join(root, "src/assets/optimizedCovers.ts"), `export const optimizedCovers = ${JSON.stringify(covers, null, 2)} as const;\n`);
} finally {
  await browser.close();
}
