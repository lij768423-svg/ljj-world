import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

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

  test("404.html is noindex and keeps the app shell", () => {
    const notFound = read("404.html");
    expect(meta(notFound, "name", "robots")).toBe("noindex");
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
