import { expect, test } from "@playwright/test";

test("blog cold entry loads only its responsive current cover", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Explicit mobile viewport and network coverage.");
  await page.setViewportSize({ width: 390, height: 844 });
  const images: string[] = [];
  page.on("request", request => { if (request.resourceType() === "image") images.push(new URL(request.url()).pathname); });
  await page.goto("/blog", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  expect(images.filter(image => image.startsWith("/assets/"))).toEqual([
    expect.stringMatching(/\/grok-register-panel-480-[a-f0-9]+\.webp$/),
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
  expect(await image.evaluate((element: HTMLImageElement) => element.currentSrc)).toMatch(/grok-register-panel-1584-[a-f0-9]+\.webp$/);
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
