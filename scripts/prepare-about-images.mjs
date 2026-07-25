import { chromium } from "@playwright/test";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const assetsDir = path.join(root, "public/assets");
const names = [
  "about-cafe-tech",
  "about-pc-build",
  "about-outfit",
  "about-desk-audio",
  "about-desk-warm",
  "about-desk-night",
];
const targetMaxDimension = 480;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 16, height: 16 } });

try {
  for (const name of names) {
    const sourcePath = path.join(assetsDir, `${name}.webp`);
    const outputPath = path.join(assetsDir, `${name}-${targetMaxDimension}.webp`);
    const source = await readFile(sourcePath);
    const encoded = source.toString("base64");
    const output = await page.evaluate(async ({ encodedImage, maxDimension }) => {
      const image = new Image();
      image.src = `data:image/webp;base64,${encodedImage}`;
      await image.decode();

      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Could not create a 2D image context.");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      return {
        base64: canvas.toDataURL("image/webp", 0.78).split(",")[1],
        width: canvas.width,
        height: canvas.height,
      };
    }, { encodedImage: encoded, maxDimension: targetMaxDimension });

    await writeFile(outputPath, Buffer.from(output.base64, "base64"));
    const outputStats = await stat(outputPath);
    console.log(`${path.basename(outputPath)} ${output.width}x${output.height} ${Math.round(outputStats.size / 1024)} KiB`);
  }
} finally {
  await page.close();
  await browser.close();
}
