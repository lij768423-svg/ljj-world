import { expect, test } from "@playwright/test";

const article = "/blog/two-desk-setups";

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Explicit article viewport coverage.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-language", "zh");
    localStorage.setItem("portfolio-color-mode", "light");
    localStorage.setItem("portfolio-pointer-trail", "off");
  });
});

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 820, height: 1180 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
]) {
  test(`article reading layout at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto(article, { waitUntil: "networkidle" });
    await expect(page.locator(".blog-article-header h1")).toBeVisible();
    await expect(page.locator(".blog-article-cover img")).toHaveJSProperty("complete", true);
    const metrics = await page.evaluate(() => {
      const bounds = (selector: string) => {
        const rect = document.querySelector(selector)!.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right };
      };
      return {
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        header: bounds(".blog-article-header"),
        cover: bounds(".blog-article-cover"),
        frame: bounds(".blog-article-cover-frame"),
        body: bounds(".blog-article-body"),
        intro: bounds(".blog-article-intro"),
        aside: bounds(".blog-article-aside"),
        image: bounds(".blog-article-cover img"),
      };
    });
    expect(metrics.overflow).toBe(false);
    expect(metrics.body.width).toBeLessThanOrEqual(761);
    expect(metrics.frame.height).toBeLessThan(320);
    expect(Math.abs(metrics.image.height - metrics.frame.height)).toBeLessThan(3);
    if (viewport.width > 980) {
      expect(metrics.cover.x).toBeGreaterThan(metrics.header.right);
      expect(metrics.intro.y).toBeLessThan(viewport.height - 80);
      expect(metrics.aside.x).toBeGreaterThan(metrics.body.right);
      await expect(page.locator(".blog-article-aside-card")).toHaveJSProperty("open", true);
    } else {
      await expect(page.locator(".blog-article-aside-card")).toHaveJSProperty("open", false);
      expect(metrics.aside.bottom).toBeLessThanOrEqual(metrics.body.y);
    }
    if (viewport.width <= 760) expect(metrics.cover.y).toBeGreaterThan(metrics.header.bottom);
    await page.screenshot({ path: testInfo.outputPath("article-top.png"), fullPage: false });
    await page.locator(".blog-article-footer").scrollIntoViewIfNeeded();
    await expect(page.locator(".blog-article-footer")).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

for (const language of ["zh", "en"] as const) {
  for (const theme of ["light", "dark"] as const) {
    test(`all article titles and covers fit in ${language} ${theme}`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.addInitScript(({ language, theme }) => {
        localStorage.setItem("portfolio-language", language);
        localStorage.setItem("portfolio-color-mode", theme);
      }, { language, theme });
      for (const slug of ["grok-register-panel", "home-server-as-a-product", "ai-study-workflow", "two-desk-setups", "solo-delivery-boundaries"]) {
        await page.goto(`/blog/${slug}`, { waitUntil: "networkidle" });
        await expect(page.locator(".blog-article-cover img")).toHaveJSProperty("complete", true);
        await expect(page.locator(".blog-article-intro")).toBeInViewport();
        await expect(page.locator(".blog-article-aside summary")).toContainText(language === "zh" ? "本文内容" : "In this article");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`${slug}.png`) });
      }
      expect(errors).toEqual([]);
    });
  }
}

test("contents stays beside the body and tracks reading in both directions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/blog/grok-register-panel", { waitUntil: "networkidle" });
  const sections = page.locator(".blog-article-copy section");
  const entries = page.locator(".blog-article-aside nav a");
  for (const index of [0, 1, 2, 1, 0]) {
    await sections.nth(index).evaluate(section => section.scrollIntoView({ block: "start", behavior: "instant" }));
    await expect(entries.nth(index)).toHaveAttribute("aria-current", "true");
    const aside = await page.locator(".blog-article-aside").boundingBox();
    expect(aside!.y).toBeGreaterThanOrEqual(90);
    expect(aside!.y).toBeLessThanOrEqual(110);
    await expect(entries.nth(index)).toBeInViewport();
  }
  await entries.last().click();
  await expect(sections.last()).toBeInViewport();
  await expect(entries.last()).toHaveAttribute("aria-current", "true");
});

test("mobile contents is keyboard-operable and adapts on resize", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(article, { waitUntil: "networkidle" });
  const contents = page.locator(".blog-article-aside-card");
  await contents.locator("summary").focus();
  await contents.locator("summary").press("Enter");
  await expect(contents).toHaveJSProperty("open", true);
  await contents.locator("nav a").last().click();
  await expect(page.locator(".blog-article-copy section").last()).toBeInViewport();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(contents).toHaveJSProperty("open", true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(contents).toHaveJSProperty("open", false);
});

test("moving to another article resets the active contents entry", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(article, { waitUntil: "networkidle" });
  await page.locator(".blog-article-copy section").last().evaluate(section => section.scrollIntoView());
  await expect(page.locator(".blog-article-aside nav a").last()).toHaveAttribute("aria-current", "true");
  await page.locator(".blog-pager-link.is-next").click();
  await expect(page).toHaveURL(/\/blog\/solo-delivery-boundaries$/);
  await expect(page.locator(".blog-article-aside nav a").first()).toHaveAttribute("aria-current", "true");
  await expect(page.locator(".blog-article-header")).toBeInViewport();
});
