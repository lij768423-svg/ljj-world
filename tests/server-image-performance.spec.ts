import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("portfolio-language", "zh"));
});

test("only the active viewport downloads its images and resize swaps the view", async ({ page }, testInfo) => {
  const images: string[] = [];
  page.on("request", request => {
    if (/\/assets\/(service-art|server-parts)\//.test(request.url())) images.push(request.url());
  });
  await page.goto("/systems", { waitUntil: "networkidle" });
  const mobile = testInfo.project.name === "mobile";
  expect(images.every(source => source.endsWith(".webp"))).toBe(true);
  expect(images.filter(source => source.includes("server-parts"))).toHaveLength(mobile ? 1 : 5);
  expect([...new Set(images.filter(source => source.includes("service-art")))]).toHaveLength(mobile ? 5 : 0);
  if (!mobile) {
    await page.getByRole("button", { name: "聚焦 NVMe 数据模块" }).press("Enter");
    await expect.poll(() => [...new Set(images.filter(source => source.includes("service-art")))].length).toBe(5);
  }
  await expect(page.locator(mobile ? ".server-story" : ".server-mobile-story")).toHaveCount(0);
  await page.setViewportSize({ width: mobile ? 1440 : 390, height: 1000 });
  await expect(page.locator(mobile ? ".server-story" : ".server-mobile-story")).toBeVisible();
  await expect(page.locator(mobile ? ".server-mobile-story" : ".server-story")).toHaveCount(0);
});

test("intent prefetch is reused and slow image retains a stable placeholder", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop hover and keyboard intent.");
  let requests = 0;
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/service-art/immich-*.webp", async route => {
    requests += 1;
    await gate;
    await route.continue();
  });
  await page.goto("/systems", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "聚焦 NVMe 数据模块" }).press("Enter");
  const button = page.getByRole("button", { name: "查看 Immich 介绍", exact: true });
  await button.focus();
  await expect.poll(() => requests).toBe(1);
  await button.press("Enter");
  const artwork = page.locator('[data-service-art="immich"]');
  await expect(artwork).toHaveAttribute("data-image-state", "loading");
  await expect(artwork.locator(".service-art-placeholder")).toBeVisible();
  const before = await artwork.boundingBox();
  release();
  await expect(artwork).toHaveAttribute("data-image-state", "ready");
  expect(await artwork.boundingBox()).toEqual(before);
  expect(requests).toBeLessThanOrEqual(2);
});

test("cached intent image is not downloaded again on entry", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop network cache.");
  await page.goto("/systems", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "聚焦 NVMe 数据模块" }).press("Enter");
  const button = page.getByRole("button", { name: "查看 Immich 介绍", exact: true });
  await button.focus();
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType("resource").filter(entry => entry.name.includes("/service-art/immich-")).length)).toBe(1);
  await button.press("Enter");
  await expect(page.locator('[data-service-art="immich"]')).toHaveAttribute("data-image-state", "ready");
  const transfers = await page.evaluate(() => (performance.getEntriesByType("resource") as PerformanceResourceTiming[]).filter(entry => entry.name.includes("/service-art/immich-") && entry.transferSize > 0).length);
  expect(transfers).toBe(1);
});

test("image failure has a keyboard retry and does not break return", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop retry and return.");
  await page.route("**/service-art/immich-*.webp", route => route.abort());
  await page.goto("/systems", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "聚焦 NVMe 数据模块" }).press("Enter");
  await page.getByRole("button", { name: "查看 Immich 介绍", exact: true }).press("Enter");
  const artwork = page.locator('[data-service-art="immich"]');
  await expect(artwork).toHaveAttribute("data-image-state", "error");
  await page.unroute("**/service-art/immich-*.webp");
  await page.getByRole("button", { name: "重试加载图片" }).press("Enter");
  await expect(artwork).toHaveAttribute("data-image-state", "ready");
  await page.locator(".server-story-service-back").click();
  await expect(page.locator(".server-story-focus-visual").locator(":scope > img, :scope > svg")).toBeVisible();
});
