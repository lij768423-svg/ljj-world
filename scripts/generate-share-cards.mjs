// Draws the link-preview image (og:image / twitter:image) for every blog post in both
// languages: 1200x630 JPEGs under public/assets/share/<slug>-<language>.jpg, committed with the
// post. `npm run build` fails when a post has no card, so run this after adding or retitling one:
//
//   npm run share-cards                 # every post
//   npm run share-cards -- <slug> ...   # only these posts
//
// It renders an HTML template in headless Chromium (Playwright's bundled browser, or the
// installed Google Chrome when that is missing) using the site's own fonts. Chinese falls back
// to the system CJK font, so cards drawn on another machine can differ slightly.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { runnerImport } from "vite";

const root = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(root, "public");
const only = new Set(process.argv.slice(2));

const stubStylesheets = {
  name: "share-cards:stub-stylesheets",
  enforce: "pre",
  resolveId(id) {
    return /\.(css|scss|sass|less)(\?.*)?$/.test(id) ? "\0share-cards-stylesheet-stub" : null;
  },
  load(id) {
    return id === "\0share-cards-stylesheet-stub" ? "export default {};" : null;
  },
};

const { module: seo } = await runnerImport("/src/seo/routes.ts", {
  root,
  configFile: path.join(root, "vite.config.ts"),
  plugins: [stubStylesheets],
  logLevel: "warn",
});
const { module: lineBreaks } = await runnerImport("/src/lib/lineBreaks.ts", { root, configFile: false, logLevel: "warn" });
const { width, height } = seo.shareCardSize;
const cards = seo.getShareCards().filter((card) => !only.size || only.has(card.slug));
if (only.size && !cards.length) throw new Error(`No posts match: ${[...only].join(", ")}`);

const fontFile = (pkg, file) => path.join(root, "node_modules", "@fontsource-variable", pkg, "files", file);
const dataUrl = async (file, type) => `data:${type};base64,${(await readFile(file)).toString("base64")}`;
const fonts = {
  display: await dataUrl(fontFile("manrope", "manrope-latin-wght-normal.woff2"), "font/woff2"),
  body: await dataUrl(fontFile("geist", "geist-latin-wght-normal.woff2"), "font/woff2"),
  mono: await dataUrl(fontFile("geist-mono", "geist-mono-latin-wght-normal.woff2"), "font/woff2"),
};

const escapeHtml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The title uses word-break: keep-all, so lines only break at spaces and at the zero-width
// spaces placed between words: Chinese wraps between 十座 and 城市, never inside a word.
function breakableTitle(title) {
  const groups = lineBreaks.getLineBreakGroups(title);
  return groups
    .map((group, index) => {
      const previous = groups[index - 1];
      const joinsWord = previous !== undefined && !/^\s+$/u.test(previous) && !/^\s+$/u.test(group);
      return `${joinsWord ? "\u200b" : ""}${escapeHtml(group)}`;
    })
    .join("");
}

function renderCard(card, cover) {
  const blogLabel = card.language === "en" ? "Blog" : "博客";
  return `<!doctype html>
<html lang="${card.language === "en" ? "en" : "zh-CN"}">
<head>
<meta charset="utf-8" />
<style>
  @font-face { font-family: "Card Display"; src: url(${fonts.display}) format("woff2"); font-weight: 200 800; }
  @font-face { font-family: "Card Body"; src: url(${fonts.body}) format("woff2"); font-weight: 100 900; }
  @font-face { font-family: "Card Mono"; src: url(${fonts.mono}) format("woff2"); font-weight: 100 900; }
  :root {
    --cjk: "PingFang SC", "Noto Sans CJK SC", "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif;
  }
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${width}px; height: ${height}px; overflow: hidden; }
  body {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 456px;
    grid-template-rows: minmax(0, 1fr);
    gap: 56px;
    padding: 56px 64px 52px;
    background-color: #f2f1eb;
    background-image:
      linear-gradient(rgba(18, 18, 16, 0.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(18, 18, 16, 0.055) 1px, transparent 1px);
    background-size: 48px 48px;
    background-position: -1px -1px;
    color: #121210;
    font-family: "Card Body", var(--cjk);
  }
  .copy { display: flex; flex-direction: column; min-width: 0; }
  .brand {
    display: flex; align-items: center; gap: 10px;
    font-family: "Card Display", var(--cjk); font-size: 26px; font-weight: 700; letter-spacing: -0.02em;
  }
  .brand i { width: 11px; height: 11px; background: #1d39f5; margin-top: 8px; }
  .kicker {
    margin-top: 44px;
    color: #1d39f5;
    font-family: "Card Mono", var(--cjk); font-size: 17px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  }
  .kicker span { color: #625f56; }
  h1 {
    margin-top: 18px;
    font-family: "Card Display", var(--cjk);
    font-size: var(--title-size, 60px);
    font-weight: 700;
    line-height: 1.18;
    letter-spacing: -0.025em;
    word-break: keep-all;
    overflow-wrap: anywhere;
    text-wrap: balance;
  }
  .meta {
    margin-top: auto;
    padding-top: 22px;
    border-top: 2px solid #121210;
    display: flex; justify-content: space-between; gap: 24px;
    color: #3a3a36;
    font-family: "Card Mono", var(--cjk); font-size: 18px; font-weight: 500; letter-spacing: 0.02em;
  }
  .cover {
    position: relative;
    height: 100%;
    border: 2px solid #121210;
    background: #e8e7e0 url(${cover}) ${card.coverPosition} / cover no-repeat;
    box-shadow: 14px 14px 0 rgba(18, 18, 16, 0.12);
  }
</style>
</head>
<body>
  <div class="copy">
    <div class="brand">ljj.world<i></i></div>
    <p class="kicker">${escapeHtml(blogLabel)} <span>/</span> ${escapeHtml(card.category)}</p>
    <h1 id="title">${breakableTitle(card.title)}</h1>
    <div class="meta"><span>${escapeHtml(card.date)}</span><span>${escapeHtml(card.readingTime)}</span></div>
  </div>
  <div class="cover" role="presentation"></div>
</body>
</html>`;
}

async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch (error) {
    // No bundled Playwright browser on this machine: fall back to the installed Chrome.
    try {
      return await chromium.launch({ channel: "chrome" });
    } catch {
      throw error;
    }
  }
}

const coverType = (file) => ({ ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" })[path.extname(file)] ?? "application/octet-stream";

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await mkdir(path.join(publicDir, "assets", "share"), { recursive: true });
  for (const card of cards) {
    const coverFile = path.join(publicDir, card.cover);
    if (!existsSync(coverFile)) throw new Error(`Cover for ${card.slug} is missing: public${card.cover}`);
    await page.setContent(renderCard(card, await dataUrl(coverFile, coverType(coverFile))), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    // Pick the title size: the largest that fits between the kicker and the meta row, or up
    // to 10px smaller when that saves a line (fewer, fuller lines read better at preview size).
    const titleSize = await page.evaluate(() => {
      const title = document.getElementById("title");
      const meta = document.querySelector(".meta");
      const column = document.querySelector(".copy");
      const measure = (size) => {
        document.documentElement.style.setProperty("--title-size", `${size}px`);
        const metaBox = meta.getBoundingClientRect();
        const titleBox = title.getBoundingClientRect();
        const fits = metaBox.bottom <= column.getBoundingClientRect().bottom + 0.5 && metaBox.top - titleBox.bottom >= 28;
        return { size, fits, lines: Math.round(titleBox.height / (size * 1.18)) };
      };
      const fitting = [];
      for (let size = 60; size >= 34; size -= 2) {
        const result = measure(size);
        if (result.fits) fitting.push(result);
      }
      if (!fitting.length) throw new Error("title does not fit even at 34px");
      const candidates = fitting.filter((result) => result.size >= fitting[0].size - 10);
      const fewestLines = Math.min(...candidates.map((result) => result.lines));
      const chosen = candidates.find((result) => result.lines === fewestLines);
      measure(chosen.size);
      return `${chosen.size}px, ${chosen.lines} lines`;
    });
    const output = path.join(publicDir, card.path);
    await writeFile(output, await page.screenshot({ type: "jpeg", quality: 86 }));
    console.log(`share card: public${card.path} (title ${titleSize})`);
  }
} finally {
  await browser.close();
}
