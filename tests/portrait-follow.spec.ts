import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-language", "zh");
    localStorage.setItem("portfolio-color-mode", "light");
  });
});

test("portrait loops transparently without controls and with static mobile fallback", async ({ page }, testInfo) => {
  const requests: string[] = [];
  page.on("request", request => { if (request.url().includes("/portrait-loop/")) requests.push(request.url()); });
  await page.goto("/", { waitUntil: "networkidle" });
  const video = page.locator(".hero-portrait-loop");
  const image = page.locator(".hero-portrait-image");
  await expect(page.locator(".hero-portrait-live")).toHaveCount(0);
  await expect(page.locator(".hero-portrait button")).toHaveCount(0);
  if (testInfo.project.name === "mobile") {
    await expect(video).toHaveCount(0);
    await expect(image).toHaveCSS("opacity", "1");
    expect(requests).toHaveLength(0);
    return;
  }
  await expect(video).toHaveAttribute("data-loop-ready", "true");
  await expect(page.locator(".home-entry-intro")).toHaveClass(/is-finished/, { timeout: 10000 });
  await expect(image).toHaveCSS("opacity", "0");
  const properties = await video.evaluate(element => {
    const media = element as HTMLVideoElement;
    const probe = document.createElement("canvas");
    probe.width = probe.height = 1;
    const context = probe.getContext("2d")!;
    context.drawImage(media, 0, 0);
    return { alpha: context.getImageData(0, 0, 1, 1).data[3], muted: media.muted, loop: media.loop, width: media.videoWidth, duration: media.duration };
  });
  expect(properties).toMatchObject({ alpha: 0, muted: true, loop: true, width: 1536 });
  expect(properties.duration).toBeCloseTo(5, 1);
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).paused)).toBe(false);
  expect(await video.evaluate(element => (element as HTMLVideoElement).controls)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("portrait-light.png") });
  await page.evaluate(() => document.documentElement.dataset.theme = "dark");
  await page.screenshot({ path: testInfo.outputPath("portrait-dark.png") });
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).paused)).toBe(false);
  await video.evaluate(element => { const media = element as HTMLVideoElement; media.currentTime = media.duration - .15; });
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeLessThan(2);
  const transform = await video.evaluate(element => getComputedStyle(element).transform);
  await page.mouse.move(1150, 150);
  expect(await video.evaluate(element => getComputedStyle(element).transform)).toBe(transform);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(video).toHaveCount(0);
  await expect(image).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(video).toHaveAttribute("data-loop-ready", "true");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(video).toHaveCount(0);
  await expect(image).toHaveCSS("opacity", "1");
});

test("portrait stays static if video loading fails", async ({ page }) => {
  await page.route("**/portrait-loop/*.webm", route => route.abort());
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(".hero-portrait-loop")).toHaveCount(0);
  await expect(page.locator(".hero-portrait-image")).toHaveCSS("opacity", "1");
  await expect(page.getByRole("button", { name: "暂停人物动画" })).toHaveCount(0);
});

test("reduced motion and data saver do not request portrait video", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => Object.defineProperty(navigator, "connection", { value: Object.assign(new EventTarget(), { saveData: true }) }));
  const requests: string[] = [];
  page.on("request", request => { if (request.url().includes("/portrait-loop/")) requests.push(request.url()); });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(".hero-portrait-loop")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForTimeout(250);
  await expect(page.locator(".hero-portrait-loop")).toHaveCount(0);
  expect(requests).toHaveLength(0);
});
