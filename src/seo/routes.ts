import { getPageMetadata, projects } from "../App";
import { blogPosts, type BlogPost } from "../blog";

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
    ...getPageMetadata(`/blog/${post.slug}`),
  };
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
    for (const paragraph of section.paragraphs) parts.push(`<p>${escapeHtml(paragraph)}</p>`);
  }
  return parts.join("\n");
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
