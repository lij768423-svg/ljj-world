import { expect, test, type Page } from "@playwright/test";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const QA_DIR = process.env.MOBILE_QA_DIR
  ?? path.join(process.cwd(), "test-results", "mobile-qa");

const PUBLIC_ROUTES = [
  { path: "/", heading: "你好，我是 ljj", shot: "home" },
  { path: "/projects", heading: "项目索引", shot: "projects" },
  { path: "/projects/408", heading: "408 刷题库", shot: "project-408" },
  { path: "/projects/hermes-ios", heading: "Hermes for iOS", shot: "project-hermes-ios" },
  { path: "/projects/law-site", heading: "根旺律所数字站", shot: "project-law-site" },
  { path: "/projects/harmonyos", heading: "408 for HarmonyOS", shot: "project-harmonyos" },
  { path: "/projects/mineradio", heading: "Mineradio Web 适配", shot: "project-mineradio" },
  { path: "/systems", heading: "我的服务器", shot: "systems" },
  { path: "/about", heading: "关于我", shot: "about" },
  { path: "/desk", heading: "我的桌搭", shot: "desk" },
  { path: "/blog", heading: "文章与笔记", shot: "blog" },
  { path: "/blog/grok-register-panel", heading: "把批量注册做成可运维产品：Grok Register Panel", shot: "blog-article" },
] as const;

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "This suite covers the touch layout only.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-color-mode", "light");
    localStorage.setItem("portfolio-language", "zh");
    localStorage.setItem("portfolio-pointer-trail", "off");
  });
});

async function layoutAudit(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const limit = doc.clientWidth + 1;
    const offenders: Array<{ tag: string; cls: string; right: number; width: number }> = [];
    for (const element of document.querySelectorAll("body *")) {
      const box = element.getBoundingClientRect();
      if (box.width <= 1 || box.height <= 1) continue;
      if (box.right <= limit) continue;
      offenders.push({
        tag: element.tagName.toLowerCase(),
        cls: String((element as HTMLElement).className ?? "").slice(0, 96),
        right: Math.round(box.right),
        width: Math.round(box.width),
      });
      if (offenders.length >= 10) break;
    }
    return {
      overflow: doc.scrollWidth - doc.clientWidth,
      clientWidth: doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      offenders,
    };
  });
}

async function assertPhoneRoute(page: Page, route: (typeof PUBLIC_ROUTES)[number]) {
  await page.goto(route.path, { waitUntil: "networkidle" });
  if (route.path === "/projects") await page.locator(".project-card-link").first().waitFor();
  if (route.path === "/desk") {
    await expect(page.locator(".circular-gallery").first()).toHaveAttribute("data-intro-state", "complete", { timeout: 8_000 });
  }
  const heading = page.getByRole("heading", { level: 1 }).first();
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toContainText(route.heading);
  const audit = await layoutAudit(page);
  expect(audit.overflow, `${route.path} overflow ${audit.overflow} via ${JSON.stringify(audit.offenders)}`).toBeLessThanOrEqual(1);
  return audit;
}

async function scrollUnderHeader(page: Page, selector: string) {
  await page.evaluate((target) => {
    const node = document.querySelector<HTMLElement>(target);
    if (!node) return;
    const header = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 64;
    const rect = node.getBoundingClientRect();
    let scroller: HTMLElement | null = node.parentElement;
    while (scroller && scroller !== document.body) {
      const style = getComputedStyle(scroller);
      if (/(auto|scroll)/.test(style.overflowY) && scroller.scrollHeight > scroller.clientHeight + 1) break;
      scroller = scroller.parentElement;
    }
    if (scroller && scroller !== document.body && scroller !== document.documentElement) {
      scroller.scrollTop += rect.top - scroller.getBoundingClientRect().top - header - 12;
      return;
    }
    const root = document.scrollingElement ?? document.documentElement;
    root.scrollTo({ top: window.scrollY + rect.top - header - 12, behavior: "instant" as ScrollBehavior });
  }, selector);
}

async function waitForPaintedMedia(page: Page) {
  const arts = page.locator("[data-image-state]");
  if (await arts.count()) {
    await expect.poll(async () => arts.evaluateAll((nodes) => (
      nodes.every((node) => node.getAttribute("data-image-state") === "ready")
    )), { timeout: 8_000 }).toBe(true);
  }

  const failures = await page.evaluate(async () => {
    const scrolling = document.scrollingElement ?? document.documentElement;
    const origin = scrolling.scrollTop;
    const step = Math.max(240, Math.floor(window.innerHeight * 0.75));
    for (let top = 0; top <= scrolling.scrollHeight; top += step) {
      scrolling.scrollTo({ top, behavior: "instant" as ScrollBehavior });
    }

    const visibleImages = Array.from(document.images).filter((image) => {
      const box = image.getBoundingClientRect();
      return Boolean(image.src) && box.width >= 8 && box.height >= 8;
    });
    const failed: string[] = [];
    await Promise.all(visibleImages.map(async (image) => {
      image.loading = "eager";
      if (!image.complete) {
        await new Promise<void>((resolve, reject) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => reject(new Error(image.currentSrc || image.src)), { once: true });
        }).catch((error: Error) => {
          failed.push(`load ${error.message}`);
        });
      }
      if (image.naturalWidth <= 0) {
        failed.push(`empty ${image.currentSrc || image.src}`);
        return;
      }
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const context = canvas.getContext("2d");
      if (!context) {
        failed.push(`canvas ${image.currentSrc}`);
        return;
      }
      context.drawImage(image, 0, 0, 32, 32);
      const pixels = context.getImageData(0, 0, 32, 32).data;
      const tones = new Set<number>();
      let luminance = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        tones.add((pixels[index] >> 4 << 8) | (pixels[index + 1] >> 4 << 4) | (pixels[index + 2] >> 4));
        luminance += 0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2];
      }
      const mean = luminance / 1024;
      if (tones.size <= 6 && mean > 180) {
        failed.push(`gray ${image.currentSrc || image.className} uniq=${tones.size} mean=${mean.toFixed(1)}`);
      }
    }));

    for (const art of document.querySelectorAll("[data-image-state]")) {
      const state = art.getAttribute("data-image-state");
      if (state !== "ready") failed.push(`art ${art.getAttribute("data-service-art")} ${state}`);
      else if (!art.querySelector(".service-art-raster")) failed.push(`art ${art.getAttribute("data-service-art")} missing raster`);
    }

    scrolling.scrollTo({ top: origin, behavior: "instant" as ScrollBehavior });
    return failed;
  });

  expect(failures, failures.join("; ")).toEqual([]);
}

async function writeShot(page: Page, name: string, fullPage = true) {
  await waitForPaintedMedia(page);
  await mkdir(QA_DIR, { recursive: true });
  const filePath = path.join(QA_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage, animations: "disabled" });
  const info = await stat(filePath);
  expect(info.size, `${name}.png is empty`).toBeGreaterThan(2_000);
  return filePath;
}

test("mobile header controls remain touchable and menu navigation works", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const controls = page.locator(".nav-actions .github-link, .nav-actions .theme-switch:not(.trail-switch), .menu-toggle");
  const sizes = await controls.evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { width: box.width, height: box.height };
  }));
  expect(sizes).toHaveLength(3);
  expect(sizes.every(({ width, height }) => width >= 44 && height >= 44)).toBe(true);
  await expect(page.locator(".trail-switch")).toBeHidden();
  await expect(page.locator(".home-scene-rail")).toBeHidden();

  const menu = page.locator(".menu-toggle");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  const mobileNav = page.getByRole("navigation", { name: "移动端导航" });
  await expect(mobileNav).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: /桌搭展示/ })).toBeInViewport();
  await writeShot(page, "menu-open", false);
  await mobileNav.getByRole("link", { name: /全部项目/ }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("heading", { name: "项目索引" })).toBeVisible();
});

test("every public route is a phone layout without horizontal overflow", async ({ page }) => {
  const reports: unknown[] = [];
  for (const route of PUBLIC_ROUTES) {
    const audit = await assertPhoneRoute(page, route);
    reports.push({ path: route.path, ...audit });
  }
  await mkdir(QA_DIR, { recursive: true });
  await writeFile(path.join(QA_DIR, "route-audit.json"), `${JSON.stringify(reports, null, 2)}\n`);

  await page.goto("/", { waitUntil: "networkidle" });
  await scrollUnderHeader(page, "#home-about-title");
  await expect(page.locator("#home-about-title")).toBeVisible();
  expect(await page.locator("#home-about-title").evaluate((node) => node.getBoundingClientRect().top)).toBeGreaterThanOrEqual(64);
  await scrollUnderHeader(page, "#favorite-projects-title");
  await expect(page.locator("#favorite-projects-title")).toBeVisible();
  expect(await page.locator("#favorite-projects-title").evaluate((node) => node.getBoundingClientRect().top)).toBeGreaterThanOrEqual(64);
});

test("project cards navigate directly on touch", async ({ page }) => {
  await page.goto("/projects", { waitUntil: "networkidle" });
  const cards = page.locator(".project-card-link");
  await cards.first().waitFor();
  await expect(cards).toHaveCount(12);
  await cards.first().click();
  await expect(page).toHaveURL(/\/projects\/408$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("408 刷题库");
});

test("server categories and service details are touch-operable", async ({ page }) => {
  await page.goto("/systems", { waitUntil: "networkidle" });
  const story = page.locator(".server-mobile-story");
  await expect(story).toBeVisible();
  await expect(story.getByRole("heading", { name: "我的服务器" })).toBeVisible();
  await expect(story.getByRole("button")).toHaveCount(10);
  await expect(story.locator(".server-mobile-services > ul > li")).toHaveCount(5);

  await story.locator(".server-mobile-categories button").nth(1).click();
  await expect(story.getByRole("heading", { name: "Agent 与 AI" })).toBeVisible();
  await writeShot(page, "systems-category", true);
  await story.locator(".server-mobile-services > ul button").filter({ hasText: "Grok2API" }).click();
  await expect(story.locator(".server-mobile-service-detail h3")).toHaveText("Grok2API");
  await expect(story.locator(".server-mobile-service-detail")).toContainText("部署记录");
});

test("mobile theme switch persists without changing layout width", async ({ page }) => {
  await page.goto("/about", { waitUntil: "networkidle" });
  const themeSwitch = page.getByRole("switch", { name: "深色模式" });
  await themeSwitch.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(themeSwitch).toHaveAttribute("aria-checked", "true");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await themeSwitch.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("screenshot sweep records every public corner", async ({ page }) => {
  await mkdir(QA_DIR, { recursive: true });
  for (const route of PUBLIC_ROUTES) {
    await assertPhoneRoute(page, route);
    await writeShot(page, route.shot, route.path !== "/desk");
  }

  await page.goto("/", { waitUntil: "networkidle" });
  await scrollUnderHeader(page, "#home-about-title");
  await writeShot(page, "home-about", false);
  await scrollUnderHeader(page, "#favorite-projects-title");
  await writeShot(page, "home-favorites", false);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator(".menu-toggle").click();
  await expect(page.getByRole("navigation", { name: "移动端导航" }).getByRole("link").first()).toBeInViewport();
  await writeShot(page, "menu-open", false);
  await page.locator(".menu-toggle").click();

  await page.goto("/systems", { waitUntil: "networkidle" });
  await page.locator(".server-mobile-categories button").nth(1).click();
  await expect(page.getByRole("heading", { name: "Agent 与 AI" })).toBeVisible();
  await writeShot(page, "systems-category", true);

  await page.addInitScript(() => localStorage.setItem("portfolio-color-mode", "dark"));
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await writeShot(page, "home-dark", false);

  const required = [
    ...PUBLIC_ROUTES.map((route) => route.shot),
    "home-about",
    "home-favorites",
    "systems-category",
    "menu-open",
    "home-dark",
  ];
  for (const name of required) {
    const info = await stat(path.join(QA_DIR, `${name}.png`));
    expect(info.size, `${name}.png missing or empty`).toBeGreaterThan(2_000);
  }
});
