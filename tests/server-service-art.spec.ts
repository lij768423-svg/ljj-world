import { expect, test } from "@playwright/test";

const categories = [
  { trigger: "聚焦网络与入口模块", tab: "NETWORK", services: ["tailscale", "cloudflare", "caddy", "uptime-kuma", "network-probe"] },
  { trigger: "聚焦 GPU 与 AI 模块", tab: "AGENT", services: ["sub2api", "grok2api", "qwen38", "comfyui", "agent-console"] },
  { trigger: "聚焦 CPU 与内存模块", tab: "HARDWARE", services: ["cpu", "gpu", "nvme", "beszel", "hw-control"] },
  { trigger: "聚焦 NVMe 数据模块", tab: "DATA", services: ["immich", "paperless", "minio", "syncthing", "linkwarden"] },
  { trigger: "聚焦 Docker 容器模块", tab: "CONTAINERS", services: ["homepage", "vaultwarden", "memos", "stirling", "docker"] },
];

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-language", "zh");
    localStorage.setItem("portfolio-color-mode", "light");
    localStorage.setItem("portfolio-pointer-trail", "off");
  });
});

for (const theme of ["light", "dark"] as const) {
  test(`every service has its own readable drawing in ${theme}`, async ({ page }, testInfo) => {
    test.setTimeout(120000);
    await page.addInitScript(theme => localStorage.setItem("portfolio-color-mode", theme), theme);
    const mobile = testInfo.project.name === "mobile";
    if (!mobile) await page.setViewportSize({ width: 1440, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto("/systems", { waitUntil: "networkidle" });
    const drawings = new Set<string>();
    for (const category of categories) {
      if (mobile) {
        await page.locator(".server-mobile-categories").getByRole("button", { name: category.tab, exact: true }).click();
      } else {
        await page.locator(".server-story").getByRole("button", { name: category.trigger }).locator(".machine-module-action").click();
      }
      for (const [index, serviceId] of category.services.entries()) {
        if (mobile) await page.locator(".server-mobile-services ul button").nth(index).click();
        else await page.locator(".server-story-module-list button").nth(index).click();
        const artwork = page.locator(mobile ? ".server-mobile-service-detail .service-art" : ".server-story-service-page .service-art");
        await expect(artwork).toHaveAttribute("data-service-art", serviceId);
        await expect(artwork).toHaveAttribute("role", "img");
        await expect(artwork.locator("title")).not.toBeEmpty();
        const raster = artwork.locator(".service-art-raster");
        await expect(raster).toHaveCount(1);
        await expect(raster).toHaveAttribute("href", /\/assets\/service-art\/.+\.webp$/);
        await artwork.evaluate(async (node) => {
          const image = node.querySelector(".service-art-raster");
          const href = image?.getAttribute("href");
          if (!href) throw new Error("missing raster");
          await new Promise<void>((resolve, reject) => {
            const probe = new Image();
            probe.onload = () => resolve();
            probe.onerror = () => reject(new Error(href));
            probe.src = href;
          });
        });
        await artwork.scrollIntoViewIfNeeded();
        await expect(artwork).toBeInViewport();
        const paths = await artwork.locator(".service-art-objects").innerHTML();
        expect(drawings.has(paths)).toBe(false);
        drawings.add(paths);
        const size = await artwork.boundingBox();
        expect(size!.width).toBeGreaterThan(260);
        expect(size!.height).toBeGreaterThan(220);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        if (category.tab === "DATA" || serviceId === "gpu" || serviceId === "comfyui") {
          await page.screenshot({ path: testInfo.outputPath(`${serviceId}.png`) });
        }
        if (!mobile) {
          await page.locator(".server-story-service-back").click();
          await expect(page.locator(".server-story-focus-visual img")).toBeVisible();
        }
      }
      if (!mobile) {
        await page.locator(".server-story-stage").click({ position: { x: 720, y: 24 } });
        await expect(page.locator(".server-story")).toHaveAttribute("data-story-exploded", "false");
      }
    }
    expect(drawings.size).toBe(25);
    expect(errors).toEqual([]);
  });
}

test("official service marks load from local fingerprinted files", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Asset check only needs one viewport.");
  const { serviceMarks } = await import("../src/assets/serviceMarks");
  for (const [serviceId, path] of Object.entries(serviceMarks)) {
    expect(path).toMatch(/-[a-f0-9]{12}\.svg$/);
    const response = await page.request.get(path);
    expect(response.status(), serviceId).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/svg+xml");
    const content = await response.text();
    expect(content).toContain("<svg");
    expect(content).not.toMatch(/<script|<foreignObject|onload\s*=/i);
  }
});

test("service illustration transitions preserve navigation and keyboard access", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop keyboard navigation.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/systems", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "聚焦 NVMe 数据模块" }).focus();
  await page.getByRole("button", { name: "聚焦 NVMe 数据模块" }).press("Enter");
  const immich = page.getByRole("button", { name: "查看 Immich 介绍", exact: true });
  await immich.focus();
  await immich.press("Enter");
  await expect(page.locator('.server-story-service-page [data-service-art="immich"]')).toBeVisible();
  await expect(page.locator(".server-story-service-page-image")).toHaveCSS("opacity", "1");
  await expect(page.locator(".server-story-service-page-image")).toHaveCSS("transform", "none");
  await page.locator(".server-story-service-back").click();
  await expect(immich).toBeVisible();
  await page.getByRole("button", { name: "查看 Paperless-ngx 介绍", exact: true }).click();
  await expect(page.locator('.server-story-service-page [data-service-art="paperless"]')).toBeVisible();
  await expect(page.locator(".server-story-service-page-image")).toHaveCSS("opacity", "1");
  await expect(page.locator(".server-story-service-page .service-art")).toHaveCount(1);
  await expect(page.locator('.server-story-service-page [data-service-art="paperless"] .service-art-raster')).toHaveAttribute("href", /paperless-.+\.webp$/);
});
