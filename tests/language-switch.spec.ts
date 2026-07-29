import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("language-test-initialized")) return;
    sessionStorage.setItem("language-test-initialized", "true");
    localStorage.removeItem("portfolio-language");
    localStorage.setItem("portfolio-color-mode", "light");
    localStorage.setItem("portfolio-pointer-trail", "off");
  });
});

test("English is the default and DecryptedText scrambles into persisted Chinese", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The full kinetic language transition is tested on desktop.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".home-entry-intro")).toHaveClass(/is-finished/, { timeout: 4500 });

  const languageButton = page.getByRole("button", { name: "切换为中文" });
  const homeLink = page.locator(".desktop-nav a").first();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("data-language", "en");
  await expect(homeLink).toHaveText("Home");
  await expect(page.locator("#hero-title .sr-only").first()).toHaveText("lij768423-svg / Independent developer");
  await expect(page.locator(".hero-statement .sr-only").first()).toHaveText("Hi, I'm ljj.");
  await expect(page.locator(".hero-statement .sr-only").last()).toHaveText("I turn ideas into lasting products.");
  await expect(page.locator(".hero-summary")).toContainText("learning products");
  const initialTypography = await page.locator(".hero-statement").evaluate((statement) => ({
    fontSize: getComputedStyle(statement.parentElement!).fontSize,
    scaleX: new DOMMatrixReadOnly(getComputedStyle(statement.lastElementChild!).transform).a,
    lineWidths: [...statement.querySelectorAll<HTMLElement>(".hero-line")]
      .map((line) => line.getBoundingClientRect().width),
  }));
  expect(initialTypography.fontSize).toBe("37.6px");
  expect(initialTypography.scaleX).toBeGreaterThan(0.999);
  expect(await page.evaluate(() => {
    const copy = document.querySelector<HTMLElement>(".hero-copy")!.getBoundingClientRect();
    const line = [...document.querySelectorAll<HTMLElement>(".hero-line")].at(-1)!.getBoundingClientRect();
    return line.right <= copy.right - 32;
  })).toBe(true);
  await expect(languageButton).toBeVisible();
  await languageButton.focus();
  await page.keyboard.press("Enter");

  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.locator("html")).toHaveAttribute("data-language", "zh");
  await page.waitForTimeout(250);
  expect(await homeLink.textContent()).not.toBe("Home");
  expect(await homeLink.textContent()).not.toBe("首页");
  const transitionLineSamples = await page.locator(".hero-statement").evaluate(async (statement) => {
    const samples: Array<{ widths: number[]; opacities: number[] }> = [];
    const lines = [...statement.querySelectorAll<HTMLElement>(".hero-line")];
    while (document.documentElement.dataset.languageTransitioning === "true") {
      samples.push({
        widths: lines.map((line) => line.getBoundingClientRect().width),
        opacities: lines.map((line) => Number.parseFloat(getComputedStyle(line).opacity)),
      });
      await new Promise<number>(requestAnimationFrame);
    }
    return samples;
  });

  await expect(homeLink).toHaveText("首页", { timeout: 1200 });
  await expect(page.locator(".hero-statement .sr-only").first()).toHaveText("你好，我是 ljj。");
  await page.waitForTimeout(320);
  const finalTypography = await page.locator(".hero-statement").evaluate((statement) => ({
    fontSize: getComputedStyle(statement.parentElement!).fontSize,
    scaleX: new DOMMatrixReadOnly(getComputedStyle(statement.lastElementChild!).transform).a,
    lineWidths: [...statement.querySelectorAll<HTMLElement>(".hero-line")]
      .map((line) => line.getBoundingClientRect().width),
  }));
  expect(finalTypography.fontSize).toBe(initialTypography.fontSize);
  expect(finalTypography.scaleX).toBeGreaterThan(0.999);
  initialTypography.lineWidths.forEach((_, lineIndex) => {
    const opacitySamples = transitionLineSamples.map((sample) => sample.opacities[lineIndex]);
    expect(Math.min(...opacitySamples)).toBeLessThan(0.08);
  });
  await expect.poll(() => page.evaluate(() => localStorage.getItem("portfolio-language"))).toBe("zh");

  await page.getByRole("navigation", { name: "主要导航" }).getByRole("link", { name: "项目" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("heading", { name: "项目索引" })).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-language", "zh");
  await expect(page.getByRole("button", { name: "Switch to English" })).toBeVisible();

  await page.getByRole("button", { name: "Switch to English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".desktop-nav a").first()).toHaveText("Home", { timeout: 1200 });
});

test("reduced motion switches language without running the scramble loop", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: "切换为中文" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-language", "zh");
  await expect(page.locator("html")).not.toHaveAttribute("data-language-transitioning", "true");
  await expect(page.getByRole("button", { name: "Switch to English" })).toBeVisible();
  expect(await page.locator(".nav-shell").evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
});

test("DecryptedText stays stable on pointer hover", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Pointer hover is covered on desktop.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".home-entry-intro")).toHaveClass(/is-finished/, { timeout: 4500 });
  await page.locator("#featured-projects").scrollIntoViewIfNeeded();

  const title = page.locator("#favorite-projects-title .decrypted-text-display");
  await expect(title).toHaveText("Selected projects");
  await title.hover();
  await page.waitForTimeout(180);
  await expect(title).toHaveText("Selected projects");
  await page.waitForTimeout(520);
  await expect(title).toHaveText("Selected projects");
});

test("English follows every primary route and newly mounted content", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Primary route copy is audited at the desktop composition.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  for (const route of ["/projects", "/systems", "/desk", "/about"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("data-language", "en");
    await page.waitForTimeout(route === "/systems" || route === "/desk" ? 900 : 250);

    const visibleChinese = await page.evaluate(() => {
      const han = /[\u3400-\u9fff]/u;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const matches = new Set<string>();
      let node = walker.nextNode();
      while (node) {
        const parent = node.parentElement;
        const text = node.textContent?.trim() ?? "";
        if (
          parent
          && text
          && han.test(text)
          && !parent.closest("[data-no-translate], .sr-only, [aria-hidden='true'], script, style, canvas")
          && parent.getClientRects().length
        ) {
          const rect = parent.getBoundingClientRect();
          if (rect.bottom >= 0 && rect.top <= innerHeight && rect.right >= 0 && rect.left <= innerWidth) matches.add(text);
        }
        node = walker.nextNode();
      }
      return [...matches];
    });

    expect(visibleChinese, `${route} still contains visible Chinese`).toEqual([]);
    expect(await page.locator(".nav-shell").evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);

    if (route === "/systems") {
      await expect(page.locator(".machine-module-label").filter({ hasText: "NETWORK / ENTRY" })).toBeVisible();
      await expect(page.getByText("NETWORK / NETWORK", { exact: true })).toHaveCount(0);
    }
  }
});

test("English server module cards keep whole words and clear the focus heading", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The exploded server composition is desktop-only.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 675 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  for (const hotspotIndex of [3, 2]) {
    await page.goto("/systems", { waitUntil: "networkidle" });
    await page.locator(".machine-module-hotspot").nth(hotspotIndex).click();

    const geometry = await page.evaluate(() => {
      const heading = document.querySelector<HTMLElement>(".server-story-focus-heading")!.getBoundingClientRect();
      const cards = [...document.querySelectorAll<HTMLElement>(".server-story-module-list li")];
      const overlapArea = (first: DOMRect, second: DOMRect) => Math.max(
        0,
        Math.min(first.right, second.right) - Math.max(first.left, second.left),
      ) * Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
      return {
        maximumCardHeight: Math.max(...cards.map((card) => card.getBoundingClientRect().height)),
        headingOverlap: Math.max(...cards.map((card) => overlapArea(heading, card.getBoundingClientRect()))),
        minimumViewportInset: Math.min(
          ...cards.map((card) => card.getBoundingClientRect().left),
          ...cards.map((card) => innerWidth - card.getBoundingClientRect().right),
        ),
        titleWidths: cards.map((card) => card.querySelector<HTMLElement>("strong")!.getBoundingClientRect().width),
        titleWraps: cards.map((card) => {
          const title = card.querySelector<HTMLElement>("strong")!;
          return {
            wordBreak: getComputedStyle(title).wordBreak,
            overflowWrap: getComputedStyle(title).overflowWrap,
          };
        }),
      };
    });

    expect(geometry.maximumCardHeight).toBeLessThan(170);
    expect(geometry.headingOverlap).toBe(0);
    expect(geometry.minimumViewportInset).toBeGreaterThanOrEqual(20);
    expect(Math.min(...geometry.titleWidths)).toBeGreaterThan(100);
    expect(geometry.titleWraps).toEqual(
      geometry.titleWraps.map(() => ({ wordBreak: "normal", overflowWrap: "normal" })),
    );
  }
});

test("server module cards keep their shape while English decrypts into Chinese", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The exploded server composition is desktop-only.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1280, height: 675 });
  await page.goto("/systems", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Focus on NVMe data modules" }).click();

  await page.getByRole("button", { name: "切换为中文" }).click();
  await page.waitForTimeout(250);
  await expect(page.locator("html")).toHaveAttribute("data-language-transitioning", "true");

  const transitionGeometry = await page.evaluate(() => {
    const heading = document.querySelector<HTMLElement>(".server-story-focus-heading")!.getBoundingClientRect();
    const cards = [...document.querySelectorAll<HTMLElement>(".server-story-module-list li")];
    const overlapArea = (first: DOMRect, second: DOMRect) => Math.max(
      0,
      Math.min(first.right, second.right) - Math.max(first.left, second.left),
    ) * Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
    return {
      maximumCardHeight: Math.max(...cards.map((card) => card.getBoundingClientRect().height)),
      headingOverlap: Math.max(...cards.map((card) => overlapArea(heading, card.getBoundingClientRect()))),
      minimumViewportInset: Math.min(
        ...cards.map((card) => card.getBoundingClientRect().left),
        ...cards.map((card) => innerWidth - card.getBoundingClientRect().right),
      ),
      minimumTitleWidth: Math.min(
        ...cards.map((card) => card.querySelector<HTMLElement>("strong")!.getBoundingClientRect().width),
      ),
    };
  });

  expect(transitionGeometry.maximumCardHeight).toBeLessThan(170);
  expect(transitionGeometry.headingOverlap).toBe(0);
  expect(transitionGeometry.minimumViewportInset).toBeGreaterThanOrEqual(20);
  expect(transitionGeometry.minimumTitleWidth).toBeGreaterThan(100);

  await expect(page.locator("html")).not.toHaveAttribute("data-language-transitioning", "true", { timeout: 1500 });
  await expect(page.locator("html")).toHaveAttribute("data-language", "zh");
  expect(await page.locator(".server-story-module-list li").evaluateAll((cards) => Math.max(
    ...cards.map((card) => card.getBoundingClientRect().height),
  ))).toBeLessThan(170);
});

test("About title stays framed and the photo field does not shift during translation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The suspended About composition is desktop-only.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".home-entry-intro")).toHaveClass(/is-finished/, { timeout: 4500 });
  await page.locator("#about-me").scrollIntoViewIfNeeded();

  const geometry = () => page.evaluate(() => {
    const field = document.querySelector<HTMLElement>(".about-sticker-field")!.getBoundingClientRect();
    const title = document.querySelector<HTMLElement>("#home-about-title")!;
    const titleRange = document.createRange();
    titleRange.selectNodeContents(title);
    const text = titleRange.getBoundingClientRect();
    const frame = document.querySelector<HTMLElement>(".scene-line-ornaments.is-about .corner-a")!
      .getBoundingClientRect();
    return {
      field: { x: field.x, y: field.y, width: field.width, height: field.height },
      titleTop: title.getBoundingClientRect().top,
      text: { left: text.left, top: text.top, right: text.right, bottom: text.bottom },
      frame: { left: frame.left, top: frame.top, right: frame.right, bottom: frame.bottom },
    };
  });
  const expectTitleInsideFrame = (snapshot: Awaited<ReturnType<typeof geometry>>) => {
    expect(snapshot.text.left).toBeGreaterThanOrEqual(snapshot.frame.left + 8);
    expect(snapshot.text.top).toBeGreaterThanOrEqual(snapshot.frame.top + 8);
    expect(snapshot.text.right).toBeLessThanOrEqual(snapshot.frame.right - 8);
    expect(snapshot.text.bottom).toBeLessThanOrEqual(snapshot.frame.bottom - 8);
  };

  const english = await geometry();
  expectTitleInsideFrame(english);

  await page.getByRole("button", { name: "切换为中文" }).click();
  await page.waitForTimeout(250);
  await expect(page.locator("html")).toHaveAttribute("data-language-transitioning", "true");
  const transitioning = await geometry();
  expect(transitioning.field).toEqual(english.field);
  expect(transitioning.titleTop).toBe(english.titleTop);
  expectTitleInsideFrame(transitioning);

  await expect(page.locator("html")).not.toHaveAttribute("data-language-transitioning", "true", { timeout: 1500 });
  const chinese = await geometry();
  expect(chinese.field).toEqual(english.field);
  expect(chinese.titleTop).toBe(english.titleTop);
  expectTitleInsideFrame(chinese);
});

test("featured project images remain fixed while only their copy changes language", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The featured project composition is desktop-only.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".home-entry-intro")).toHaveClass(/is-finished/, { timeout: 4500 });
  await page.locator("#featured-projects").scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);

  const imageGeometry = () => page.locator(".favorite-project").evaluateAll((cards) => cards.map((card) => {
    const rect = (selector: string) => {
      const box = card.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    };
    return {
      card: rect(".favorite-project-link"),
      media: rect(".favorite-project-media"),
      image: rect(".favorite-project-media img"),
      copy: rect(".favorite-project-copy"),
    };
  }));
  const titleClearsDecorativeRail = () => page.evaluate(() => {
    const text = document.querySelector<HTMLElement>(
      "#favorite-projects-title .decrypted-text-display",
    )!.getBoundingClientRect();
    const rail = document.querySelector<HTMLElement>(".scene-line-ornaments.is-projects .rail-a")!
      .getBoundingClientRect();
    return rail.bottom <= text.top - 8 || rail.top >= text.bottom + 8;
  });

  const english = await imageGeometry();
  const titleDisplay = page.locator("#favorite-projects-title .decrypted-text-display");
  const englishTitleWidth = await titleDisplay.evaluate((element) => element.getBoundingClientRect().width);
  expect(english.map(({ copy }) => copy.height)).toEqual([216, 216]);
  expect(await titleClearsDecorativeRail()).toBe(true);

  await page.getByRole("button", { name: "切换为中文" }).click();
  await page.waitForTimeout(250);
  await expect(page.locator("html")).toHaveAttribute("data-language-transitioning", "true");
  expect(await imageGeometry()).toEqual(english);

  const transitionTitleWidths = await titleDisplay.evaluate(async (element) => {
    const widths: number[] = [];
    while (document.documentElement.dataset.languageTransitioning === "true") {
      widths.push(element.getBoundingClientRect().width);
      await new Promise<number>(requestAnimationFrame);
    }
    return widths;
  });

  await expect(page.locator("html")).not.toHaveAttribute("data-language-transitioning", "true", { timeout: 1500 });
  await expect(titleDisplay).toHaveText("我的收藏项目");
  const chineseTitleWidth = await titleDisplay.evaluate((element) => element.getBoundingClientRect().width);
  const minimumEndpointWidth = Math.min(englishTitleWidth, chineseTitleWidth);
  const maximumEndpointWidth = Math.max(englishTitleWidth, chineseTitleWidth);
  expect(Math.min(...transitionTitleWidths)).toBeGreaterThanOrEqual(minimumEndpointWidth - 1);
  expect(Math.max(...transitionTitleWidths)).toBeLessThanOrEqual(maximumEndpointWidth + 1);
  expect(await imageGeometry()).toEqual(english);
  expect(await titleClearsDecorativeRail()).toBe(true);
});

test("English server service detail contains no visible Chinese", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The exploded server composition is desktop-only.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 675 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.goto("/systems", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Focus on GPU and AI modules" }).click();
  await page.locator(".server-story-module-list button").first().click();

  const detail = page.locator(".server-story-service-page");
  await expect(detail).toBeVisible();
  await expect(detail.locator(".server-story-service-back")).toContainText("Back to Agent and AI");
  await expect.poll(async () => detail.evaluate((node) => {
    const han = /[\u3400-\u9fff]/u;
    return [...node.querySelectorAll<HTMLElement>("*")]
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => element.childNodes.length === 1 ? element.textContent?.trim() ?? "" : "")
      .filter((text) => text && han.test(text));
  })).toEqual([]);
});
