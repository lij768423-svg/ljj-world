import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { blogPosts } from "../src/blog";

// Checks the files `npm run build` (vite build + scripts/generate-seo.mjs) leaves in dist/.
// CI builds before running the suite; locally run `npm run build` first.
const dist = path.resolve(import.meta.dirname, "../dist");
const read = (relative: string) => readFileSync(path.join(dist, relative), "utf8");
const meta = (html: string, attribute: string, name: string) =>
  new RegExp(`<meta\\s+${attribute}="${name}"\\s+content="([^"]*)"`).exec(html)?.[1];

test.describe("SEO build output", () => {
  test.skip(!existsSync(path.join(dist, "sitemap.xml")), "dist/ is missing; run `npm run build` first");

  test("every route gets its own HTML entry with route-specific metadata", () => {
    const home = read("index.html");
    const article = read("blog/grok-register-panel/index.html");
    const project = read("projects/408/index.html");
    const systems = read("systems/index.html");

    expect(home).toContain('<link rel="canonical" href="https://ljj.world/" />');
    expect(home).toContain('"@type": "Person"');
    expect(meta(home, "property", "og:url")).toBe("https://ljj.world/");

    expect(article).toMatch(/<title>Grok Register Panel：哪些失败值得重试 \| lij768423-svg<\/title>/);
    expect(meta(article, "property", "og:type")).toBe("article");
    expect(meta(article, "property", "og:url")).toBe("https://ljj.world/blog/grok-register-panel");
    expect(meta(article, "property", "og:image")).toMatch(/^https:\/\/ljj\.world\/assets\//);
    expect(meta(article, "property", "article:published_time")).toBe("2026-08-07T00:00:00+08:00");
    expect(article).toContain('"@type": "BlogPosting"');
    expect(article).not.toContain('"@type": "Person",\n        "name"');

    expect(project).toMatch(/<title>408 刷题库[^<]*\| lij768423-svg<\/title>/);
    expect(meta(project, "name", "description")).not.toBe(meta(home, "name", "description"));
    expect(meta(systems, "property", "og:url")).toBe("https://ljj.world/systems");

    // The route entries must boot the same app bundle as the home page.
    const scripts = (html: string) => html.match(/<script type="module"[^>]*src="[^"]+"/g);
    expect(scripts(article)).toEqual(scripts(home));
    expect(scripts(project)).toEqual(scripts(home));
  });

  test("every route also has an English entry under /en with hreflang links", () => {
    const zh = read("blog/grok-register-panel/index.html");
    const en = read("en/blog/grok-register-panel/index.html");
    const home = read("en/index.html");

    expect(en).toContain('<html lang="en">');
    expect(zh).toContain('<html lang="zh-CN">');
    expect(en).toMatch(/<title>Grok Register Panel: which failures are worth retrying\? \| lij768423-svg<\/title>/);
    expect(meta(en, "property", "og:locale")).toBe("en_US");
    expect(meta(en, "property", "og:url")).toBe("https://ljj.world/en/blog/grok-register-panel");
    expect(en).toContain('<link rel="canonical" href="https://ljj.world/en/blog/grok-register-panel" />');
    for (const html of [zh, en]) {
      expect(html).toContain('<link rel="alternate" hreflang="zh-CN" href="https://ljj.world/blog/grok-register-panel" />');
      expect(html).toContain('<link rel="alternate" hreflang="en" href="https://ljj.world/en/blog/grok-register-panel" />');
      expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://ljj.world/blog/grok-register-panel" />');
    }
    expect(en).toContain('"inLanguage": "en"');
    expect(home).toContain('<link rel="canonical" href="https://ljj.world/en/" />');
    expect(home).toContain('"@type": "Person"');
    const scripts = (html: string) => html.match(/<script type="module"[^>]*src="[^"]+"/g);
    expect(scripts(en)).toEqual(scripts(zh));
  });

  test("articles use a generated share card per language", () => {
    const zh = read("blog/pluggable-city-travel-agent/index.html");
    const en = read("en/blog/pluggable-city-travel-agent/index.html");
    expect(meta(zh, "property", "og:image")).toBe("https://ljj.world/assets/share/pluggable-city-travel-agent-zh.jpg");
    expect(meta(en, "property", "og:image")).toBe("https://ljj.world/assets/share/pluggable-city-travel-agent-en.jpg");
    expect(meta(en, "name", "twitter:image")).toBe(meta(en, "property", "og:image"));
    expect(meta(zh, "property", "og:image:width")).toBe("1200");
    expect(meta(zh, "property", "og:image:height")).toBe("630");
    expect(meta(zh, "property", "og:image:alt")).toBe("一套代码接入十座城市：行记的可插拔城市设计");
    for (const post of blogPosts) {
      for (const language of ["zh", "en"]) {
        const card = path.join(dist, "assets", "share", `${post.slug}-${language}.jpg`);
        expect(existsSync(card), card).toBe(true);
        // JPEG, 1200x630: read the SOF0/SOF2 frame header.
        const bytes = readFileSync(card);
        expect(bytes.subarray(0, 2).toString("hex")).toBe("ffd8");
        let offset = 2;
        let size: [number, number] | undefined;
        while (offset < bytes.length && !size) {
          const marker = bytes[offset + 1];
          const length = bytes.readUInt16BE(offset + 2);
          if (marker === 0xc0 || marker === 0xc2) size = [bytes.readUInt16BE(offset + 7), bytes.readUInt16BE(offset + 5)];
          offset += 2 + length;
        }
        expect(size, card).toEqual([1200, 630]);
      }
    }
    // Pages without a card keep their own image and no card dimensions.
    expect(meta(read("projects/index.html"), "property", "og:image:width")).toBeUndefined();
  });

  test("404.html is noindex and keeps the app shell", () => {
    const notFound = read("404.html");
    expect(meta(notFound, "name", "robots")).toBe("noindex");
    expect(notFound).not.toContain('rel="canonical"');
    expect(notFound).toContain('id="root"');
    expect(notFound).toContain('<html lang="zh-CN">');
  });

  test("en/404.html is the English not-found page", () => {
    const notFound = read("en/404.html");
    expect(notFound).toContain('<html lang="en">');
    expect(notFound).toMatch(/<title>Page not found \| lij768423-svg<\/title>/);
    expect(meta(notFound, "name", "robots")).toBe("noindex");
    expect(meta(notFound, "property", "og:locale")).toBe("en_US");
    expect(notFound).not.toContain('rel="canonical"');
    expect(notFound).toContain('id="root"');
  });

  test("sitemap lists every indexable route exactly once", () => {
    const sitemap = read("sitemap.xml");
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(new Set(locs).size).toBe(locs.length);
    expect(locs).toContain("https://ljj.world/");
    expect(locs).toContain("https://ljj.world/projects/hermes-ios");
    expect(locs).toContain("https://ljj.world/blog/grok-register-panel");
    expect(locs).toContain("https://ljj.world/en/");
    expect(locs).toContain("https://ljj.world/en/blog/grok-register-panel");
    expect(sitemap).toContain('<xhtml:link rel="alternate" hreflang="en" href="https://ljj.world/en/blog/grok-register-panel" />');
    expect(locs.some((loc) => loc.includes("404"))).toBe(false);
    expect(sitemap).toContain("<lastmod>2026-08-07</lastmod>");
    for (const loc of locs) {
      const relative = loc.replace("https://ljj.world", "");
      expect(existsSync(path.join(dist, ...relative.split("/").filter(Boolean), "index.html")), loc).toBe(true);
    }
  });

  test("rss.xml carries the blog posts with full content", () => {
    const feed = read("rss.xml");
    expect(feed).toContain('<rss version="2.0"');
    expect(feed).toContain('<atom:link href="https://ljj.world/rss.xml" rel="self"');
    const items = feed.match(/<item>/g) ?? [];
    expect(items.length).toBeGreaterThanOrEqual(5);
    expect(feed).toContain("<link>https://ljj.world/blog/grok-register-panel</link>");
    expect(feed).toContain("<content:encoded><![CDATA[");
    expect(feed).toContain("<pubDate>Fri, 07 Aug 2026 00:00:00 +0800</pubDate>");
  });
});
