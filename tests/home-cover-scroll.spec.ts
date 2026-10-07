import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`home links scroll within the story with ${reducedMotion} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.addInitScript(() => {
      localStorage.setItem("portfolio-language", "zh");
      localStorage.setItem("portfolio-pointer-trail", "off");
    });
    await page.goto("/", { waitUntil: "networkidle" });
    const story = page.locator(".home-story");
    await expect(story).toHaveAttribute("aria-busy", "false", { timeout: 8000 });
    for (const [hash, targetId] of [["#about-me", "about-me"], ["#featured-projects", "featured-projects"]]) {
      await story.evaluate(element => {
        element.scrollTo({ top: 0, behavior: "instant" });
        window.scrollTo({ top: 0, behavior: "instant" });
      });
      const link = page.locator(`.hero-actions a[href="${hash}"]`);
      await link.focus();
      const samples = story.evaluate((element) => new Promise<number[]>(resolve => {
        const frames: number[] = [];
        const started = performance.now();
        const sample = () => {
          frames.push(getComputedStyle(element).overflowY === "visible" ? window.scrollY : element.scrollTop);
          if (performance.now() - started < 1800) requestAnimationFrame(sample);
          else resolve(frames);
        };
        sample();
      }));
      await page.keyboard.press("Enter");
      const frames = await samples;
      const target = await story.evaluate((element, id) => {
        const section = document.getElementById(id)!;
        if (getComputedStyle(element).overflowY === "visible") {
          const margin = Number.parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
          return Math.min(section.getBoundingClientRect().top + window.scrollY - margin, document.documentElement.scrollHeight - innerHeight);
        }
        return Math.min(section.offsetTop, element.scrollHeight - element.clientHeight);
      }, targetId);
      expect(Math.abs(frames.at(-1)! - target)).toBeLessThan(2);
      if (reducedMotion === "no-preference") {
        expect(frames.filter(position => position > 5 && position < target - 5).length).toBeGreaterThan(4);
      } else {
        expect(frames.every(position => position < 2 || Math.abs(position - target) < 2)).toBe(true);
      }
      await expect(page).toHaveURL(new RegExp(`${hash}$`));
    }
  });
}

test("featured covers fill their cards at wide and narrow sizes", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("portfolio-language", "zh"));
  const viewports = testInfo.project.name === "desktop"
    ? [{ width: 1720, height: 872 }, { width: 1440, height: 1000 }, { width: 1024, height: 768 }]
    : [{ width: 390, height: 844 }];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("#featured-projects").evaluate(element => element.scrollIntoView());
    for (const card of await page.locator(".favorite-project").all()) {
      const image = card.locator(".favorite-project-media img");
      await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      const boxes = await image.evaluate(element => ({
        image: element.getBoundingClientRect().toJSON(),
        media: element.parentElement!.getBoundingClientRect().toJSON(),
        card: element.closest(".favorite-project-link")!.getBoundingClientRect().toJSON(),
      }));
      expect(Math.abs(boxes.media.width - boxes.card.width)).toBeLessThan(2);
      expect(boxes.image.left).toBeLessThanOrEqual(boxes.media.left + 1);
      expect(boxes.image.right).toBeGreaterThanOrEqual(boxes.media.right - 1);
      expect(boxes.image.bottom).toBeGreaterThanOrEqual(boxes.media.bottom - 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
});
