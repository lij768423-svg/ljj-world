import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`server overview returns smoothly in ${theme} with ${reducedMotion} motion`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "This covers the desktop exploded server overview.");
      test.setTimeout(45_000);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.emulateMedia({ reducedMotion });
      await page.addInitScript((savedTheme) => {
        localStorage.setItem("portfolio-language", "zh");
        localStorage.setItem("portfolio-color-mode", savedTheme);
        localStorage.setItem("portfolio-pointer-trail", "off");
      }, theme);
      await page.goto("/systems", { waitUntil: "networkidle" });
      const story = page.locator(".server-story");
      const overview = story.locator(".server-story-overview-copy");
      await expect(overview).toHaveCSS("opacity", "1");

      for (const trigger of [
        "聚焦 GPU 与 AI 模块",
        "聚焦 CPU 与内存模块",
        "聚焦 NVMe 数据模块",
        "聚焦 Docker 容器模块",
        "聚焦网络与入口模块",
      ]) {
        await story.getByRole("button", { name: trigger }).locator(".machine-module-action").click();
        await expect(story).toHaveAttribute("data-story-exploded", "true");
        await expect(overview).toHaveCount(0);
        await expect(story.locator(".server-story-focus-heading")).toHaveCSS("opacity", "1");

        const sampledFrames = story.evaluate((element) => new Promise<Array<{ time: number; opacity: number; y: number }>>((resolve) => {
          const observer = new MutationObserver(() => {
            if (element.getAttribute("data-story-exploded") !== "false") return;
            const copy = element.querySelector<HTMLElement>(".server-story-overview-copy");
            if (!copy) return;
            observer.disconnect();
            const startedAt = performance.now();
            const frames: Array<{ time: number; opacity: number; y: number }> = [];
            const sample = () => {
              const style = getComputedStyle(copy);
              frames.push({
                time: performance.now() - startedAt,
                opacity: Number.parseFloat(style.opacity),
                y: new DOMMatrixReadOnly(style.transform).m42,
              });
              if (performance.now() - startedAt < 850) requestAnimationFrame(sample);
              else resolve(frames);
            };
            sample();
          });
          observer.observe(element, { attributes: true, attributeFilter: ["data-story-exploded"], childList: true, subtree: true });
        }));

        await story.locator(".server-story-stage").click({ position: { x: 720, y: 24 } });
        const frames = await sampledFrames;
        await testInfo.attach(`${trigger}-${theme}-${reducedMotion}`, {
          body: JSON.stringify(frames),
          contentType: "application/json",
        });
        if (reducedMotion === "reduce") {
          expect(frames.every((frame) => frame.opacity === 1 && frame.y === 0)).toBe(true);
        } else {
          expect(frames[0].opacity).toBeLessThan(0.15);
          expect(frames.some((frame) => frame.opacity > 0.1 && frame.opacity < 0.95)).toBe(true);
          expect(frames.some((frame) => frame.y > 1)).toBe(true);
        }
        expect(frames.at(-1)!.opacity).toBe(1);
        expect(frames.at(-1)!.y).toBe(0);
        await expect(story).toHaveAttribute("data-story-overview-entry", "return");
        await expect(story.locator(".machine-load-shell")).toHaveCSS("animation-name", "none");
        await expect(overview.getByRole("heading", { name: "我的服务器" })).toBeVisible();
        await expect(overview.locator(".server-story-overview-facts > div")).toHaveCount(4);
      }
    });
  }
}
