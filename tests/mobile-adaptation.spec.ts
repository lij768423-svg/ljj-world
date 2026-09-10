import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "This suite covers the touch layout only.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-color-mode", "light");
    localStorage.setItem("portfolio-language", "zh");
    localStorage.setItem("portfolio-pointer-trail", "off");
  });
});

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

  const menu = page.locator(".menu-toggle");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  const mobileNav = page.getByRole("navigation", { name: "移动端导航" });
  await expect(mobileNav).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: /桌搭展示/ })).toBeVisible();
  await mobileNav.getByRole("link", { name: /全部项目/ }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("heading", { name: "项目索引" })).toBeVisible();
});

test("mobile routes reflow without horizontal overflow", async ({ page }) => {
  const routes = [
    { path: "/", heading: "你好，我是 ljj" },
    { path: "/projects", heading: "项目索引" },
    { path: "/projects/408", heading: "408 刷题库" },
    { path: "/systems", heading: "我的服务器" },
    { path: "/blog", heading: "文章与笔记" },
    { path: "/about", heading: "关于我" },
  ];

  for (const route of routes) {
    await page.goto(route.path, { waitUntil: "networkidle" });
    if (route.path === "/projects") await page.locator(".project-card-link").first().waitFor();
    await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(route.heading);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${route.path} has horizontal overflow`).toBeLessThanOrEqual(1);
  }

  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator("#about-me").scrollIntoViewIfNeeded();
  await expect(page.locator("#home-about-title")).toBeVisible();
  await page.locator("#featured-projects").scrollIntoViewIfNeeded();
  await expect(page.locator("#favorite-projects-title")).toBeVisible();
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
