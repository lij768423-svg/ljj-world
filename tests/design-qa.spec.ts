import { expect, test, type Browser, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

async function openPortfolio(
  browser: Browser,
  viewport: { width: number; height: number },
  theme: "light" | "dark",
) {
  const context = await browser.newContext({
    viewport,
    colorScheme: theme,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const consoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await page.addInitScript((savedTheme) => {
    window.localStorage.setItem("portfolio-color-mode", savedTheme);
  }, theme);

  return { context, page, consoleErrors };
}

async function captureRoute(page: Page, route: string, path: string) {
  await page.goto(route, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  if (route === "/projects") await expect(page.locator(".project-helix")).toBeVisible();
  await page.locator("img[src]").evaluateAll(async (images) => {
    const visibleImages = images.filter((image) => {
      const target = image as HTMLImageElement;
      const box = target.getBoundingClientRect();
      return Boolean(target.currentSrc)
        && box.width > 0
        && box.height > 0
        && box.right > 0
        && box.bottom > 0
        && box.left < window.innerWidth
        && box.top < window.innerHeight;
    });
    await Promise.all(visibleImages.map((image) => (image as HTMLImageElement).decode()));
  });
  await page.screenshot({ path, fullPage: false });
}

test("capture multi-page desktop visual QA states", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The portfolio is desktop-first.");
  test.setTimeout(90_000);
  await mkdir(".qa", { recursive: true });

  const desktop = await openPortfolio(browser, { width: 1440, height: 1000 }, "light");
  await captureRoute(desktop.page, "/", ".qa/final-home.png");

  const desktopRail = desktop.page.getByRole("navigation", { name: "首页章节" });
  await desktopRail.getByRole("button", { name: "关于" }).click();
  await expect(desktopRail.getByRole("button", { name: "关于" })).toHaveClass(/is-active/);
  await expect(desktop.page.locator(".home-about-scene")).toHaveAttribute("data-stickers-ready", "true");
  await desktop.page.screenshot({ path: ".qa/final-home-about.png", fullPage: false });
  await desktopRail.getByRole("button", { name: "项目" }).click();
  await expect(desktopRail.getByRole("button", { name: "项目" })).toHaveClass(/is-active/);
  await desktop.page.screenshot({ path: ".qa/final-home-favorites.png", fullPage: false });
  await desktopRail.getByRole("button", { name: "介绍" }).click();
  await expect(desktopRail.getByRole("button", { name: "介绍" })).toHaveClass(/is-active/);

  await desktop.page.getByRole("button", { name: "打开导航" }).click();
  const menu = desktop.page.getByRole("navigation", { name: "移动端导航" });
  await expect(menu.getByRole("link", { name: /全部项目/ })).toBeVisible();
  await expect(menu.getByRole("link", { name: /我的服务器/ })).toBeVisible();
  await desktop.page.screenshot({ path: ".qa/final-menu-desktop.png", fullPage: false });
  await desktop.page.getByRole("button", { name: "关闭导航" }).click();

  await captureRoute(desktop.page, "/projects", ".qa/final-projects.png");
  await captureRoute(desktop.page, "/projects/408", ".qa/final-study-case.png");
  await captureRoute(desktop.page, "/projects/hermes-ios", ".qa/final-ios-case.png");
  await captureRoute(desktop.page, "/projects/law-site", ".qa/final-law-case.png");
  await captureRoute(desktop.page, "/projects/harmonyos", ".qa/final-harmony-case.png");
  await captureRoute(desktop.page, "/projects/agent-console", ".qa/final-agent-console-case.png");
  await captureRoute(desktop.page, "/projects/codex-api", ".qa/final-codex-api-case.png");
  await captureRoute(desktop.page, "/systems", ".qa/final-systems.png");

  const topology = desktop.page.locator(".server-story");
  await topology.getByRole("button", { name: "聚焦 GPU 与 AI 模块" }).click();
  await expect(topology.locator(".server-story-module-list li")).toHaveCount(5);
  await expect(topology.getByRole("heading", { name: "Agent 与 AI" })).toBeVisible();
  await desktop.page.screenshot({ path: ".qa/final-server-agent-topology.png", fullPage: false });
  await desktop.page.goto("/systems", { waitUntil: "networkidle" });
  await topology.getByRole("button", { name: "聚焦 CPU 与内存模块" }).click();
  await expect(topology.locator(".server-story-module-list li")).toHaveCount(5);
  await expect(topology.getByRole("heading", { name: "硬件与算力" })).toBeVisible();
  await desktop.page.screenshot({ path: ".qa/final-server-hardware-topology.png", fullPage: false });

  await captureRoute(desktop.page, "/about", ".qa/final-about.png");
  expect(desktop.consoleErrors).toEqual([]);
  await desktop.context.close();

  const shortDesktop = await openPortfolio(browser, { width: 1280, height: 720 }, "light");
  await shortDesktop.page.goto("/", { waitUntil: "networkidle" });
  const shortGeometry = await shortDesktop.page.evaluate(() => {
    const cta = document.querySelector<HTMLElement>(".hero-actions")!;
    const lines = Array.from(document.querySelectorAll<HTMLElement>(".hero-statement > span"));
    return {
      ctaBottom: cta.getBoundingClientRect().bottom,
      bodyHeight: document.body.scrollHeight,
      viewportHeight: window.innerHeight,
      wrappedStatementLines: lines.filter((line) => {
        const lineHeight = Number.parseFloat(getComputedStyle(line).lineHeight);
        return line.getBoundingClientRect().height > lineHeight * 1.15;
      }).length,
    };
  });
  expect(shortGeometry.ctaBottom).toBeLessThanOrEqual(720);
  expect(shortGeometry.bodyHeight).toBeLessThanOrEqual(shortGeometry.viewportHeight + 1);
  expect(shortGeometry.wrappedStatementLines).toBe(0);
  await shortDesktop.page.screenshot({ path: ".qa/final-home-short.png", fullPage: false });

  await shortDesktop.page.goto("/projects", { waitUntil: "networkidle" });
  const firstProjectCard = shortDesktop.page.locator(".project-card-link").first();
  await expect(firstProjectCard).toBeVisible();
  const firstProjectCardBox = await firstProjectCard.boundingBox();
  expect(firstProjectCardBox).not.toBeNull();
  expect(firstProjectCardBox!.y).toBeLessThan(720);
  await shortDesktop.page.screenshot({ path: ".qa/final-projects-short.png", fullPage: false });
  expect(shortDesktop.consoleErrors).toEqual([]);
  await shortDesktop.context.close();

  const dark = await openPortfolio(browser, { width: 1440, height: 1000 }, "dark");
  await captureRoute(dark.page, "/", ".qa/final-home-dark.png");
  const darkRail = dark.page.getByRole("navigation", { name: "首页章节" });
  await darkRail.getByRole("button", { name: "关于" }).click();
  await expect(darkRail.getByRole("button", { name: "关于" })).toHaveClass(/is-active/);
  await expect(dark.page.locator(".home-about-scene")).toHaveAttribute("data-stickers-ready", "true");
  await dark.page.screenshot({ path: ".qa/final-home-about-dark.png", fullPage: false });
  await darkRail.getByRole("button", { name: "项目" }).click();
  await expect(darkRail.getByRole("button", { name: "项目" })).toHaveClass(/is-active/);
  await dark.page.screenshot({ path: ".qa/final-home-favorites-dark.png", fullPage: false });
  await captureRoute(dark.page, "/projects", ".qa/final-projects-dark.png");
  await captureRoute(dark.page, "/systems", ".qa/final-systems-dark.png");
  const darkTopology = dark.page.locator(".server-story");
  await darkTopology.getByRole("button", { name: "聚焦 Docker 容器模块" }).click();
  await expect(darkTopology.locator(".server-story-module-list li")).toHaveCount(5);
  await expect(darkTopology.getByRole("heading", { name: "容器与日常工具" })).toBeVisible();
  await dark.page.screenshot({ path: ".qa/final-server-containers-dark.png", fullPage: false });

  await dark.page.goto("/", { waitUntil: "networkidle" });
  const secondaryContrast = await dark.page.locator(".button-secondary").first().evaluate((button) => {
    const parse = (value: string) => value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
    const luminance = (rgb: number[]) => {
      const channels = rgb.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const style = getComputedStyle(button);
    const foreground = luminance(parse(style.color));
    const background = luminance(parse(style.backgroundColor));
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  expect(secondaryContrast).toBeGreaterThanOrEqual(4.5);
  expect(dark.consoleErrors).toEqual([]);
  await dark.context.close();
});
