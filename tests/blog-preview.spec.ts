import { expect, test, type Page } from "@playwright/test";

async function openBlog(page: Page) {
  await page.goto("/blog", { waitUntil: "networkidle" });
  await expect(page.locator(".blog-console-visual")).toHaveCSS("opacity", "1");
  await expect(page.locator(".blog-console-visual")).toHaveCSS("transform", "none");
}

function samplePreview(page: Page, duration = 900) {
  return page.locator(".blog-console-portrait").evaluate((portrait, sampleDuration) => (
    new Promise<Array<{ coverage: number; opacities: number[]; offsets: number[]; width: number; height: number }>>((resolve) => {
      const frames: Array<{ coverage: number; opacities: number[]; offsets: number[]; width: number; height: number }> = [];
      const startedAt = performance.now();
      const sample = () => {
        const layers = Array.from(portrait.querySelectorAll("figure")).map((figure) => {
          const style = getComputedStyle(figure);
          const image = figure.querySelector("img")!;
          return {
            opacity: image.complete && image.naturalWidth > 0 ? Number(style.opacity) : 0,
            offset: new DOMMatrixReadOnly(style.transform).m41,
          };
        });
        const bounds = portrait.getBoundingClientRect();
        frames.push({
          coverage: 1 - layers.reduce((remaining, layer) => remaining * (1 - layer.opacity), 1),
          opacities: layers.map((layer) => layer.opacity),
          offsets: layers.filter((layer) => layer.opacity > 0.01).map((layer) => layer.offset),
          width: bounds.width,
          height: bounds.height,
        });
        if (performance.now() - startedAt < sampleDuration) requestAnimationFrame(sample);
        else resolve(frames);
      };
      sample();
    })
  ), duration);
}

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "This suite explicitly covers mouse and keyboard previews.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-language", "zh");
    localStorage.setItem("portfolio-color-mode", "light");
    localStorage.setItem("portfolio-pointer-trail", "off");
  });
});

for (const theme of ["light", "dark"] as const) {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`blog cover stays opaque and stationary in ${theme} with ${reducedMotion}`, async ({ page }, testInfo) => {
      await page.emulateMedia({ reducedMotion });
      await page.addInitScript((savedTheme) => localStorage.setItem("portfolio-color-mode", savedTheme), theme);
      await openBlog(page);

      for (const postIndex of [1, 0]) {
        const sampledFrames = samplePreview(page);
        const post = page.locator(".blog-index-list a").nth(postIndex);
        await post.hover();
        const frames = await sampledFrames;
        await testInfo.attach(`preview-${postIndex}`, { body: JSON.stringify(frames), contentType: "application/json" });
        expect(Math.min(...frames.map((frame) => frame.coverage))).toBeGreaterThanOrEqual(0.995);
        expect(frames.every((frame) => frame.offsets.every((offset) => Math.abs(offset) < 0.01))).toBe(true);
        expect(frames.every((frame) => frame.opacities.filter((opacity) => opacity > 0.001).length <= 2)).toBe(true);
        expect(frames.every((frame) => frame.width === frames[0].width && frame.height === frames[0].height)).toBe(true);
        const hasIntermediateFrame = frames.some((frame) => frame.opacities.some((opacity) => opacity > 0.05 && opacity < 0.95));
        expect(hasIntermediateFrame).toBe(reducedMotion === "no-preference");
        await expect(post).toHaveClass(/is-active/);
        await expect(page.locator(".blog-console-story strong")).toHaveText(await post.locator("strong").innerText());
        await expect(page.locator(".blog-console-read")).toHaveAttribute("href", (await post.getAttribute("href"))!);
        await expect(page.locator(".blog-console-portrait figure.is-active")).toHaveAttribute("aria-hidden", "false");
        expect(frames.at(-1)!.opacities.filter((opacity) => opacity > 0.001)).toEqual([1]);
      }
      await page.screenshot({ path: testInfo.outputPath(`blog-preview-${theme}-${reducedMotion}.png`) });
    });
  }
}

test("brief pointer passes do not replace the preview and keyboard focus bypasses hover intent", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openBlog(page);
  const posts = page.locator(".blog-index-list a");
  await posts.nth(1).dispatchEvent("pointerenter", { pointerType: "mouse" });
  await posts.nth(1).dispatchEvent("pointerleave", { pointerType: "mouse" });
  await page.waitForTimeout(160);
  await expect(posts.first()).toHaveClass(/is-active/);
  await posts.nth(2).dispatchEvent("pointerenter", { pointerType: "mouse" });
  await posts.last().focus();
  await expect(posts.last()).toHaveClass(/is-active/);
  await page.waitForTimeout(600);
  await expect(posts.last()).toHaveClass(/is-active/);
  await posts.last().press("Enter");
  await expect(page).toHaveURL(/\/blog\/solo-delivery-boundaries$/);
});

test("rapid reversals keep a solid base and settle on the latest requested article", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openBlog(page);
  const posts = page.locator(".blog-index-list a");
  const sampledFrames = samplePreview(page, 1900);
  for (const postIndex of [1, 0, 2, 3, 4, 0]) {
    await posts.nth(postIndex).focus();
    await page.waitForTimeout(70);
  }
  const frames = await sampledFrames;
  await testInfo.attach("rapid-preview", { body: JSON.stringify(frames), contentType: "application/json" });
  expect(Math.min(...frames.map((frame) => frame.coverage))).toBeGreaterThanOrEqual(0.995);
  expect(frames.every((frame) => frame.opacities.filter((opacity) => opacity > 0.001).length <= 2)).toBe(true);
  await expect(posts.first()).toHaveClass(/is-active/);
  await expect(page.locator(".blog-console-portrait figure.is-active img")).toHaveAttribute("src", /grok-register-panel-\d+-[a-f0-9]+\.webp$/);
  expect(frames.at(-1)!.opacities.filter((opacity) => opacity > 0.001)).toEqual([1]);
});

test("a delayed cover keeps the current preview visible and cannot overwrite a newer selection", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  let releaseImage!: () => void;
  const imageGate = new Promise<void>((resolve) => { releaseImage = resolve; });
  await page.route("**/assets/project-covers/home-lab.webp", async (route) => {
    await imageGate;
    await route.continue();
  });
  try {
    await page.goto("/blog", { waitUntil: "domcontentloaded" });
    await expect.poll(() => page.locator(".blog-console-portrait img").first().evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator(".blog-console-visual")).toHaveCSS("opacity", "1");
    const posts = page.locator(".blog-index-list a");
    await posts.nth(1).focus();
    await page.waitForTimeout(450);
    await expect(posts.first()).toHaveClass(/is-active/);
    await expect(page.locator(".blog-console-portrait figure.is-active img")).toHaveAttribute("src", /grok-register-panel-\d+-[a-f0-9]+\.webp$/);
    await posts.nth(2).focus();
    await expect(posts.nth(2)).toHaveClass(/is-active/);
    releaseImage();
    await page.waitForTimeout(700);
    await expect(posts.nth(2)).toHaveClass(/is-active/);
    await expect(page.locator(".blog-console-portrait figure.is-active img")).toHaveAttribute("src", /408-web\.webp$/);
  } finally {
    releaseImage();
  }
});

test("a failed cover preserves the last image without blocking other articles", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/assets/project-covers/home-lab.webp", (route) => route.abort());
  await openBlog(page);
  const posts = page.locator(".blog-index-list a");
  await posts.nth(1).focus();
  await page.waitForTimeout(450);
  await expect(posts.first()).toHaveClass(/is-active/);
  await posts.nth(2).focus();
  await expect(posts.nth(2)).toHaveClass(/is-active/);
  expect(errors).toEqual([]);
});

test("touch entry does not trigger a hover preview or delay article navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openBlog(page);
  const posts = page.locator(".blog-index-list a");
  await posts.nth(1).dispatchEvent("pointerenter", { pointerType: "touch" });
  await page.waitForTimeout(150);
  await expect(posts.first()).toHaveClass(/is-active/);
  await posts.nth(1).click();
  await expect(page).toHaveURL(/\/blog\/home-server-as-a-product$/);
});
