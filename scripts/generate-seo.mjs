// Post-build SEO output. Runs after `vite build` and turns the single dist/index.html into:
//   - one HTML entry per route (dist/<route>/index.html) with its own title, description,
//     canonical, Open Graph / Twitter tags and JSON-LD, so crawlers and link previews see the
//     page instead of the home page shell;
//   - dist/404.html (noindex) for the static host to serve with a 404 status;
//   - dist/sitemap.xml and dist/rss.xml.
// Route data comes from src/seo/routes.ts, loaded through Vite so it shares the app's own
// page metadata, project list and blog posts.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { runnerImport } from "vite";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const template = path.join(dist, "index.html");
if (!existsSync(template)) throw new Error("dist/index.html is missing; run `vite build` before generate-seo");

// The route module reaches App.tsx, whose component imports pull in stylesheets. Only data
// is needed here and Vite's CSS pipeline is not wired for runnerImport, so stylesheets
// resolve to empty modules.
const stubStylesheets = {
  name: "seo:stub-stylesheets",
  enforce: "pre",
  resolveId(id) {
    return /\.(css|scss|sass|less)(\?.*)?$/.test(id) ? "\0seo-stylesheet-stub" : null;
  },
  load(id) {
    return id === "\0seo-stylesheet-stub" ? "export default {};" : null;
  },
};

const { module: seo } = await runnerImport("/src/seo/routes.ts", {
  root,
  configFile: path.join(root, "vite.config.ts"),
  plugins: [stubStylesheets],
  logLevel: "warn",
});
const { siteOrigin, siteName, siteAuthor, feedTitle, feedDescription, escapeHtml } = seo;
const routes = seo.getSeoRoutes();
const notFound = seo.getNotFoundRoute();
const feedItems = seo.getFeedItems();

const absolute = (relative) => new URL(relative, siteOrigin).href;
const dateTime = (isoDate) => `${isoDate}T00:00:00+08:00`;
const gitDate = (() => {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cs"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || undefined;
  } catch {
    return undefined;
  }
})();

const duplicates = routes.map((route) => route.path).filter((item, index, all) => all.indexOf(item) !== index);
if (duplicates.length) throw new Error(`Duplicate SEO routes: ${duplicates.join(", ")}`);

function replaceOne(html, pattern, replacement, label) {
  const matches = html.match(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`)) ?? [];
  if (matches.length !== 1) throw new Error(`Expected exactly one ${label} in dist/index.html, found ${matches.length}`);
  return html.replace(pattern, replacement);
}

const metaPattern = (attribute, name) => new RegExp(`<meta\\s+${attribute}="${name}"\\s+content="[^"]*"\\s*/?>`);

function renderJsonLd(route) {
  if (route.path === "/") return null;
  if (route.type === "article") {
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: route.title.replace(/ \| [^|]+$/, ""),
      description: route.description,
      image: [absolute(route.image)],
      datePublished: dateTime(route.article.datePublished),
      dateModified: dateTime(route.article.datePublished),
      articleSection: route.article.section,
      inLanguage: "zh-CN",
      author: { "@type": "Person", name: siteAuthor, url: `${siteOrigin}/about` },
      publisher: { "@type": "Person", name: siteAuthor },
      mainEntityOfPage: absolute(route.path),
    };
  }
  return undefined;
}

function renderRoute(html, route) {
  const url = absolute(route.path);
  const image = absolute(route.image);
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);

  let output = replaceOne(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`, "<title>");
  output = replaceOne(output, metaPattern("name", "description"), `<meta name="description" content="${description}" />`, "description meta");
  output = replaceOne(output, metaPattern("property", "og:title"), `<meta property="og:title" content="${title}" />`, "og:title meta");
  output = replaceOne(output, metaPattern("property", "og:description"), `<meta property="og:description" content="${description}" />`, "og:description meta");
  output = replaceOne(output, metaPattern("property", "og:type"), `<meta property="og:type" content="${route.type}" />`, "og:type meta");
  output = replaceOne(output, metaPattern("property", "og:image"), `<meta property="og:image" content="${escapeHtml(image)}" />`, "og:image meta");

  const extra = [
    route.noindex ? `<meta name="robots" content="noindex" />` : `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(siteName)}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ];
  if (route.type === "article") {
    extra.push(
      `<meta property="article:published_time" content="${dateTime(route.article.datePublished)}" />`,
      `<meta property="article:section" content="${escapeHtml(route.article.section)}" />`,
      `<meta property="article:author" content="${escapeHtml(`${siteOrigin}/about`)}" />`,
    );
  }
  output = output.replace(`<title>${title}</title>`, `<title>${title}</title>\n    ${extra.join("\n    ")}`);

  const jsonLd = renderJsonLd(route);
  const jsonLdPattern = /\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/;
  if (jsonLd === null) {
    // Home keeps the Person record from index.html.
    if (!jsonLdPattern.test(output)) throw new Error("dist/index.html lost its JSON-LD block");
  } else if (jsonLd === undefined) {
    output = output.replace(jsonLdPattern, "");
  } else {
    const json = JSON.stringify(jsonLd, null, 2).replace(/</g, "\\u003c").replace(/\n/g, "\n      ");
    output = replaceOne(output, jsonLdPattern, `\n    <script type="application/ld+json">\n      ${json}\n    </script>`, "JSON-LD block");
  }
  return output;
}

function outputFile(routePath) {
  if (routePath === "/") return template;
  return path.join(dist, ...routePath.split("/").filter(Boolean), "index.html");
}

function renderSitemap() {
  const entries = routes.map((route) => {
    const lastmod = route.lastmod ?? gitDate;
    return `  <url>\n    <loc>${escapeHtml(absolute(route.path))}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

function renderFeed() {
  // RFC 822 in the site's own zone, e.g. "Fri, 07 Aug 2026 00:00:00 +0800".
  const rfc822 = (isoDate) => {
    const [year, month, day] = isoDate.split("-").map(Number);
    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
    const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month - 1];
    return `${weekday}, ${String(day).padStart(2, "0")} ${monthName} ${year} 00:00:00 +0800`;
  };
  const newest = feedItems[0]?.date;
  const items = feedItems.map((item) => [
    "    <item>",
    `      <title>${escapeHtml(item.title)}</title>`,
    `      <link>${escapeHtml(item.link)}</link>`,
    `      <guid isPermaLink="true">${escapeHtml(item.link)}</guid>`,
    `      <pubDate>${rfc822(item.date)}</pubDate>`,
    `      <category>${escapeHtml(item.category)}</category>`,
    `      <description>${escapeHtml(item.excerpt)}</description>`,
    `      <content:encoded><![CDATA[${item.html.replace(/]]>/g, "]]]]><![CDATA[>")}]]></content:encoded>`,
    "    </item>",
  ].join("\n"));
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">`,
    "  <channel>",
    `    <title>${escapeHtml(feedTitle)}</title>`,
    `    <link>${escapeHtml(`${siteOrigin}/blog`)}</link>`,
    `    <description>${escapeHtml(feedDescription)}</description>`,
    "    <language>zh-CN</language>",
    `    <managingEditor>${escapeHtml(siteAuthor)}</managingEditor>`,
    ...(newest ? [`    <lastBuildDate>${rfc822(newest)}</lastBuildDate>`] : []),
    `    <atom:link href="${escapeHtml(`${siteOrigin}/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

const html = await readFile(template, "utf8");
const written = [];
for (const route of [...routes, notFound]) {
  const target = route === notFound ? path.join(dist, "404.html") : outputFile(route.path);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, renderRoute(html, route));
  written.push(path.relative(dist, target));
}
await writeFile(path.join(dist, "sitemap.xml"), renderSitemap());
await writeFile(path.join(dist, "rss.xml"), renderFeed());
console.log(`generate-seo: ${routes.length} routes + 404.html, sitemap.xml (${routes.length} urls), rss.xml (${feedItems.length} items)`);
