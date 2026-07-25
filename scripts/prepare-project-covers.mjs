import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputDir = path.join(root, "output/imagegen/project-covers");
const outputDir = path.join(root, "public/assets/project-covers");

const covers = {
  "408-web": "408-web.png",
  "408-harmony": "408-harmony_001.jpg",
  ioschat: "ioschat.png",
  "law-site": "law-site.png",
  mineradio: "mineradio_001.jpg",
  "agent-console": "agent-console.png",
  "codex-api": "codex-api.png",
  "wiki-api": "wiki-api.png",
  "writing-studio": "writing-studio_001.jpg",
  "hardware-control": "hardware-control.png",
  "tailscale-latency": "tailscale-latency.png",
  "home-lab": "home-lab_001.jpg",
};

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  for (const [id, filename] of Object.entries(covers)) {
    const extension = path.extname(filename).toLowerCase();
    const mime = extension === ".png" ? "image/png" : "image/jpeg";
    const source = await readFile(path.join(inputDir, filename));
    const dataUrl = `data:${mime};base64,${source.toString("base64")}`;

    const encoded = await page.evaluate(async ({ dataUrl: sourceUrl }) => {
      const image = new Image();
      image.src = sourceUrl;
      await image.decode();

      const width = 1200;
      const height = 750;
      const sourceRatio = image.naturalWidth / image.naturalHeight;
      const targetRatio = width / height;
      let sourceWidth = image.naturalWidth;
      let sourceHeight = image.naturalHeight;
      let sourceX = 0;
      let sourceY = 0;

      if (sourceRatio > targetRatio) {
        sourceWidth = image.naturalHeight * targetRatio;
        sourceX = (image.naturalWidth - sourceWidth) / 2;
      } else {
        sourceHeight = image.naturalWidth / targetRatio;
        sourceY = (image.naturalHeight - sourceHeight) / 2;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas 2D context unavailable");
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
      return canvas.toDataURL("image/webp", 0.84).split(",")[1];
    }, { dataUrl });

    await writeFile(path.join(outputDir, `${id}.webp`), Buffer.from(encoded, "base64"));
  }
} finally {
  await browser.close();
}
