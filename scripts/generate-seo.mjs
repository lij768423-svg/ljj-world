// Post-build SEO output. Runs after `vite build` and turns the single dist/index.html into:
//   - one HTML entry per route (dist/<route>/index.html) with its own title, description,
//     canonical, Open Graph / Twitter tags and JSON-LD, so crawlers and link previews see the
//     page instead of the home page shell;
//   - dist/404.html and dist/en/404.html (noindex) for the static host to serve with a 404 status;
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
// One not-found page per language: the host serves en/404.html for missing paths under /en.
const notFoundPages = seo.seoLanguages.map((language) => seo.localizeRoute(seo.getNotFoundRoute(), language));
const feedItems = seo.getFeedItems();
// Every page is served in Chinese at "/…" and in English at "/en/…"; each entry links its
// alternates with hreflang and x-default points at the Chinese page.
const localizedRoutes = routes.flatMap((route) => seo.seoLanguages.map((language) => seo.localizeRoute(route, language)));

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
// Articles point og:image at their generated share card (public/assets/share, drawn by
// scripts/generate-share-cards.mjs and committed). A post without one fails the build here
// rather than shipping a broken preview.
const missingCards = localizedRoutes.filter((route) => route.shareImage && !existsSync(path.join(dist, route.shareImage)));
if (missingCards.length) throw new Error(`Share cards are missing (run \`npm run share-cards\`): ${missingCards.map((route) => route.shareImage).join(", ")}`);
const untranslated = [...localizedRoutes, ...notFoundPages].filter((route) => route.language === "en" && /[㐀-鿿]/u.test(`${route.title} ${route.description}`));
if (untranslated.length) throw new Error(`English entries still carry Chinese copy (add translations): ${untranslated.map((route) => route.path).join(", ")}`);
// Titles end in " | lij768423-svg"; a translation that drops a space around the bar slips in easily.
const badSeparators = [...localizedRoutes, ...notFoundPages].filter((route) => /\S\||\|\S/u.test(route.title));
if (badSeparators.length) throw new Error(`Titles need spaces around "|": ${badSeparators.map((route) => `${route.path} (${route.title})`).join(", ")}`);

function replaceOne(html, pattern, replacement, label) {
  const matches = html.match(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`)) ?? [];
  if (matches.length !== 1) throw new Error(`Expected exactly one ${label} in dist/index.html, found ${matches.length}`);
  return html.replace(pattern, replacement);
}

const metaPattern = (attribute, name) => new RegExp(`<meta\\s+${attribute}="${name}"\\s+content="[^"]*"\\s*/?>`);

function renderJsonLd(route) {
  if (route.path === "/" || route.path === "/en/") return null;
  if (route.type === "article") {
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: route.title.replace(/ \| [^|]+$/, ""),
      description: route.description,
      image: [absolute(route.image), ...(route.shareImage ? [absolute(route.shareImage)] : [])],
      datePublished: dateTime(route.article.datePublished),
      dateModified: dateTime(route.article.datePublished),
      articleSection: route.article.section,
      inLanguage: route.language === "en" ? "en" : "zh-CN",
      author: { "@type": "Person", name: siteAuthor, url: `${siteOrigin}/about` },
      publisher: { "@type": "Person", name: siteAuthor },
      mainEntityOfPage: absolute(route.path),
    };
  }
  return undefined;
}

function renderRoute(html, route) {
  const url = absolute(route.path);
  const image = absolute(route.shareImage ?? route.image);
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);

  const lang = route.language === "en" ? "en" : "zh-CN";
  let output = replaceOne(html, /<html lang="[^"]*">/, `<html lang="${lang}">`, "<html lang>");
  output = replaceOne(output, metaPattern("property", "og:locale"), `<meta property="og:locale" content="${route.language === "en" ? "en_US" : "zh_CN"}" />`, "og:locale meta");
  output = replaceOne(output, /<title>[^<]*<\/title>/, `<title>${title}</title>`, "<title>");
  output = replaceOne(output, metaPattern("name", "description"), `<meta name="description" content="${description}" />`, "description meta");
  output = replaceOne(output, metaPattern("property", "og:title"), `<meta property="og:title" content="${title}" />`, "og:title meta");
  output = replaceOne(output, metaPattern("property", "og:description"), `<meta property="og:description" content="${description}" />`, "og:description meta");
  output = replaceOne(output, metaPattern("property", "og:type"), `<meta property="og:type" content="${route.type}" />`, "og:type meta");
  output = replaceOne(output, metaPattern("property", "og:image"), `<meta property="og:image" content="${escapeHtml(image)}" />`, "og:image meta");

  const extra = [
    route.noindex ? `<meta name="robots" content="noindex" />` : `<link rel="canonical" href="${escapeHtml(url)}" />`,
    ...(route.noindex ? [] : [
      `<link rel="alternate" hreflang="zh-CN" href="${escapeHtml(absolute(route.alternates.zh))}" />`,
      `<link rel="alternate" hreflang="en" href="${escapeHtml(absolute(route.alternates.en))}" />`,
      `<link rel="alternate" hreflang="x-default" href="${escapeHtml(absolute(route.alternates.zh))}" />`,
    ]),
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(siteName)}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    ...(route.shareImage ? [
      `<meta property="og:image:width" content="${seo.shareCardSize.width}" />`,
      `<meta property="og:image:height" content="${seo.shareCardSize.height}" />`,
      `<meta property="og:image:alt" content="${escapeHtml(route.title.replace(/ \| [^|]+$/, ""))}" />`,
    ] : []),
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
  const entries = localizedRoutes.map((route) => {
    const lastmod = route.lastmod ?? gitDate;
    const links = [["zh-CN", route.alternates.zh], ["en", route.alternates.en], ["x-default", route.alternates.zh]]
      .map(([hreflang, href]) => `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeHtml(absolute(href))}" />`);
    return `  <url>\n    <loc>${escapeHtml(absolute(route.path))}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n${links.join("\n")}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join("\n")}\n</urlset>\n`;
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
for (const route of [...localizedRoutes, ...notFoundPages]) {
  const target = notFoundPages.includes(route)
    ? path.join(dist, ...(route.language === "en" ? ["en"] : []), "404.html")
    : outputFile(route.path);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, renderRoute(html, route));
  written.push(path.relative(dist, target));
}
await writeFile(path.join(dist, "sitemap.xml"), renderSitemap());
await writeFile(path.join(dist, "rss.xml"), renderFeed());
console.log(`generate-seo: ${routes.length} routes × ${seo.seoLanguages.length} languages + 404 pages, sitemap.xml (${localizedRoutes.length} urls), rss.xml (${feedItems.length} items)`);
