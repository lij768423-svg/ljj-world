import { expect, test } from "@playwright/test";
import { blogPosts } from "../src/blog";

/** The first post cover's responsive candidates, smallest first. */
const coverCandidates = (blogPosts[0].srcSet ?? "").split(",")
  .map((entry) => entry.trim().split(/\s+/))
  .map(([url, width]) => ({ url, width: Number.parseInt(width, 10) }))
  .sort((first, second) => first.width - second.width);

test("blog cold entry loads only its responsive current cover", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Explicit mobile viewport and network coverage.");
  await page.setViewportSize({ width: 390, height: 844 });
  const images: string[] = [];
  page.on("request", request => { if (request.resourceType() === "image") images.push(new URL(request.url()).pathname); });
  await page.goto("/blog", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  expect(images.filter(image => image.startsWith("/assets/"))).toEqual([
    coverCandidates[0].url,
  ]);
  const current = page.locator(".blog-console-portrait figure.is-active img");
  await expect(current).toHaveJSProperty("complete", true);
  await page.locator(".blog-index-list a").nth(1).focus();
  await expect(current).toHaveAttribute("src", /home-lab\.webp$/);
  expect(images.some(image => image.includes("desk-setup"))).toBe(false);
  expect(images.some(image => image.endsWith("grok-register-panel.png"))).toBe(false);
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
  expect(await image.evaluate((element: HTMLImageElement) => element.currentSrc)).toMatch(new RegExp(`${coverCandidates.at(-1)!.url}$`));
});

test("save-data suppresses speculative navigation preloads", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop pointer navigation.");
  await page.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true, effectiveType: "4g", downlink: 10 } }));
  const images: string[] = [];
  page.on("request", request => { if (request.resourceType() === "image") images.push(new URL(request.url()).pathname); });
  await page.goto("/blog", { waitUntil: "networkidle" });
  await page.locator("header a[href='/projects']").first().hover();
  await page.waitForTimeout(500);
  expect(images.some(image => image.includes("grok2api-egress") || image.includes("desk-setup"))).toBe(false);
});
