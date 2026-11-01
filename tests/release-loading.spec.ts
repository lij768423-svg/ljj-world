import { expect, test } from "@playwright/test";
import { blogPosts } from "../src/blog";

/** The cover request a cold blog entry may make for `post`: the smallest responsive candidate, or
 *  the single cover file when the post has no srcSet. */
function coldCover(post: (typeof blogPosts)[number]) {
  const candidates = (post.srcSet ?? "").split(",").map((entry) => entry.trim()).filter(Boolean)
    .map((entry) => entry.split(/\s+/))
    .map(([url, width]) => ({ url, width: Number.parseInt(width, 10) }))
    .sort((first, second) => first.width - second.width);
  return candidates[0]?.url ?? post.image;
}

const basename = (url: string) => url.slice(url.lastIndexOf("/") + 1);

/** The cover a desktop viewport should end up showing for `post`: the largest responsive candidate,
 *  or the single cover file when the post has no srcSet. */
function fullCover(post: (typeof blogPosts)[number]) {
  const candidates = (post.srcSet ?? "").split(",").map((entry) => entry.trim()).filter(Boolean)
    .map((entry) => entry.split(/\s+/))
    .map(([url, width]) => ({ url, width: Number.parseInt(width, 10) }))
    .sort((first, second) => first.width - second.width);
  return candidates.at(-1)?.url ?? post.image;
}

test("blog cold entry loads only its responsive current cover", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Explicit mobile viewport and network coverage.");
  await page.setViewportSize({ width: 390, height: 844 });
  const images: string[] = [];
  page.on("request", request => { if (request.resourceType() === "image") images.push(new URL(request.url()).pathname); });
  await page.goto("/blog", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  expect(images.filter(image => image.startsWith("/assets/"))).toEqual([coldCover(blogPosts[0])]);
  const current = page.locator(".blog-console-portrait figure.is-active img");
  await expect(current).toHaveJSProperty("complete", true);
  await page.locator(".blog-index-list a").nth(1).focus();
  await expect(current).toHaveAttribute("src", new RegExp(basename(blogPosts[1].image).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"));
  for (const post of blogPosts.slice(2)) {
    expect(images.some(image => image.endsWith(basename(post.image))), `${post.slug} cover must not load before it is focused`).toBe(false);
  }
});

test("homepage does not speculatively download other pages", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Explicit cold start request inspection.");
  const images: string[] = [];
  page.on("request", request => { if (request.resourceType() === "image") images.push(new URL(request.url()).pathname); });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  expect(images.some(image => image.includes("grok2api-egress") || image.includes("desk-setup"))).toBe(false);
  expect(images.some(image => /virtual-developer-avatar-\d/.test(image))).toBe(false);
  expect(images.some(image => image.includes("virtual-developer-avatar-dark"))).toBe(true);
});

test("desktop portrait cover uses a sufficiently detailed crop", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop cover crop density.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/blog", { waitUntil: "networkidle" });
  const image = page.locator(".blog-console-portrait figure.is-active img");
  await expect(image).toHaveJSProperty("complete", true);
  expect(await image.evaluate((element: HTMLImageElement) => element.currentSrc)).toMatch(new RegExp(`${fullCover(blogPosts[0]).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
});

test("save-data suppresses speculative navigation preloads", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop pointer navigation.");
  await page.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true, effectiveType: "4g", downlink: 10 } }));
  const images: string[] = [];
  page.on("request", request => { if (request.resourceType() === "image") images.push(new URL(request.url()).pathname); });
  await page.goto("/blog", { waitUntil: "networkidle" });
  // The visit may land under /en, so match the route regardless of the language prefix.
  await page.locator("header a[href$='/projects']").first().hover();
  await page.waitForTimeout(500);
  expect(images.some(image => image.includes("grok2api-egress") || image.includes("desk-setup"))).toBe(false);
});
