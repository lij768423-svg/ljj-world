import { expect, test } from "@playwright/test";
import { mkdir, readFile, stat } from "node:fs/promises";
import { blogPosts } from "../src/blog";

const routes = [
  { path: "/", heading: "你好，我是 ljj", title: "lij768423-svg | 独立开发者" },
  { path: "/projects", heading: "项目索引", title: "项目索引 | lij768423-svg" },
  { path: "/projects/408", heading: "408 刷题库", title: "408 刷题库案例 | lij768423-svg" },
  { path: "/projects/hermes-ios", heading: "Hermes for iOS", title: "Hermes for iOS 案例 | lij768423-svg" },
  { path: "/projects/law-site", heading: "根旺律所数字站", title: "根旺律所数字站案例 | lij768423-svg" },
  { path: "/projects/harmonyos", heading: "408 for HarmonyOS", title: "408 for HarmonyOS 案例 | lij768423-svg" },
  { path: "/projects/mineradio", heading: "Mineradio Web 适配", title: "Mineradio Web 适配 | lij768423-svg" },
  { path: "/projects/grok-register-panel", heading: "Grok Register Panel", title: "Grok Register Panel | lij768423-svg" },
  { path: "/projects/codex-api", heading: "Codex API", title: "Codex API | lij768423-svg" },
  { path: "/projects/grok2api-egress-enhancements", heading: "Egress Quality Guard", title: "Egress Quality Guard | lij768423-svg" },
  { path: "/projects/writing-studio", heading: "Writing Studio", title: "Writing Studio | lij768423-svg" },
  { path: "/projects/hardware-control", heading: "Hardware Control", title: "Hardware Control | lij768423-svg" },
  { path: "/projects/tailscale-latency", heading: "Tailscale 延迟测试", title: "Tailscale 延迟测试 | lij768423-svg" },
  { path: "/projects/home-lab", heading: "Home Lab 基础设施", title: "Home Lab 基础设施 | lij768423-svg" },
  { path: "/systems", heading: "我的服务器", title: "我的服务器 | lij768423-svg" },
  { path: "/blog", heading: "文章与笔记", title: "文章与笔记 | lij768423-svg" },
  { path: "/about", heading: "关于我", title: "关于 | lij768423-svg" },
  { path: "/desk", heading: "我的桌搭", title: "我的桌搭 | lij768423-svg" },
] as const;

const flagshipRoutes = [
  {
    path: "/projects/408",
    heading: "408 刷题库",
    heroImage: "/assets/408-review-flow.webp",
    tourImages: [
      "/assets/408-quiz.webp",
      "/assets/408-feedback.webp",
      "/assets/408-ai.webp",
      "/assets/408-search.webp",
      "/assets/408-wiki.webp",
    ],
  },
  {
    path: "/projects/law-site",
    heading: "根旺律所数字站",
    heroImage: "/assets/law-home.webp",
    tourImages: [
      "/assets/law-services.webp",
      "/assets/law-cases.webp",
      "/assets/law-insights.webp",
      "/assets/law-article.webp",
      "/assets/law-consultation.webp",
    ],
  },
] as const;

const dossierRoutes = routes.filter((route) => (
  route.path.startsWith("/projects/")
  && !flagshipRoutes.some((flagship) => flagship.path === route.path)
));

test.beforeAll(async () => {
  await mkdir(".qa", { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("portfolio-language", "zh"));
});

test("home story has three usable scenes with separated artwork", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The home story is designed around a desktop viewport.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.locator(".home-story")).toHaveCSS("background-size", /40px 40px/);
  await expect(page.locator("[data-home-scene]")).toHaveCount(3);
  for (const scene of await page.locator('[data-home-scene="about"], [data-home-scene="projects"]').all()) {
    await expect(scene).not.toHaveCSS("background-size", "40px 40px");
  }
  await expect(page.locator('[data-line-ornaments="about"]')).toHaveCount(1);
  await expect(page.locator('[data-line-ornaments="projects"]')).toHaveCount(1);
  await expect(page.locator(".about-sticker")).toHaveCount(6);
  expect(await page.locator(".about-sticker img").evaluateAll((images) => (
    images.every((image) => !image.getAttribute("src"))
  ))).toBe(true);
  await expect(page.locator("[data-featured-project]")).toHaveCount(2);
  await expect(page.locator('[data-featured-project="grok-register-panel"] a')).toHaveAttribute("href", "https://github.com/lij768423-svg/grok-register-panel");
  await expect(page.locator('[data-featured-project="law-site"] a')).toHaveAttribute("href", "https://lawweb.hermesjj.com/");
  await expect(page.locator(".favorite-follow")).toHaveCount(0);

  const stackedEntry = await page.locator(".home-story").evaluate((story) => {
    const container = story as HTMLElement;
    container.scrollTop = container.clientHeight * 0.45;
    const storyBox = container.getBoundingClientRect();
    const introBox = container.querySelector<HTMLElement>('[data-home-scene="intro"]')!.getBoundingClientRect();
    const aboutBox = container.querySelector<HTMLElement>('[data-home-scene="about"]')!.getBoundingClientRect();
    return {
      introTop: introBox.top,
      storyTop: storyBox.top,
      storyBottom: storyBox.bottom,
      aboutTop: aboutBox.top,
    };
  });
  expect(stackedEntry.introTop).toBeLessThan(stackedEntry.storyTop - 1);
  expect(stackedEntry.aboutTop).toBeGreaterThan(stackedEntry.storyTop + 1);
  await expect(page.locator(".home-about-scene")).toHaveAttribute("data-stickers-ready", "false");

  const rail = page.getByRole("navigation", { name: "首页章节" });
  await rail.getByRole("button", { name: "关于" }).click();
  await expect(rail.getByRole("button", { name: "关于" })).toHaveClass(/is-active/);
  await expect(page.locator(".home-about-scene")).toHaveAttribute("data-stickers-ready", "true");

  const stickerGeometry = await page.locator(".about-sticker").evaluateAll((stickers) => {
    const boxes = stickers.map((sticker) => sticker.getBoundingClientRect());
    const overlap = (first: DOMRect, second: DOMRect) => Math.max(
      0,
      Math.min(first.right, second.right) - Math.max(first.left, second.left),
    ) * Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
    return {
      maxOverlap: Math.max(...boxes.flatMap((first, index) => boxes.slice(index + 1).map((second) => overlap(first, second)))),
      allVisible: boxes.every((box) => box.width > 0 && box.height > 0 && box.left >= 0 && box.right <= window.innerWidth),
    };
  });
  expect(stickerGeometry.maxOverlap).toBeLessThanOrEqual(1);
  expect(stickerGeometry.allVisible).toBe(true);

  const loadedStickers = await page.locator(".about-sticker img").evaluateAll((images) => images.map((image) => {
    const target = image as HTMLImageElement;
    return {
      loaded: target.complete && target.naturalWidth > 0,
      path: new URL(target.currentSrc).pathname,
    };
  }));
  expect(loadedStickers.every(({ loaded, path }) => loaded && path.endsWith("-480.webp"))).toBe(true);

  await rail.getByRole("button", { name: "项目" }).click();
  await expect(rail.getByRole("button", { name: "项目" })).toHaveClass(/is-active/);
  const favoriteFit = await page.locator(".home-story").evaluate((story) => {
    const scene = story.querySelector<HTMLElement>('[data-home-scene="projects"]')!;
    const cards = [...scene.querySelectorAll<HTMLElement>(".favorite-project")].map((card) => card.getBoundingClientRect());
    const sceneBox = scene.getBoundingClientRect();
    const view = story.getBoundingClientRect();
    return {
      sceneHeight: sceneBox.height,
      viewHeight: view.height,
      cardsFit: cards.every((card) => card.top >= sceneBox.top - 1 && card.bottom <= sceneBox.bottom + 1),
      bottomGap: sceneBox.bottom - Math.max(...cards.map((card) => card.bottom)),
    };
  });
  expect(favoriteFit.sceneHeight).toBeLessThanOrEqual(favoriteFit.viewHeight + 1);
  expect(favoriteFit.cardsFit).toBe(true);
  expect(favoriteFit.bottomGap).toBeGreaterThanOrEqual(36);
  const favoriteLinks = page.locator(".favorite-project-link");
  await expect(favoriteLinks).toHaveCount(2);
  for (const link of await favoriteLinks.all()) await expect(link).toBeVisible();
  await expect(favoriteLinks.nth(0)).toHaveAttribute("href", "https://github.com/lij768423-svg/grok-register-panel");
  await expect(favoriteLinks.nth(1)).toHaveAttribute("href", "https://lawweb.hermesjj.com/");
  for (const link of await favoriteLinks.all()) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");
  }
  const favoriteCovers = await page.locator(".favorite-project-media img").evaluateAll((images) => images.map((image) => {
    const target = image as HTMLImageElement;
    return {
      path: new URL(target.currentSrc).pathname,
      loaded: target.complete && target.naturalWidth > 0,
    };
  }));
  expect(favoriteCovers).toHaveLength(2);
  expect(favoriteCovers.every(({ path, loaded }) => path.startsWith("/assets/project-covers/") && loaded)).toBe(true);
});

test("home story keeps small wheel gestures continuous in both directions", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The home story is designed around a desktop viewport.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/", { waitUntil: "networkidle" });

  const story = page.locator(".home-story");
  await story.hover({ position: { x: 700, y: 500 } });
  await page.mouse.wheel(0, 120);
  await expect.poll(() => story.evaluate((element) => element.scrollTop)).toBeGreaterThan(40);

  const downwardPosition = await story.evaluate((element) => element.scrollTop);
  await page.mouse.wheel(0, -80);
  await expect.poll(() => story.evaluate((element) => element.scrollTop)).toBeLessThan(downwardPosition);
});

test("home scene rail returns to the introduction from the scroll boundary", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The home scene rail is desktop-only.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".home-entry-intro")).toHaveClass(/is-finished/, { timeout: 4500 });

  const story = page.locator(".home-story");
  const maxScroll = await story.evaluate((element) => element.scrollHeight - element.clientHeight);
  expect(maxScroll).toBeGreaterThan(1200);
  await story.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(() => story.evaluate((element) => element.scrollTop)).toBeGreaterThan(maxScroll - 2);

  const stickyOffsets = await story.locator("[data-home-scene]").evaluateAll((scenes) => (
    scenes.map((scene) => (scene as HTMLElement).offsetTop)
  ));
  expect(stickyOffsets).toHaveLength(3);
  expect(stickyOffsets[0]).toBeLessThan(stickyOffsets[1]);
  expect(stickyOffsets[1]).toBeLessThan(stickyOffsets[2]);

  const rail = page.getByRole("navigation", { name: "首页章节" });
  await rail.getByRole("button", { name: "介绍" }).click();
  await expect.poll(
    () => story.evaluate((element) => element.scrollTop),
    { timeout: 2200 },
  ).toBeLessThanOrEqual(1);
  await expect(rail.getByRole("button", { name: "介绍" })).toHaveClass(/is-active/);
});

test("about scene continues into projects with a light wheel", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The home story is designed around a desktop viewport.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/", { waitUntil: "networkidle" });

  const story = page.locator(".home-story");
  const rail = page.getByRole("navigation", { name: "首页章节" });
  await rail.getByRole("button", { name: "关于" }).click();

  const initial = await story.evaluate((element) => {
    const storyBox = element.getBoundingClientRect();
    const about = element.querySelector<HTMLElement>('[data-home-scene="about"]')!;
    const projects = element.querySelector<HTMLElement>('[data-home-scene="projects"]')!;
    return {
      aboutTop: about.offsetTop,
      scrollTop: element.scrollTop,
      projectGap: projects.getBoundingClientRect().top - storyBox.bottom,
    };
  });
  expect(initial.scrollTop).toBe(initial.aboutTop);
  expect(initial.projectGap).toBeGreaterThanOrEqual(-1);

  await story.hover({ position: { x: 700, y: 500 } });
  await page.mouse.wheel(0, 120);
  await expect.poll(() => story.evaluate((element) => element.scrollTop)).toBeGreaterThan(initial.aboutTop + 40);
  const after = await story.evaluate((element) => {
    const storyBox = element.getBoundingClientRect();
    const projects = element.querySelector<HTMLElement>('[data-home-scene="projects"]')!;
    return {
      projectGap: projects.getBoundingClientRect().top - storyBox.bottom,
    };
  });
  expect(after.projectGap).toBeLessThan(initial.projectGap);
  await expect(rail.getByRole("button", { name: "关于" })).toHaveClass(/is-active/);
});

test("all portfolio pages are direct, compact, and image-complete", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  for (const route of routes) {
    await page.goto(route.path, { waitUntil: "networkidle" });
    const mainHeading = page.getByRole("heading", { level: 1 });
    await expect(mainHeading).toHaveCount(1);
    await expect(mainHeading).toContainText(route.heading);
    await expect(page).toHaveTitle(route.title);

    const geometry = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      height: document.body.scrollHeight,
    }));
    expect(geometry.overflow, `${route.path} has horizontal overflow`).toBeLessThanOrEqual(1);
    if (testInfo.project.name === "desktop") {
      const heightBudget = route.path === "/systems" ? 8_500 : 5_000;
      expect(geometry.height, `${route.path} should remain a focused page`).toBeLessThan(heightBudget);
    }

    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < pageHeight; y += Math.floor(page.viewportSize()!.height * 0.72)) {
      await page.evaluate((scrollTop) => window.scrollTo(0, scrollTop), y);
      await page.waitForTimeout(45);
    }
    await expect.poll(
      () => page.locator("img").evaluateAll((images) => images.filter((image) => (
        (() => {
          if (!image.currentSrc && !image.getAttribute("src")) return false;
          const box = image.getBoundingClientRect();
          const intersectsViewport = box.width > 0
            && box.height > 0
            && box.bottom > 0
            && box.right > 0
            && box.top < window.innerHeight
            && box.left < window.innerWidth;
          return intersectsViewport && (!image.complete || image.naturalWidth === 0);
        })()
      )).length),
      { timeout: 10_000 },
    ).toBe(0);
  }
});

test("navigation, metadata, and browser history work across pages", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Primary navigation is desktop-only by design.");
  await page.goto("/");
  await expect(page.locator("html")).toHaveCSS("scrollbar-gutter", "stable");
  await expect(page.locator("html")).toHaveCSS("overflow-y", "scroll");
  await expect(page.getByRole("link", { name: "ljj.world 首页" })).toBeVisible();
  const primaryNav = page.getByRole("navigation", { name: "主要导航" });
  await expect(primaryNav.getByRole("link", { name: "首页" })).toHaveAttribute("aria-current", "page");

  await primaryNav.getByRole("link", { name: "项目" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(primaryNav.getByRole("link", { name: "项目" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "查看公开产品、客户交付、开发者工具与自托管系统。",
  );

  const quizRow = page.locator(".index-item").filter({ hasText: "408 刷题库" });
  const quizLink = quizRow.locator('a[href="/projects/408"]');
  await quizLink.focus();
  await page.keyboard.press("Enter");
  const quizPreview = page.getByRole("dialog");
  await expect(quizPreview).toBeVisible();
  await expect(quizPreview.getByRole("link", { name: /GitHub/ })).toBeVisible();
  await expect(quizPreview.getByRole("link", { name: /在线地址/ })).toBeVisible();
  await quizPreview.getByRole("button", { name: "关闭项目预览" }).click();
  await expect(page).toHaveURL(/\/projects$/);

  await primaryNav.getByRole("link", { name: "关于" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(primaryNav.getByRole("link", { name: "桌搭" })).toBeVisible();
  await primaryNav.getByRole("link", { name: "桌搭" }).click();
  await expect(page).toHaveURL(/\/desk$/);
  await expect(primaryNav.getByRole("link", { name: "桌搭" })).toHaveAttribute("aria-current", "page");
  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/desk$/);

  await page.goto("/missing");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("这个页面不存在。");
  await expect(page).toHaveTitle("页面不存在 | lij768423-svg");
  await expect(page.locator(".site-footer")).toHaveCount(0);

  await page.goto("/about");
  await expect(page.locator(".about-console")).toBeVisible();
  await expect(page.locator(".site-footer")).toHaveCount(0);
});

test("blog index previews articles and opens a readable article route", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The editorial blog index is desktop-led.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/blog", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { level: 1, name: "文章与笔记" })).toBeVisible();
  await expect(page.locator(".blog-console")).toBeVisible();

  const posts = page.locator(".blog-index-list a");
  await expect(posts).toHaveCount(blogPosts.length);
  const previewImages = page.locator(".blog-console-portrait img");
  await expect(previewImages).toHaveCount(1);
  await expect.poll(() => previewImages.evaluateAll((images) => images.every((image) => (
    (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0
  )))).toBe(true);

  await posts.nth(2).hover();
  await expect(posts.nth(2)).toHaveClass(/is-active/);
  await expect(page.locator(".blog-console-story strong")).toHaveText(blogPosts[2].title);
  await expect(page.locator(".blog-console-portrait figure.is-active img")).toHaveAttribute("alt", blogPosts[2].imageAlt);

  await posts.nth(1).click();
  await expect(page).toHaveURL(new RegExp(`/blog/${blogPosts[1].slug}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(blogPosts[1].title);
  await expect(page.locator(".blog-article-copy section")).toHaveCount(blogPosts[1].sections.length);
  await expect(page.getByRole("link", { name: "全部文章" })).toHaveAttribute("href", "/blog");
});

test("desk archive renders two independent circular galleries", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The desk archive is designed around a desktop viewport.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/about", { waitUntil: "networkidle" });

  const deskLink = page.getByRole("link", { name: /数码桌搭/ });
  await expect(deskLink).toBeVisible();
  await deskLink.click();
  await expect(page).toHaveURL(/\/desk$/);
  await expect(page.getByRole("heading", { level: 1, name: "我的桌搭" })).toBeVisible();
  await expect(page.locator('.desk-gallery-layout a[href="/about"]')).toHaveCount(0);
  const galleries = page.locator(".circular-gallery");
  await expect(galleries).toHaveCount(2);
  await expect(page.locator(".desk-gallery-scene-home .desk-gallery-scene-label strong")).toHaveText("HOME");
  await expect(page.locator(".desk-gallery-scene-school .desk-gallery-scene-label strong")).toHaveText("DORM");
  await expect(galleries.nth(0).locator("canvas")).toBeVisible();
  await expect(galleries.nth(1).locator("canvas")).toBeVisible();

  await expect(galleries.nth(0)).toHaveAttribute("data-resources-ready", "true");
  await expect(galleries.nth(1)).toHaveAttribute("data-resources-ready", "true");
  for (const index of [0, 1]) {
    const gallery = galleries.nth(index);
    const canvas = gallery.locator("canvas");
    const rendered = await gallery.screenshot();
    await canvas.evaluate((node) => { node.style.visibility = "hidden"; });
    const withoutCanvas = await gallery.screenshot();
    await canvas.evaluate((node) => { node.style.visibility = ""; });
    expect(rendered.equals(withoutCanvas)).toBe(false);
  }

  const homeGallery = galleries.nth(0);
  const schoolGallery = galleries.nth(1);
  const homeBefore = await homeGallery.screenshot();
  const schoolBefore = await schoolGallery.screenshot();
  const homeBox = await homeGallery.boundingBox();
  expect(homeBox).not.toBeNull();
  await page.mouse.move(homeBox!.x + homeBox!.width * 0.64, homeBox!.y + homeBox!.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(homeBox!.x + homeBox!.width * 0.36, homeBox!.y + homeBox!.height * 0.5, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(80);
  const homeAfter = await homeGallery.screenshot();
  const schoolAfter = await schoolGallery.screenshot();
  expect(homeAfter.equals(homeBefore)).toBe(false);
  expect(schoolAfter.equals(schoolBefore)).toBe(true);

  await schoolGallery.focus();
  const schoolKeyboardBefore = await schoolGallery.screenshot();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(50);
  const schoolKeyboardAfter = await schoolGallery.screenshot();
  expect(schoolKeyboardAfter.equals(schoolKeyboardBefore)).toBe(false);

  const geometry = await page.locator(".desk-gallery-layout").evaluate((archive) => {
    const box = archive.getBoundingClientRect();
    return {
      top: box.top,
      bottom: box.bottom,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bodyHeight: document.body.scrollHeight,
      viewportHeight: window.innerHeight,
    };
  });
  expect(geometry.top).toBeGreaterThanOrEqual(64);
  expect(geometry.bottom).toBeLessThanOrEqual(1000);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.bodyHeight).toBeLessThanOrEqual(geometry.viewportHeight + 1);
});

test("desk lightbox stays within its gallery group and supports every close path", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The desk lightbox is designed around a desktop viewport.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/desk", { waitUntil: "networkidle" });

  const homeGallery = page.locator(".desk-gallery-scene-home .circular-gallery");
  const homeBox = await homeGallery.boundingBox();
  expect(homeBox).not.toBeNull();
  await page.mouse.click(homeBox!.x + homeBox!.width * 0.5, homeBox!.y + homeBox!.height * 0.5);

  const lightbox = page.getByRole("dialog");
  await expect(lightbox).toBeVisible();
  await expect(lightbox).toHaveAttribute("data-desk-group", "home");
  await expect(lightbox.locator("img")).toHaveAttribute("src", /desk-2026-blue-1600\.webp$/);
  await expect(lightbox.locator(".desk-lightbox-meta")).toContainText("HOME");
  await expect(lightbox.locator(".desk-lightbox-meta")).toContainText("DISPLAY / PC");

  const firstSource = await lightbox.locator("img").getAttribute("src");
  await lightbox.getByRole("button", { name: "下一张" }).click();
  await expect(lightbox.locator("img")).not.toHaveAttribute("src", firstSource!);
  await expect(lightbox).toHaveAttribute("data-desk-group", "home");
  await page.keyboard.press("ArrowLeft");
  await expect(lightbox.locator("img")).toHaveAttribute("src", firstSource!);

  await page.keyboard.press("Escape");
  await expect(lightbox).toHaveCount(0);

  await page.mouse.click(homeBox!.x + homeBox!.width * 0.5, homeBox!.y + homeBox!.height * 0.5);
  await expect(lightbox).toBeVisible();
  await page.mouse.click(8, 500);
  await expect(lightbox).toHaveCount(0);
});

test("project DNA helix expands, keeps moving on hover, and unfolds into project summaries", async ({ page }, testInfo) => {
  await page.goto("/projects");
  const projectIndex = page.locator(".project-index");
  await expect(projectIndex).toHaveCSS("background-size", /40px 40px/);
  await expect(projectIndex.locator(".index-item")).toHaveCount(12);
  await expect(projectIndex.locator(".project-card-link")).toHaveCount(12);
  await expect(projectIndex.locator(".filter-bar")).toHaveCount(0);
  await expect(projectIndex.locator(".project-groups")).toHaveCount(0);
  await expect(projectIndex.locator(".project-group-heading")).toHaveCount(0);
  const cardLinks = projectIndex.locator(".project-card-link");
  const destinations = await cardLinks.evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(destinations).toHaveLength(12);
  expect(destinations.every((href) => href?.startsWith("/projects/"))).toBe(true);

  if (testInfo.project.name !== "desktop") {
    const mobileCoverSources = await projectIndex.locator(".project-card-media img").evaluateAll((images) => (
      images.map((image) => image.getAttribute("src"))
    ));
    expect(mobileCoverSources).toHaveLength(12);
    expect(mobileCoverSources.every((source) => source?.startsWith("/assets/project-covers/"))).toBe(true);
    const mobileRegisterPanelLink = projectIndex.locator(".index-item").filter({ hasText: "Grok Register Panel" }).getByRole("link");
    await mobileRegisterPanelLink.click();
    await expect(page).toHaveURL(/\/projects\/grok-register-panel$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Grok Register Panel");
    return;
  }

  const cardCovers = await projectIndex.locator(".project-card-media img").evaluateAll((images) => images.map((image) => {
    const target = image as HTMLImageElement;
    return {
      path: new URL(target.currentSrc).pathname,
      loaded: target.complete && target.naturalWidth > 0,
    };
  }));
  expect(cardCovers).toHaveLength(12);
  expect(cardCovers.every(({ path, loaded }) => path.startsWith("/assets/project-covers/") && loaded)).toBe(true);

  const quizLink = projectIndex.locator(".index-item").filter({ hasText: "408 刷题库" }).getByRole("link");
  await quizLink.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".project-paper-sheet")).toBeVisible();
  await expect(page.locator(".project-paper-sheet").getByRole("heading", { name: "408 刷题库" })).toBeVisible();
  await expect(page.locator(".project-paper-sheet").getByRole("link", { name: /GitHub/ })).toBeVisible();
  await expect(page.locator(".project-paper-enter")).toHaveCount(0);
  await page.getByRole("dialog").getByRole("button", { name: "关闭项目预览" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(cardLinks).toHaveCount(12);
  const helix = projectIndex.locator(".project-helix");
  await expect(helix.locator(".project-helix-axis-seed")).toHaveCount(1);
  await expect(helix.locator(".project-helix-axis-seed")).toHaveCSS("height", "4px");
  await expect(helix).toHaveAttribute("data-helix-entry", "line-to-dna");
  await expect(helix).toHaveAttribute("data-helix-sequence", "axis-bloom-live");
  await expect(helix).toHaveAttribute("data-helix-expanded", "true", { timeout: 4_000 });
  await expect(helix).toHaveAttribute("data-helix-stage", "live");
  await expect(helix).toHaveAttribute("data-helix-axis", "1.0000");
  await expect(helix).toHaveAttribute("data-helix-bloom", "1.0000");
  await expect(helix).toHaveAttribute("data-axis-seed-expired", "true");
  await expect(helix.locator(".project-helix-axis-seed")).toHaveCSS("visibility", "hidden");
  await expect(projectIndex.locator(".helix-node[data-helix-entry='1.000']")).toHaveCount(12);
  await expect(helix).toHaveAttribute("data-helix-phase", /\d/);
  await page.mouse.move(10, 20);
  const firstNode = projectIndex.locator(".helix-node").first();
  const phaseBefore = Number(await helix.getAttribute("data-helix-phase"));
  const transformBefore = await firstNode.evaluate((node) => getComputedStyle(node).transform);
  await page.waitForTimeout(450);
  const phaseAfter = Number(await helix.getAttribute("data-helix-phase"));
  const transformAfter = await firstNode.evaluate((node) => getComputedStyle(node).transform);
  expect(Math.abs(phaseAfter - phaseBefore)).toBeGreaterThan(0.04);
  expect(transformAfter).not.toBe(transformBefore);

  const helixCanvasHasPixels = await projectIndex.locator(".project-helix-canvas").evaluate((node) => {
    const canvas = node as HTMLCanvasElement;
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!context) return false;
    const pixels = new Uint8Array(context.drawingBufferWidth * context.drawingBufferHeight * 4);
    context.readPixels(
      0,
      0,
      context.drawingBufferWidth,
      context.drawingBufferHeight,
      context.RGBA,
      context.UNSIGNED_BYTE,
      pixels,
    );
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] > 0) return true;
    }
    return false;
  });
  expect(helixCanvasHasPixels).toBe(true);

  await page.mouse.move(720, 450);
  await expect(helix).toHaveAttribute("data-helix-paused", "false");
  const pointerPhase = Number(await helix.getAttribute("data-helix-phase"));
  await page.waitForTimeout(350);
  expect(Math.abs(Number(await helix.getAttribute("data-helix-phase")) - pointerPhase)).toBeGreaterThan(0.04);

  const stage = await page.evaluate(() => {
    const title = document.querySelector<HTMLElement>(".project-dna-heading")!;
    const helix = document.querySelector<HTMLElement>(".project-helix")!;
    const projectIndex = document.querySelector<HTMLElement>(".project-index")!;
    const titleBox = title.getBoundingClientRect();
    const helixBox = helix.getBoundingClientRect();
    const links = Array.from(document.querySelectorAll<HTMLElement>(".project-card-link"));
    const nodeScales = Array.from(document.querySelectorAll<HTMLElement>(".helix-node")).map((node) => (
      Number.parseFloat(node.style.getPropertyValue("--helix-scale"))
    ));
    const overlapArea = (first: DOMRect, second: DOMRect) => Math.max(
      0,
      Math.min(first.right, second.right) - Math.max(first.left, second.left),
    ) * Math.max(
      0,
      Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top),
    );
    const boxes = links.map((link) => link.getBoundingClientRect());
    const cardCenters = boxes.map((box) => {
      return {
        x: box.left + box.width / 2,
        y: box.top + box.height / 2,
      };
    });
    const pairOverlaps = boxes.flatMap((first, firstIndex) => boxes.slice(firstIndex + 1).map((second) => overlapArea(first, second)));
    const safetyOverlaps = boxes.flatMap((first, firstIndex) => boxes.slice(firstIndex + 1).map((second) => {
      const paddedFirst = new DOMRect(first.x - 8, first.y - 8, first.width + 16, first.height + 16);
      const paddedSecond = new DOMRect(second.x - 8, second.y - 8, second.width + 16, second.height + 16);
      return overlapArea(paddedFirst, paddedSecond);
    }));
    return {
      background: getComputedStyle(projectIndex).backgroundColor,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      maxTitleCardOverlap: Math.max(...links.map((link) => overlapArea(titleBox, link.getBoundingClientRect()))),
      maxCardOverlap: Math.max(...pairOverlaps),
      maxSafetyOverlap: Math.max(...safetyOverlaps),
      helixWidth: helixBox.width,
      viewportWidth: window.innerWidth,
      allInsideViewport: boxes.every((box) => box.left >= 0 && box.right <= window.innerWidth && box.top >= 72 && box.bottom <= window.innerHeight),
      allCentersClickable: links.every((link, index) => {
        const center = cardCenters[index];
        const target = document.elementFromPoint(center.x, center.y);
        return target === link || (target ? link.contains(target) : false);
      }),
      cardScaleSpread: Math.max(...nodeScales) - Math.min(...nodeScales),
      titleFontSize: Number.parseFloat(getComputedStyle(title.querySelector("h1")!).fontSize),
    };
  });
  expect(stage.background).toBe("rgba(0, 0, 0, 0)");
  expect(stage.bodyBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(stage.maxTitleCardOverlap).toBeLessThanOrEqual(1);
  expect(stage.maxCardOverlap).toBeLessThanOrEqual(1);
  expect(stage.maxSafetyOverlap).toBeLessThanOrEqual(1);
  expect(stage.helixWidth).toBeGreaterThan(stage.viewportWidth * 0.9);
  expect(stage.allInsideViewport).toBe(true);
  expect(stage.allCentersClickable).toBe(true);
  expect(stage.cardScaleSpread).toBeLessThanOrEqual(0.001);
  expect(stage.titleFontSize).toBeLessThanOrEqual(16);
  const firstCardBox = await cardLinks.first().boundingBox();
  expect(firstCardBox).not.toBeNull();
  await page.mouse.move(
    firstCardBox!.x + firstCardBox!.width / 2,
    firstCardBox!.y + firstCardBox!.height / 2,
  );
  await expect(helix).toHaveAttribute("data-helix-paused", "false");
  const hoverPhase = Number(await helix.getAttribute("data-helix-phase"));
  await page.waitForTimeout(350);
  expect(Math.abs(Number(await helix.getAttribute("data-helix-phase")) - hoverPhase)).toBeGreaterThan(0.04);
});

test("project dossiers stay complete and readable inside one desktop viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Project dossiers are designed around a desktop viewport.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 720 });

  for (const route of dossierRoutes) {
    await page.goto(route.path, { waitUntil: "networkidle" });
    const dossier = page.locator("[data-project-dossier]");
    await expect(dossier, `${route.path} should render the unified project dossier`).toBeVisible();
    await expect(dossier.getByRole("heading", { level: 1 })).toContainText(route.heading);
    await expect(dossier.getByRole("link", { name: "项目索引" })).toHaveAttribute("href", "/projects");

    const image = dossier.locator(".project-dossier-media img");
    const imageState = await image.evaluate(async (node) => {
      const target = node as HTMLImageElement;
      await target.decode();
      return { complete: target.complete, naturalWidth: target.naturalWidth };
    });
    expect(imageState.complete, `${route.path} image should finish loading`).toBe(true);
    expect(imageState.naturalWidth, `${route.path} image should decode`).toBeGreaterThan(0);

    const tablist = dossier.getByRole("tablist", { name: "项目说明视图" });
    const tabs = tablist.getByRole("tab");
    await expect(tabs).toHaveCount(3);
    await expect(tabs).toHaveText(["概览", "实现", "成果"]);
    const overviewTab = tablist.getByRole("tab", { name: "概览" });
    const buildTab = tablist.getByRole("tab", { name: "实现" });
    const resultTab = tablist.getByRole("tab", { name: "成果" });
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");

    const overviewSections = dossier.locator(".project-dossier-overview section");
    await expect(overviewSections).toHaveCount(3);
    const overviewCopy = await overviewSections.locator("p").allTextContents();
    expect(
      overviewCopy.every((copy) => copy.trim().length >= 20),
      `${route.path} overview should contain substantive problem, approach, and result copy`,
    ).toBe(true);

    await overviewTab.focus();
    await page.keyboard.press("ArrowRight");
    await expect(buildTab).toBeFocused();
    await expect(buildTab).toHaveAttribute("aria-selected", "true");
    await expect(dossier.locator(".project-dossier-build li")).toHaveCount(3);

    await page.keyboard.press("ArrowRight");
    await expect(resultTab).toBeFocused();
    await expect(resultTab).toHaveAttribute("aria-selected", "true");
    await expect(dossier.locator(".project-dossier-result dl > div")).toHaveCount(3);
    expect(await dossier.locator(".project-dossier-result-links").locator(":scope > *").count()).toBeGreaterThan(0);

    const adjacentLinks = dossier.getByRole("navigation", { name: "相邻项目" }).getByRole("link");
    await expect(adjacentLinks).toHaveCount(2);
    const adjacentDestinations = await adjacentLinks.evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(adjacentDestinations.every((href) => href?.startsWith("/projects/"))).toBe(true);

    const geometry = await page.evaluate(() => {
      const panelFrame = document.querySelector<HTMLElement>(".project-dossier-panel-frame")!;
      return {
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        documentOverflow: document.documentElement.scrollHeight - document.documentElement.clientHeight,
        bodyOverflow: document.body.scrollHeight - window.innerHeight,
        panelOverflow: panelFrame.scrollHeight - panelFrame.clientHeight,
      };
    });
    expect(geometry.horizontalOverflow, `${route.path} should not overflow horizontally`).toBeLessThanOrEqual(1);
    expect(geometry.documentOverflow, `${route.path} should fit one viewport`).toBeLessThanOrEqual(1);
    expect(geometry.bodyOverflow, `${route.path} body should fit one viewport`).toBeLessThanOrEqual(1);
    expect(geometry.panelOverflow, `${route.path} tab content should not be clipped`).toBeLessThanOrEqual(1);

    await page.keyboard.press("ArrowLeft");
    await expect(buildTab).toBeFocused();
    await expect(buildTab).toHaveAttribute("aria-selected", "true");
  }
});

test("flagship case studies pin all five interface steps before delivery", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Flagship case studies use a desktop overlay story.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });

  for (const route of flagshipRoutes) {
    await page.goto(route.path, { waitUntil: "networkidle" });
    const caseStudy = page.locator("[data-flagship-project]");
    await expect(caseStudy).toBeVisible();
    await expect(caseStudy.getByRole("heading", { level: 1 })).toContainText(route.heading);
    await expect(caseStudy.getByRole("link", { name: "项目索引" })).toHaveAttribute("href", "/projects");

    const heroImage = caseStudy.locator(".flagship-hero-figure > img");
    await expect(heroImage).toHaveAttribute("src", route.heroImage);
    const imageState = await heroImage.evaluate(async (node) => {
      const target = node as HTMLImageElement;
      await target.decode();
      return { complete: target.complete, naturalWidth: target.naturalWidth };
    });
    expect(imageState.complete).toBe(true);
    expect(imageState.naturalWidth).toBeGreaterThan(0);

    await expect(caseStudy.locator("[data-flagship-scene]")).toHaveCount(4);
    await expect(caseStudy.locator(".flagship-facts > div")).toHaveCount(4);
    await expect(caseStudy.locator(".flagship-flow-track > div")).toHaveCount(5);
    await expect(caseStudy.locator(".flagship-tour-steps button")).toHaveCount(5);
    await expect(caseStudy.locator(".flagship-decision-grid article")).toHaveCount(4);
    await expect(caseStudy.locator(".flagship-result-grid > div")).toHaveCount(4);

    const story = caseStudy.locator(".flagship-story");
    const rail = caseStudy.getByRole("navigation", { name: "项目案例章节" });
    await rail.getByRole("button", { name: "闭环" }).click();
    const flowGeometry = await page.evaluate(() => {
      const gridBox = document.querySelector<HTMLElement>(".flagship-problem-grid")!.getBoundingClientRect();
      const statementBox = document.querySelector<HTMLElement>(".flagship-statement > strong")!.getBoundingClientRect();
      const trackBox = document.querySelector<HTMLElement>(".flagship-flow-track")!.getBoundingClientRect();
      return {
        gridTop: gridBox.top,
        statementTop: statementBox.top,
        trackTop: trackBox.top,
      };
    });
    expect(Math.abs(flowGeometry.trackTop - flowGeometry.gridTop)).toBeLessThanOrEqual(1);
    expect(flowGeometry.statementTop - flowGeometry.gridTop).toBeLessThanOrEqual(90);

    await rail.getByRole("button", { name: "界面" }).click();
    await expect(rail.getByRole("button", { name: "界面" })).toHaveClass(/is-active/);

    const tourSteps = caseStudy.locator(".flagship-tour-steps button");
    const tourImage = caseStudy.locator(".flagship-tour-screen img");
    await expect(tourImage).toHaveCSS("padding", "0px");
    await expect(tourImage).toHaveCSS("object-fit", "cover");

    const storyHeight = await story.evaluate((element) => element.clientHeight);
    for (let shotIndex = 0; shotIndex < route.tourImages.length; shotIndex += 1) {
      await story.evaluate((element, top) => element.scrollTo({ top, behavior: "auto" }), storyHeight * (2 + shotIndex));
      await expect(tourSteps.nth(shotIndex)).toHaveClass(/is-active/);
      await expect(tourSteps.nth(shotIndex)).toHaveAttribute("aria-pressed", "true");
      await expect(tourImage).toHaveAttribute("src", route.tourImages[shotIndex]);
      await expect(rail.getByRole("button", { name: "界面" })).toHaveClass(/is-active/);

      const pinnedGeometry = await page.evaluate(() => {
        const storyBox = document.querySelector<HTMLElement>(".flagship-story")!.getBoundingClientRect();
        const pinBox = document.querySelector<HTMLElement>(".flagship-interface-pin")!.getBoundingClientRect();
        const deliveryBox = document.querySelector<HTMLElement>('[data-flagship-scene="delivery"]')!.getBoundingClientRect();
        return {
          pinTop: pinBox.top,
          storyTop: storyBox.top,
          storyBottom: storyBox.bottom,
          deliveryTop: deliveryBox.top,
        };
      });
      expect(Math.abs(pinnedGeometry.pinTop - pinnedGeometry.storyTop)).toBeLessThanOrEqual(1);
      expect(pinnedGeometry.deliveryTop).toBeGreaterThanOrEqual(pinnedGeometry.storyBottom - 1);
    }

    await story.evaluate((element, top) => element.scrollTo({ top, behavior: "auto" }), storyHeight * 7);
    await expect(rail.getByRole("button", { name: "交付" })).toHaveClass(/is-active/);

    await rail.getByRole("button", { name: "界面" }).click();
    await tourSteps.nth(2).click();
    await expect.poll(() => story.evaluate((element) => element.scrollTop)).toBeCloseTo(storyHeight * 4, 0);
    await expect(tourSteps.nth(2)).toHaveClass(/is-active/);
    await expect(tourImage).toHaveAttribute("src", route.tourImages[2]);

    await rail.getByRole("button", { name: "交付" }).click();
    await expect(rail.getByRole("button", { name: "交付" })).toHaveClass(/is-active/);
    const nextProject = caseStudy.locator(".flagship-next");
    await expect(nextProject).toHaveAttribute("href", /\/projects\//);

    const geometry = await page.evaluate(() => {
      const storyElement = document.querySelector<HTMLElement>(".flagship-story")!;
      const scenes = Array.from(document.querySelectorAll<HTMLElement>("[data-flagship-scene]"));
      return {
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        documentOverflow: document.documentElement.scrollHeight - document.documentElement.clientHeight,
        bodyOverflow: document.body.scrollHeight - window.innerHeight,
        storyOverflow: storyElement.scrollHeight - storyElement.clientHeight,
        storyHeight: storyElement.clientHeight,
        windowScrollY: window.scrollY,
        scenePositions: scenes.map((scene) => getComputedStyle(scene).position),
        sceneZIndexes: scenes.map((scene) => Number(getComputedStyle(scene).zIndex)),
        interfacePinPosition: getComputedStyle(document.querySelector<HTMLElement>(".flagship-interface-pin")!).position,
      };
    });
    expect(geometry.horizontalOverflow, `${route.path} should not overflow horizontally`).toBeLessThanOrEqual(1);
    expect(geometry.documentOverflow, `${route.path} document should fit one viewport`).toBeLessThanOrEqual(1);
    expect(geometry.bodyOverflow, `${route.path} body should fit one viewport`).toBeLessThanOrEqual(1);
    expect(geometry.storyOverflow, `${route.path} should keep scene travel inside the story`).toBeGreaterThan(geometry.storyHeight * 6.5);
    expect(geometry.windowScrollY, `${route.path} should not move the outer page`).toBe(0);
    expect(geometry.scenePositions).toEqual(["sticky", "sticky", "relative", "sticky"]);
    expect(geometry.interfacePinPosition).toBe("sticky");
    expect(geometry.sceneZIndexes).toEqual([1, 2, 3, 4]);

    await rail.getByRole("button", { name: "概览" }).click();
    await expect.poll(() => story.evaluate((element) => element.scrollTop)).toBeLessThanOrEqual(1);
  }
});

test("flagship interface centers its content and smoothly transitions between screens", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The interface tour uses a desktop overlay layout.");
  await page.setViewportSize({ width: 1720, height: 946 });
  await page.goto("/projects/408", { waitUntil: "networkidle" });

  const caseStudy = page.locator("[data-flagship-project]");
  const story = caseStudy.locator(".flagship-story");
  await story.evaluate((element) => element.scrollTo({ top: element.clientHeight * 2, behavior: "auto" }));
  await expect(caseStudy.locator(".flagship-tour-screen img").first()).toHaveAttribute("src", "/assets/408-quiz.webp");

  const centeredGeometry = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>(".flagship-interface-shell")!.getBoundingClientRect();
    const heading = document.querySelector<HTMLElement>(".flagship-interface-shell .flagship-section-heading")!.getBoundingClientRect();
    const tour = document.querySelector<HTMLElement>(".flagship-tour-layout")!.getBoundingClientRect();
    const contentCenter = (heading.top + tour.bottom) / 2;
    return {
      offset: Math.abs(contentCenter - (shell.top + shell.bottom) / 2),
      tourTop: tour.top,
      headingBottom: heading.bottom,
    };
  });
  expect(centeredGeometry.offset).toBeLessThanOrEqual(3);
  expect(centeredGeometry.tourTop - centeredGeometry.headingBottom).toBeLessThanOrEqual(30);

  const stepHeights = await caseStudy.locator(".flagship-tour-steps button").evaluateAll((buttons) => (
    buttons.map((button) => button.getBoundingClientRect().height)
  ));
  expect(Math.max(...stepHeights) - Math.min(...stepHeights)).toBeLessThanOrEqual(1);

  await caseStudy.locator('[data-tour-shot-index="1"]').evaluate((button) => (button as HTMLButtonElement).click());
  const tourImages = caseStudy.locator(".flagship-tour-screen img");
  await expect(tourImages).toHaveCount(2);
  await expect(tourImages.last()).toHaveAttribute("src", "/assets/408-feedback.webp");
  await expect(tourImages).toHaveCount(1, { timeout: 1_200 });
  await expect(tourImages).toHaveAttribute("src", "/assets/408-feedback.webp");
});

test("server story stays visual-only", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The exploded server story is desktop-first.");

  await page.goto("/systems");
  const topology = page.locator(".server-story");
  await expect(topology).toBeVisible();
  await expect(topology.locator('[data-line-ornaments="server"]')).toHaveCount(1);
  await expect(topology.locator(".topology-category, .topology-satellite, .server-story-panel, .server-story-nav")).toHaveCount(0);
  await expect(topology.locator(".server-three-canvas")).toHaveCount(0);
  await expect(topology.locator(".server-machine")).toHaveCount(1);
  await expect(topology.locator(".machine-module-hotspot")).toHaveCount(5);
  await expect(topology.locator(".machine-module-action")).toHaveCount(5);
  await expect(topology.locator(".machine-side-node")).toHaveCount(0);
  await topology.getByRole("button", { name: "聚焦 GPU 与 AI 模块" }).click();
  await expect(topology).toHaveAttribute("data-story-stage", "agent");
  await expect(topology).toHaveAttribute("data-story-exploded", "true");
  await expect(topology.getByRole("heading", { name: "Agent 与 AI" })).toBeVisible();
  await expect(topology.locator(".server-story-module-list li")).toHaveCount(5);
  await expect(topology.locator('.server-machine-gpu .machine-real-image[href*="gpu-line"]')).toHaveCSS("opacity", "1");
});

test("server story uses click-only focus and blank-space reset", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The exploded server story is desktop-first.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/systems", { waitUntil: "networkidle" });
  const story = page.locator(".server-story");
  await expect(story.locator(".server-machine")).toBeVisible();
  await expect(story).toHaveAttribute("data-story-exploded", "false");
  await expect(story).toHaveAttribute("data-story-overview-entry", "initial");
  await expect(story.locator(".machine-load-shell")).toHaveCSS("animation-name", "server-line-family-enter");
  const initialAnchor = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(".site-header")!.getBoundingClientRect();
    const stage = document.querySelector<HTMLElement>(".server-story-stage")!.getBoundingClientRect();
    return {
      headerBottom: header.bottom,
      stageTop: stage.top,
      scrollY: window.scrollY,
      scrollRange: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    };
  });
  expect(initialAnchor.stageTop).toBeCloseTo(initialAnchor.headerBottom, 0);
  expect(initialAnchor.scrollRange).toBe(0);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => window.scrollY)).toBe(initialAnchor.scrollY);
  await expect(story.locator(".machine-real-image")).toHaveCount(5);
  const gpuFan = story.locator(".machine-gpu-fan .machine-fan-rotor").first();
  await expect(gpuFan).toHaveCSS("animation-name", "server-fan-spin");
  // The visual-only overview slows the GPU fans (ServerMachineVisual.css).
  await expect(gpuFan).toHaveCSS("animation-duration", "6s");
  const fanRotationBefore = await gpuFan.evaluate((node) => getComputedStyle(node).rotate);
  await page.waitForTimeout(160);
  const fanRotationAfter = await gpuFan.evaluate((node) => getComputedStyle(node).rotate);
  expect(fanRotationAfter).not.toBe(fanRotationBefore);

  await story.getByRole("button", { name: "聚焦 GPU 与 AI 模块" }).click();
  await expect(story).toHaveAttribute("data-story-stage", "agent");
  const connectors = story.locator(".server-story-service-connectors > g");
  const firstServiceNode = story.locator(".server-story-module-list > li").first();
  expect(await firstServiceNode.evaluate((node) => Number.parseFloat(getComputedStyle(node).opacity))).toBeLessThan(0.5);
  // Connectors are fitted to the illustration's outline, so their exact geometry depends on the
  // module and viewport; every service still gets a drawn connector ending in an anchor.
  await expect(connectors).toHaveCount(5);
  await expect(story.locator(".server-story-connector-anchor")).toHaveCount(5);
  await expect.poll(
    () => connectors.first().evaluate((group) => [...group.querySelectorAll(":scope > line")].reduce((length, line) => length + Math.hypot(
      Number(line.getAttribute("x2")) - Number(line.getAttribute("x1")),
      Number(line.getAttribute("y2")) - Number(line.getAttribute("y1")),
    ), 0)),
    { timeout: 2500 },
  ).toBeGreaterThan(4);
  await expect.poll(
    () => firstServiceNode.evaluate((node) => Number.parseFloat(getComputedStyle(node).opacity)),
    { timeout: 2500 },
  ).toBeGreaterThan(0.98);
  await page.waitForTimeout(850);
  await expect(story.getByRole("heading", { name: "Agent 与 AI" })).toBeVisible();
  await expect(story.locator(".server-story-module-list > li")).toHaveCount(5);
  await expect(story.locator('.server-machine-gpu .machine-real-image[href*="gpu-line"]')).toHaveCSS("opacity", "1");
  await story.locator(".server-machine-gpu .machine-real-image").dispatchEvent("click");
  await expect(story).toHaveAttribute("data-story-stage", "agent");
  await expect(story).toHaveAttribute("data-story-exploded", "true");
  const geometry = await story.evaluate((node) => {
    const stage = node.querySelector<HTMLElement>(".server-story-stage")!.getBoundingClientRect();
    const visual = node.querySelector<HTMLElement>(".server-story-visual")!.getBoundingClientRect();
    return {
      stageTop: stage.top,
      stageBottom: stage.bottom,
      visualTop: visual.top,
      visualBottom: visual.bottom,
    };
  });
  expect(geometry.stageTop).toBeCloseTo(69, 0);
  expect(geometry.stageBottom).toBeCloseTo(1000, 0);
  expect(geometry.visualTop).toBeCloseTo(geometry.stageTop, 0);
  expect(geometry.visualBottom).toBeCloseTo(geometry.stageBottom, 0);
  await story.locator(".server-story-stage").click({ position: { x: 720, y: 24 } });
  await expect(story).toHaveAttribute("data-story-exploded", "false");
  await expect(story).toHaveAttribute("data-story-overview-entry", "return");
  await expect(story.locator(".machine-load-shell")).toHaveCSS("animation-name", "none");
  await expect(story.locator(".server-machine-gpu .machine-component-fill").first()).toHaveCSS("animation-name", "none");
  await expect(story.getByRole("heading", { level: 2, name: "我的服务器" })).toBeVisible();

  await story
    .getByRole("button", { name: "聚焦 CPU 与内存模块" })
    .locator(".machine-module-hit")
    .click({ position: { x: 20, y: 60 } });
  await expect(story).toHaveAttribute("data-story-stage", "hardware");
  await expect(story).toHaveAttribute("data-story-exploded", "true");
});

test("all server modules expose complete deployment details", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The exploded server story is desktop-first.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/systems", { waitUntil: "networkidle" });

  const story = page.locator(".server-story");
  const modules = [
    { trigger: "聚焦网络与入口模块", services: ["Tailscale", "Cloudflare Tunnel", "Caddy", "Uptime Kuma", "延迟探针"] },
    { trigger: "聚焦 CPU 与内存模块", services: ["Ryzen 9 9950X", "RTX 4090", "5.4 TB NVMe", "Beszel / Netdata", "硬件控制"] },
    { trigger: "聚焦 GPU 与 AI 模块", services: ["Sub2API", "Grok2API", "Qwen 3.8 27B", "ComfyUI", "Agent Console"] },
    { trigger: "聚焦 NVMe 数据模块", services: ["Immich", "Paperless-ngx", "MinIO", "Syncthing", "Linkwarden"] },
    { trigger: "聚焦 Docker 容器模块", services: ["Homepage", "Vaultwarden", "Memos", "Stirling PDF", "Docker"] },
  ] as const;

  let linkedEntries = 0;
  for (const module of modules) {
    await story.getByRole("button", { name: module.trigger }).press("Enter");
    await expect(story.locator(".server-story-module-list > li")).toHaveCount(5);

    for (const serviceName of module.services) {
      await story.getByRole("button", { name: `查看 ${serviceName} 介绍` }).click();
      const servicePage = story.locator(".server-story-service-page");
      const details = servicePage.locator(".server-story-service-details");
      await expect(servicePage.locator("h2")).toHaveText(serviceName);
      await expect(details.locator(":scope > div")).toHaveCount(3);
      await expect(details.locator("dd")).toHaveCount(3);
      for (const value of await details.locator("dd").all()) {
        await expect(value).toHaveText(/\S+/);
      }

      const visibleCopy = await servicePage.innerText();
      expect(visibleCopy).not.toMatch(/内容待补充|链接待补充|TODO|placeholder/i);
      expect(visibleCopy).not.toMatch(/[—–]/);

      const entryLink = details.locator('[data-service-detail="entry"] a');
      if (await entryLink.count()) {
        linkedEntries += 1;
        await expect(entryLink).toHaveAttribute("href", /^https?:\/\//);
      }

      if (serviceName === "MinIO") {
        const deployment = details.locator('[data-service-detail="deployment"]');
        await expect(deployment).toContainText("S3 API");
        await expect(deployment).toContainText("管理控制台");
        await expect(deployment).not.toContainText(/\b\d{4,5}\b/);
        await expect(entryLink).toHaveCount(0);
        await expect(details.locator('[data-service-detail="entry"]')).toContainText("仅 Tailnet 内可用");
      }

      await servicePage.locator(".server-story-service-back").click();
    }

    await story.locator(".server-story-stage").click({ position: { x: 720, y: 24 }, force: true });
    await expect(story).toHaveAttribute("data-story-exploded", "false");
  }

  expect(linkedEntries).toBe(2);
});

test("theme and overlay menu persist across navigation", async ({ page }) => {
  await page.goto("/");
  const themeSwitch = page.getByRole("switch", { name: "深色模式" });
  const portrait = page.locator(".hero-portrait-image");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect.poll(() => portrait.evaluate((image) => (image as HTMLImageElement).currentSrc)).toContain("virtual-developer-avatar-dark");
  const lightPortraitLayout = await portrait.evaluate((image) => {
    const style = getComputedStyle(image);
    return { objectFit: style.objectFit, objectPosition: style.objectPosition, transform: style.transform };
  });
  await themeSwitch.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => portrait.evaluate((image) => (image as HTMLImageElement).currentSrc)).toContain("virtual-developer-avatar-dark");
  await expect.poll(() => portrait.evaluate((image) => {
    const style = getComputedStyle(image);
    return { objectFit: style.objectFit, objectPosition: style.objectPosition, transform: style.transform };
  })).toEqual(lightPortraitLayout);

  await page.getByRole("button", { name: "打开导航" }).click();
  const menu = page.getByRole("navigation", { name: "移动端导航" });
  await expect(menu.getByRole("link")).toHaveCount(6);
  await menu.getByRole("link", { name: /我的服务器/ }).click();
  await expect(page).toHaveURL(/\/systems$/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await themeSwitch.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("sensitive internal captures are not shipped", async () => {
  for (const file of [
    "public/assets/agent-console.webp",
    "public/assets/law-dashboard.webp",
    "public/assets/law-workbench.webp",
  ]) {
    const exists = await stat(file).then(() => true, () => false);
    expect(exists, `${file} should not exist`).toBe(false);
  }

  const applicationSource = await readFile("src/App.tsx", "utf8");
  expect(applicationSource).not.toMatch(/\b100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])(?:\.\d{1,3}){2}\b/);
  expect(applicationSource).not.toMatch(/\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2})\b/);
  expect(applicationSource).not.toMatch(/\/(?:home|data)\//);
});

test("home introduction and generated portrait remain stable", async ({ page }, testInfo) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const boxes = await page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>(".hero")!;
    const header = document.querySelector<HTMLElement>(".site-header")!;
    const h1 = document.querySelector<HTMLElement>("h1")!;
    const identity = document.querySelector<HTMLElement>(".identity")!;
    const summary = document.querySelector<HTMLElement>(".hero-summary")!;
    const actions = document.querySelector<HTMLElement>(".hero-actions")!;
    const portrait = document.querySelector<HTMLImageElement>(".hero-portrait-image")!;
    const portraitBox = portrait.getBoundingClientRect();
    const statementLines = Array.from(document.querySelectorAll<HTMLElement>(".hero-line"));
    return {
      headerBottom: header.getBoundingClientRect().bottom,
      heroTop: hero.getBoundingClientRect().top,
      bodyHeight: document.body.scrollHeight,
      viewportHeight: window.innerHeight,
      actionsBottom: actions.getBoundingClientRect().bottom,
      h1Width: h1.scrollWidth,
      h1ClientWidth: h1.clientWidth,
      identityVisible: identity.getBoundingClientRect().height > 0,
      wrappedStatementLines: statementLines.filter((line) => {
        const lineHeight = Number.parseFloat(getComputedStyle(line).lineHeight);
        return line.getBoundingClientRect().height > lineHeight * 1.15;
      }).length,
      projectCardCount: document.querySelectorAll(".hero-project-card").length,
      portraitLoaded: portrait.complete
        && portrait.naturalWidth > 0
        && portrait.currentSrc.includes("virtual-developer-avatar"),
      portraitTop: portraitBox.top,
      portraitBottom: portraitBox.bottom,
    };
  });

  expect(boxes.heroTop).toBeGreaterThanOrEqual(boxes.headerBottom - 1);
  expect(boxes.h1Width).toBeLessThanOrEqual(boxes.h1ClientWidth + 1);
  expect(boxes.identityVisible).toBe(true);
  expect(boxes.projectCardCount).toBe(0);
  expect(boxes.portraitLoaded).toBe(true);

  if (testInfo.project.name === "desktop") {
    expect(boxes.wrappedStatementLines).toBe(0);
    expect(boxes.bodyHeight).toBeLessThanOrEqual(boxes.viewportHeight + 1);
    expect(boxes.actionsBottom).toBeLessThanOrEqual(boxes.viewportHeight);
    expect(boxes.portraitTop).toBeGreaterThanOrEqual(boxes.headerBottom - 1);
    expect(boxes.portraitBottom).toBeLessThanOrEqual(boxes.viewportHeight + 1);
  }

  test.skip(testInfo.project.name !== "desktop", "Portrait video is desktop-only.");
  await expect(page.locator(".home-entry-intro")).toHaveClass(/is-finished/, { timeout: 4500 });
  await page.mouse.move(1120, 180);
  await page.waitForTimeout(150);
  await expect(page.locator(".hero-portrait-loop")).toHaveAttribute("data-loop-ready", "true");
  await expect(page.locator(".hero-portrait-live")).toHaveCount(0);
});

test("about page loads with grouped motion and a bounded animation budget", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The about console is a desktop-first single-screen composition.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/about", { waitUntil: "networkidle" });

  await expect(page.locator(".about-console-portrait img")).toBeVisible();
  await expect(page.locator(".about-blur-character")).toHaveCount(0);
  await expect(page.locator(".about-blur-text")).toHaveCount(28);
  await page.waitForTimeout(1_400);

  const motionBudget = await page.evaluate(() => ({
    animatedTextGroups: [...document.querySelectorAll<HTMLElement>(".about-blur-text")]
      .filter((element) => getComputedStyle(element).animationName !== "none").length,
    runningAnimations: document.getAnimations()
      .filter((animation) => animation.playState === "running").length,
  }));
  expect(motionBudget.animatedTextGroups).toBe(28);
  expect(motionBudget.runningAnimations).toBeLessThanOrEqual(12);
});
