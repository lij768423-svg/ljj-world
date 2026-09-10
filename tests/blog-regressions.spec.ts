import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Viewport coverage is explicit in this suite.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-language", "en");
    localStorage.setItem("portfolio-color-mode", "light");
    localStorage.setItem("portfolio-pointer-trail", "off");
  });
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1024, height: 600 },
  { width: 1280, height: 500 },
  { width: 820, height: 650 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
  { width: 720, height: 450 },
]) {
  test(`blog content remains reachable at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/blog", { waitUntil: "networkidle" });
    await expect(page.locator(".blog-index-list a")).toHaveCount(5);
    await page.screenshot({ path: testInfo.outputPath("blog-before-scroll.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

    const readLink = page.locator(".blog-console-read");
    await readLink.scrollIntoViewIfNeeded();
    const linkBox = await readLink.boundingBox();
    expect(linkBox).not.toBeNull();
    expect(linkBox!.height).toBeGreaterThanOrEqual(44);
    expect(linkBox!.y + linkBox!.height).toBeLessThanOrEqual(viewport.height + 1);
    const unobscured = await readLink.evaluate((link) => {
      const bounds = link.getBoundingClientRect();
      const target = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      return target !== null && link.contains(target);
    });
    expect(unobscured).toBe(true);

    const lastPost = page.locator(".blog-index-list a").last();
    await lastPost.focus();
    await expect(lastPost).toBeInViewport();
    await expect(lastPost).toHaveClass(/is-active/);
    const listBox = await page.locator(".blog-index-list").boundingBox();
    expect(listBox!.height).toBeGreaterThan(60);
  });
}

test("article section counts are fully translated", async ({ page }, testInfo) => {
  await page.goto("/blog/home-server-as-a-product", { waitUntil: "networkidle" });
  const sectionCount = page.locator(".blog-article-meta > span").last();
  await page.screenshot({ path: testInfo.outputPath("article-meta.png"), fullPage: false });
  await expect(sectionCount).toContainText("3 sections");
  await expect(sectionCount).not.toContainText("节");
  await page.getByRole("button", { name: "切换为中文" }).click();
  await expect(sectionCount).toContainText("3 节");
});

for (const language of ["zh", "en"] as const) {
  for (const theme of ["light", "dark"] as const) {
    test(`blog ${language} ${theme} preview stays consistent and keyboard-operable`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.addInitScript(({ savedLanguage, savedTheme }) => {
        localStorage.setItem("portfolio-language", savedLanguage);
        localStorage.setItem("portfolio-color-mode", savedTheme);
      }, { savedLanguage: language, savedTheme: theme });
      await page.goto("/blog", { waitUntil: "networkidle" });
      const post = page.locator(".blog-index-list a").nth(2);
      await post.focus();
      await expect(post).toHaveClass(/is-active/);
      await expect(page.locator(".blog-console-story strong")).toHaveText(await post.locator("strong").innerText());
      await expect(page.locator(".blog-console-read")).toHaveAttribute("href", await post.getAttribute("href") as string);
      await expect(page.locator(".blog-console-portrait figure.is-active")).toHaveAttribute("aria-hidden", "false");
      await expect(page.locator(".blog-field-pulse-top")).toHaveCSS("animation-name", "none");
      await page.screenshot({ path: testInfo.outputPath(`blog-${language}-${theme}.png`), fullPage: true });
      await post.press("Enter");
      await expect(page).toHaveURL(/\/blog\/ai-study-workflow$/);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.locator("html")).toHaveAttribute("data-language", language);
      expect(errors).toEqual([]);
    });
  }
}

test("article deep links work with animation and malformed anchors remain safe", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const section = "home-server-as-a-product-自建真正带来的东西";
  await page.goto(`/blog/home-server-as-a-product#${encodeURIComponent(section)}`, { waitUntil: "networkidle" });
  await expect(page.locator(`[id="${section}"]`)).toBeInViewport();
  await page.goto("/blog/home-server-as-a-product#%E0%A4%A", { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".blog-article-header h1")).toBeInViewport();
  expect(errors).toEqual([]);
});

test("article deep links open the requested section", async ({ page }) => {
  const section = "home-server-as-a-product-自建真正带来的东西";
  await page.goto(`/blog/home-server-as-a-product#${encodeURIComponent(section)}`, { waitUntil: "networkidle" });
  await expect(page.locator(`[id="${section}"]`)).toBeInViewport();
  await expect(page.locator(`.blog-article-aside a[href="#${section}"]`)).toHaveAttribute("aria-current", "true");
});

test("server diagram agrees with the hardware description", async ({ page }) => {
  await page.goto("/systems", { waitUntil: "networkidle" });
  await expect(page.locator(".server-machine")).toBeVisible();
  await expect(page.locator(".server-machine")).toContainText("ATX / X870E / LINUX");
  await expect(page.locator(".server-machine")).not.toContainText("mATX");
});
