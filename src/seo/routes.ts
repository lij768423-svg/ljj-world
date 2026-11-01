import { getPageMetadata, projects } from "../App";
import { blogPosts, type BlogContent, type BlogPost } from "../blog";
import { withLanguagePrefix } from "../i18n/languageRouting";
import { translatePortfolioText, type PortfolioLanguage } from "../i18n/PortfolioLanguage";
import { shareCardPath, shareCardSize } from "./shareCards";

export { shareCardPath, shareCardSize };

export const siteOrigin = "https://ljj.world";
export const siteName = "ljj.world";
export const siteAuthor = "lij768423-svg";
export const feedTitle = "ljj.world 笔记";
export const feedDescription = "关于产品、学习、自建基础设施和独立交付的文章与实践笔记。";

export type SeoRoute = {
  path: string;
  title: string;
  description: string;
  image: string;
  type: "website" | "article";
  lastmod?: string;
  noindex?: boolean;
  article?: { datePublished: string; section: string };
  /** Articles get a generated share card per language, keyed by this slug (see getShareCards). */
  shareSlug?: string;
};

export type FeedItem = {
  slug: string;
  title: string;
  link: string;
  date: string;
  category: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  html: string;
};

export function toIsoDate(value: string) {
  const match = /^(\d{4})[.-](\d{2})[.-](\d{2})$/.exec(value.trim());
  if (!match) throw new Error(`Unrecognised date: ${value}`);
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function projectPath(projectId: string) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) throw new Error(`Unknown project: ${projectId}`);
  return project.detail ?? `/projects/${project.id}`;
}

function staticRoute(path: string, lastmod?: string): SeoRoute {
  const metadata = getPageMetadata(path);
  return { path, type: "website", lastmod, ...metadata };
}

function articleRoute(post: BlogPost): SeoRoute {
  const date = toIsoDate(post.date);
  return {
    path: `/blog/${post.slug}`,
    type: "article",
    lastmod: date,
    article: { datePublished: date, section: post.category },
    shareSlug: post.slug,
    ...getPageMetadata(`/blog/${post.slug}`),
  };
}

export type ShareCard = {
  slug: string;
  language: PortfolioLanguage;
  path: string;
  title: string;
  category: string;
  date: string;
  readingTime: string;
  cover: string;
  coverPosition: string;
};

/** Everything scripts/generate-share-cards.mjs needs to draw one card per article and language. */
export function getShareCards(): ShareCard[] {
  return sortedPosts().flatMap((post) => seoLanguages.map((language) => {
    const translate = (value: string) => (language === "en" ? translatePortfolioText(value) : value);
    return {
      slug: post.slug,
      language,
      path: shareCardPath(post.slug, language),
      title: translate(post.title),
      category: translate(post.category),
      date: post.date,
      readingTime: translate(post.readingTime),
      cover: post.image,
      coverPosition: post.imagePosition ?? "center",
    };
  }));
}

const sortedPosts = () => [...blogPosts].sort((first, second) => toIsoDate(second.date).localeCompare(toIsoDate(first.date)));

export function getSeoRoutes(): SeoRoute[] {
  const posts = sortedPosts();
  const latestPostDate = posts.length ? toIsoDate(posts[0].date) : undefined;
  return [
    staticRoute("/"),
    staticRoute("/projects"),
    ...projects.map((project) => staticRoute(project.detail ?? `/projects/${project.id}`)),
    staticRoute("/systems"),
    staticRoute("/about"),
    staticRoute("/desk"),
    staticRoute("/blog", latestPostDate),
    ...posts.map(articleRoute),
  ];
}

export type LocalizedSeoRoute = SeoRoute & {
  language: PortfolioLanguage;
  /** The same page in every language, keyed by language, as site-relative paths. */
  alternates: Record<PortfolioLanguage, string>;
  /** The share card for this language, when the page has one; og:image then points at it. */
  shareImage?: string;
};

/** The route as served in one language: "/projects" → "/en/projects" with translated copy for English. */
export function localizeRoute(route: SeoRoute, language: PortfolioLanguage): LocalizedSeoRoute {
  const translate = (value: string) => (language === "en" ? translatePortfolioText(value) : value);
  return {
    ...route,
    language,
    path: withLanguagePrefix(route.path, language),
    title: translate(route.title),
    description: translate(route.description),
    shareImage: route.shareSlug ? shareCardPath(route.shareSlug, language) : undefined,
    article: route.article ? { ...route.article, section: translate(route.article.section) } : undefined,
    alternates: { zh: withLanguagePrefix(route.path, "zh"), en: withLanguagePrefix(route.path, "en") },
  };
}

export const seoLanguages: readonly PortfolioLanguage[] = ["zh", "en"];

export function getNotFoundRoute(): SeoRoute {
  return { path: "/404", type: "website", noindex: true, ...getPageMetadata("/__not_found__") };
}

export function renderPostHtml(post: BlogPost) {
  const parts = [
    `<p><img src="${escapeHtml(new URL(post.image, siteOrigin).href)}" alt="${escapeHtml(post.imageAlt)}" /></p>`,
    `<p>${escapeHtml(post.intro)}</p>`,
  ];
  for (const section of post.sections) {
    parts.push(`<h2>${escapeHtml(section.title)}</h2>`);
    for (const block of section.content) parts.push(renderBlockHtml(block));
  }
  return parts.join("\n");
}

function renderBlockHtml(block: BlogContent) {
  if (typeof block === "string") return `<p>${escapeHtml(block)}</p>`;
  if (block.type === "code") {
    const caption = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : "";
    return `<figure>${caption}<pre><code class="language-${escapeHtml(block.language)}">${escapeHtml(block.code)}</code></pre></figure>`;
  }
  if (block.type === "list") {
    const tag = block.ordered ? "ol" : "ul";
    return `<${tag}>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
  }
  const caption = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : "";
  const src = escapeHtml(new URL(block.src, siteOrigin).href);
  return `<figure><img src="${src}" alt="${escapeHtml(block.alt)}" width="${block.width}" height="${block.height}" />${caption}</figure>`;
}

export function getFeedItems(): FeedItem[] {
  return sortedPosts().map((post) => ({
    slug: post.slug,
    title: post.title,
    link: `${siteOrigin}/blog/${post.slug}`,
    date: toIsoDate(post.date),
    category: post.category,
    excerpt: post.excerpt,
    image: new URL(post.image, siteOrigin).href,
    imageAlt: post.imageAlt,
    html: renderPostHtml(post),
  }));
}
