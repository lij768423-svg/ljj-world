import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("portfolio-language", "zh"));
});

test("home entry draws the technical grid before revealing the first scene", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The home entry choreography is desktop-first.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-color-mode", "light");
    localStorage.setItem("portfolio-pointer-trail", "off");
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const intro = page.locator(".home-entry-intro");
  await expect(intro).toHaveCount(1);
  await expect(intro).toHaveCSS("animation-name", "home-entry-surface");
  await expect(intro.locator(".home-entry-mark span")).toHaveText("ljj.world");
  await expect(intro.locator(".home-entry-grid-line.is-vertical")).toHaveCount(49);
  await expect(intro.locator(".home-entry-grid-line.is-horizontal")).toHaveCount(28);
  await expect(intro.locator(".home-entry-grid-line").first()).toHaveCSS("animation-name", "home-entry-line-draw");
  await expect(intro.locator(".home-entry-blueprint")).toHaveCount(1);
  await expect(intro.locator(".home-entry-blueprint-portrait-frame")).toHaveCSS("animation-name", "home-entry-frame-draw");
  await expect(intro.locator(".home-entry-blueprint-portrait, .home-entry-filter-defs")).toHaveCount(0);
  expect(await intro.locator(".home-entry-blueprint-portrait-frame").evaluate((frame) => (
    getComputedStyle(frame, "::before").content
  ))).toBe("none");
  await expect(page.locator(".home-story")).toHaveAttribute("aria-busy", "true");

  await expect(intro).toHaveClass(/is-finished/, { timeout: 4500 });
  await expect(intro).toHaveCSS("visibility", "hidden");
  await expect(intro).toHaveCSS("pointer-events", "none");
  await expect(page.locator(".home-story")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator(".hero-intro")).toBeVisible();

  const primaryNav = page.getByRole("navigation", { name: "主要导航" });
  await primaryNav.getByRole("link", { name: "项目" }).click();
  await primaryNav.getByRole("link", { name: "首页" }).click();
  await expect(page.locator(".home-entry-intro:visible")).toHaveCount(0);
});

test("React Bits kinetic layers render and respond to pointer input", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Pointer effects are desktop-first.");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(".home-entry-intro")).toHaveClass(/is-finished/, { timeout: 4500 });

  const dotGrid = page.locator(".interactive-dot-grid");
  await expect(dotGrid).toBeVisible();
  const dotGridHasPixels = await dotGrid.evaluate((node) => {
    const canvas = node as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    if (!context) return false;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let index = 3; index < pixels.length; index += 64) {
      if (pixels[index] > 0) return true;
    }
    return false;
  });
  expect(dotGridHasPixels).toBe(true);

  const revealLayer = page.locator(".pixel-reveal-layer");
  const revealCanvas = page.locator(".pixel-reveal-canvas");
  await expect(revealLayer).toBeVisible();
  await expect(revealCanvas).toBeVisible();
  await expect(page.locator(".pixel-reveal-collage img")).toHaveCount(4);
  const revealImagesLoaded = await page.locator(".pixel-reveal-collage img").evaluateAll((images) => {
    return images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0);
  });
  expect(revealImagesLoaded).toBe(true);

  const sampleRevealAlpha = (clientX: number, clientY: number) => revealCanvas.evaluate((node, point) => {
    const canvas = node as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    if (!context) return 255;
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const x = Math.max(0, Math.floor((point.clientX - bounds.left) * scaleX) - 10);
    const y = Math.max(0, Math.floor((point.clientY - bounds.top) * scaleY) - 10);
    const width = Math.min(20, canvas.width - x);
    const height = Math.min(20, canvas.height - y);
    const pixels = context.getImageData(x, y, width, height).data;
    let minimumAlpha = 255;
    for (let index = 3; index < pixels.length; index += 4) minimumAlpha = Math.min(minimumAlpha, pixels[index]);
    return minimumAlpha;
  }, { clientX, clientY });

  expect(await sampleRevealAlpha(380, 138)).toBe(255);
  await page.mouse.move(380, 138);
  await expect.poll(() => sampleRevealAlpha(380, 138), { timeout: 500 }).toBeLessThan(120);
  await expect.poll(
    () => sampleRevealAlpha(380, 138),
    { timeout: 1800, intervals: [100, 150, 200] },
  ).toBeGreaterThan(240);

  await expect(page.locator(".hero-line").first().locator(".sr-only")).toHaveText("你好，我是 ljj。");
  expect(await page.locator(".hero-line").first().locator(":scope > span[aria-hidden='true']").count()).toBeGreaterThan(5);
  await expect(page.locator(".identity .decrypted-text .sr-only")).toHaveText("lij768423-svg / 独立开发者");

  const portrait = page.locator(".hero-portrait-image");
  await expect(portrait).toBeVisible();
  await expect.poll(() => portrait.evaluate((image) => (
    (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0
  ))).toBe(true);
  await page.mouse.move(1040, 240);
  await expect.poll(() => page.locator(".hero").evaluate((hero) => (
    hero.style.getPropertyValue("--portrait-shift-x")
  ))).not.toBe("");

  const magneticButton = page.locator(".hero-actions .magnetic-target").first();
  const magneticBox = await magneticButton.boundingBox();
  expect(magneticBox).not.toBeNull();
  await page.mouse.move(magneticBox!.x + magneticBox!.width - 3, magneticBox!.y + magneticBox!.height - 3);
  await expect.poll(() => magneticButton.evaluate((target) => getComputedStyle(target).transform)).not.toBe("none");

  const aboutScene = page.locator(".home-about-scene");
  await expect(aboutScene).toHaveAttribute("data-stickers-ready", "false");
  const hiddenStickerOpacity = await page.locator(".about-sticker").first().evaluate((sticker) => (
    Number.parseFloat(getComputedStyle(sticker).opacity)
  ));
  expect(hiddenStickerOpacity).toBeLessThanOrEqual(0.01);

  const sceneRail = page.getByRole("navigation", { name: "首页章节" });
  await sceneRail.getByRole("button", { name: "关于" }).click();
  await expect(sceneRail.getByRole("button", { name: "关于" })).toHaveClass(/is-active/);
  await expect(aboutScene).toHaveAttribute("data-stickers-ready", "true");
  await expect(page.locator(".about-elastic-rope")).toHaveCount(6);

  const firstSticker = page.locator(".about-sticker").first();
  const firstRopePath = page.locator(".about-elastic-rope path").first();
  await expect.poll(() => firstSticker.evaluate((sticker) => Number.parseFloat(getComputedStyle(sticker).opacity))).toBeGreaterThan(0.2);
  const fallingTransform = await firstSticker.evaluate((sticker) => getComputedStyle(sticker).transform);
  const fallingRopePath = await firstRopePath.getAttribute("d");
  await page.waitForTimeout(140);
  expect(await firstSticker.evaluate((sticker) => getComputedStyle(sticker).transform)).not.toBe(fallingTransform);
  expect(await firstRopePath.getAttribute("d")).not.toBe(fallingRopePath);

  await page.waitForTimeout(900);
  const firstBreather = page.locator(".about-sticker-breather").first();
  await expect(firstBreather).toHaveAttribute("data-breathing", "true", { timeout: 6000 });
  const breathingTransform = await firstBreather.evaluate((sticker) => getComputedStyle(sticker).transform);
  await page.waitForTimeout(180);
  expect(await firstBreather.evaluate((sticker) => getComputedStyle(sticker).transform)).not.toBe(breathingTransform);
});

test("project DNA waits for cold cover decoding before its entry animation starts", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The DNA choreography is desktop-first.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => localStorage.setItem("portfolio-pointer-trail", "off"));
  await page.route("**/assets/project-covers/408-web.webp", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 420));
    await route.continue();
  });

  await page.goto("/projects", { waitUntil: "domcontentloaded" });
  const helix = page.locator(".project-helix");
  await expect(helix).toHaveAttribute("data-helix-ready", "false");
  await expect(helix.locator(".project-helix-axis-seed")).toHaveCount(0);
  await expect(helix).toHaveAttribute("data-helix-axis", "0.0000");

  await expect(helix).toHaveAttribute("data-helix-ready", "true", { timeout: 3_000 });
  await expect(helix.locator(".project-helix-axis-seed")).toHaveCount(1);
  expect(await helix.locator(".project-card-media img").evaluateAll((images) => (
    images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)
  ))).toBe(true);
  await expect(helix).toHaveAttribute("data-helix-stage", "live", { timeout: 3_000 });
});

test("pixel trail remains global across portfolio routes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Pointer effects are desktop-first.");
  await page.setViewportSize({ width: 1280, height: 720 });

  for (const route of ["/projects", "/systems", "/about", "/projects/408", "/desk"]) {
    await page.goto(route, { waitUntil: "networkidle" });
    if (route === "/desk") {
      await expect(page.locator(".circular-gallery").first()).toHaveAttribute("data-intro-state", "complete", { timeout: 3000 });
    }
    const flowingLights = page.locator('[data-flowing-lights="global"]');
    await expect(flowingLights).toHaveCount(1);
    await expect(flowingLights).toBeVisible();
    await expect(flowingLights.locator(".global-flow-light-rail")).toHaveCount(4);
    expect(await flowingLights.evaluate((node) => getComputedStyle(node).pointerEvents)).toBe("none");
    const lightRunner = flowingLights.locator(".global-flow-light-runner").first();
    await expect(lightRunner).toHaveCSS("animation-name", "global-flow-light-x");
    if (route === "/about") await page.waitForTimeout(900);
    const lightTransform = await lightRunner.evaluate((node) => getComputedStyle(node).transform);
    await page.waitForTimeout(90);
    expect(await lightRunner.evaluate((node) => getComputedStyle(node).transform)).not.toBe(lightTransform);

    const trail = page.locator(".global-pixel-trail");
    await expect(trail).toHaveCount(1);
    await expect(trail).toBeVisible();
    const point = route === "/desk" ? { x: 640, y: 394 } : { x: 420, y: 260 };
    await page.mouse.move(point.x, point.y);
    await expect.poll(() => trail.evaluate((node, samplePoint) => {
      const canvas = node as HTMLCanvasElement;
      const context = canvas.getContext("2d");
      if (!context) return false;
      const bounds = canvas.getBoundingClientRect();
      const scaleX = canvas.width / bounds.width;
      const scaleY = canvas.height / bounds.height;
      const x = Math.max(0, Math.floor((samplePoint.x - bounds.left) * scaleX) - 20);
      const y = Math.max(0, Math.floor((samplePoint.y - bounds.top) * scaleY) - 20);
      const width = Math.min(40, canvas.width - x);
      const height = Math.min(40, canvas.height - y);
      const pixels = context.getImageData(x, y, width, height).data;
      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index] > 0) return true;
      }
      return false;
    }, point), { timeout: 700 }).toBe(true);

    if (route === "/desk") {
      const layerOrder = await trail.evaluate((node) => {
        const gallery = document.querySelector(".desk-gallery-layout");
        const desk = document.querySelector(".desk-page");
        return {
          clipPath: getComputedStyle(node).clipPath,
          trailZ: Number(getComputedStyle(node).zIndex),
          galleryZ: gallery ? Number(getComputedStyle(gallery).zIndex) : 0,
          deskIsolation: desk ? getComputedStyle(desk).isolation : "isolate",
        };
      });
      expect(layerOrder.clipPath).toBe("none");
      expect(layerOrder.galleryZ).toBeGreaterThan(layerOrder.trailZ);
      expect(layerOrder.deskIsolation).toBe("auto");
    } else {
      const layerOrder = await trail.evaluate((node) => {
        const routeMain = document.querySelector(".route-main");
        return {
          trailZ: Number(getComputedStyle(node).zIndex),
          routeZ: routeMain ? Number(getComputedStyle(routeMain).zIndex) : 0,
        };
      });
      expect(layerOrder.trailZ).toBe(0);
      expect(layerOrder.routeZ).toBeGreaterThan(layerOrder.trailZ);
    }

    const trailPixel = await trail.evaluate((node) => {
      const canvas = node as HTMLCanvasElement;
      const context = canvas.getContext("2d");
      if (!context) return { red: 0, green: 0, blue: 0, alpha: 0 };
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let strongest = { red: 0, green: 0, blue: 0, alpha: 0 };
      for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index + 3] <= strongest.alpha) continue;
        strongest = {
          red: pixels[index],
          green: pixels[index + 1],
          blue: pixels[index + 2],
          alpha: pixels[index + 3],
        };
      }
      return strongest;
    });
    expect(trailPixel.red).toBeGreaterThan(210);
    expect(trailPixel.green).toBeGreaterThan(155);
    expect(trailPixel.blue).toBeGreaterThan(145);

    const navBox = await page.locator(".site-header").boundingBox();
    const trailBox = await trail.boundingBox();
    expect(Math.abs((trailBox?.y ?? 0) - (navBox?.height ?? 0))).toBeLessThanOrEqual(4);
    expect(await trail.evaluate((node) => getComputedStyle(node).pointerEvents)).toBe("none");
  }
});

test("desk galleries enter from opposite sides before enabling drag", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The desk loading choreography is desktop-first.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => localStorage.setItem("portfolio-pointer-trail", "off"));
  await page.goto("/desk", { waitUntil: "domcontentloaded" });

  const galleries = page.locator(".circular-gallery");
  await expect(galleries).toHaveCount(2);
  await expect(galleries.nth(0)).toHaveAttribute("data-entry-direction", "left");
  await expect(galleries.nth(1)).toHaveAttribute("data-entry-direction", "right");
  await expect(galleries.nth(0)).toHaveAttribute("data-intro-state", "running", { timeout: 2000 });
  await expect(galleries.nth(1)).toHaveAttribute("data-intro-state", "running", { timeout: 2000 });

  const upperBefore = await galleries.nth(0).screenshot();
  const lowerBefore = await galleries.nth(1).screenshot();
  await page.waitForTimeout(180);
  expect((await galleries.nth(0).screenshot()).equals(upperBefore)).toBe(false);
  expect((await galleries.nth(1).screenshot()).equals(lowerBefore)).toBe(false);

  await expect(galleries.nth(0)).toHaveAttribute("data-intro-state", "complete", { timeout: 2500 });
  await expect(galleries.nth(1)).toHaveAttribute("data-intro-state", "complete", { timeout: 2500 });
  await expect(galleries.nth(0)).toHaveCSS("cursor", "grab");
  await expect(galleries.nth(1)).toHaveCSS("cursor", "grab");
});

test("desk gallery cards brighten, grow, and tilt toward the pointer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The gallery hover response is desktop-first.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => localStorage.setItem("portfolio-pointer-trail", "off"));
  await page.goto("/desk", { waitUntil: "networkidle" });

  const gallery = page.locator(".desk-gallery-scene-home .circular-gallery");
  await expect(gallery).toHaveAttribute("data-intro-state", "complete", { timeout: 3000 });
  const box = await gallery.boundingBox();
  expect(box).not.toBeNull();
  const y = box!.y + box!.height * 0.5;

  await page.mouse.move(box!.x + box!.width * 0.43, y);
  await expect(gallery).toHaveClass(/is-hovering-card/);
  await expect(gallery).toHaveCSS("cursor", "pointer");
  await expect.poll(() => gallery.getAttribute("data-hover-intensity").then(Number), { timeout: 1000 }).toBeGreaterThan(0.7);
  await expect.poll(() => gallery.getAttribute("data-hover-x").then(Number), { timeout: 1000 }).toBeLessThan(-0.15);

  const hoveredItem = await gallery.getAttribute("data-hovered-item");
  await page.mouse.move(box!.x + box!.width * 0.57, y);
  await expect(gallery).toHaveAttribute("data-hovered-item", hoveredItem!);
  await expect.poll(() => gallery.getAttribute("data-hover-x").then(Number), { timeout: 1000 }).toBeGreaterThan(0.15);

  await page.mouse.move(12, 12);
  await expect(gallery).not.toHaveClass(/is-hovering-card/);
  await expect(gallery).toHaveAttribute("data-hovered-item", "");
});

test("desk lightbox zooms smoothly into its fullscreen presentation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The desk lightbox is desktop-first.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => localStorage.setItem("portfolio-pointer-trail", "off"));
  await page.goto("/desk", { waitUntil: "networkidle" });

  const gallery = page.locator(".desk-gallery-scene-home .circular-gallery");
  await expect(gallery).toHaveAttribute("data-intro-state", "complete", { timeout: 3000 });
  const galleryBox = await gallery.boundingBox();
  expect(galleryBox).not.toBeNull();
  const clickPoint = {
    x: galleryBox!.x + galleryBox!.width * 0.5,
    y: galleryBox!.y + galleryBox!.height * 0.5,
  };
  await page.mouse.click(clickPoint.x, clickPoint.y);

  const zoomShell = page.locator(".desk-lightbox-zoom-shell");
  await expect(zoomShell).toBeVisible();
  await expect(zoomShell).toHaveAttribute("data-origin-x", String(Math.round(clickPoint.x)));
  await expect(zoomShell).toHaveAttribute("data-origin-y", String(Math.round(clickPoint.y)));
  const openingTransform = await zoomShell.evaluate((node) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
    return { scale: matrix.a, y: matrix.f };
  });
  expect(openingTransform.scale).toBeLessThan(0.9);
  expect(Math.abs(openingTransform.y)).toBeGreaterThan(20);
  await expect.poll(
    () => zoomShell.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).a),
    { timeout: 1000 },
  ).toBeCloseTo(1, 2);
  await expect(zoomShell).toHaveCSS("opacity", "1");
});

test("desk theme wipes in from opposite sides and restores the entry theme after exit", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The desk theme choreography is desktop-first.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-color-mode", "light");
    localStorage.setItem("portfolio-pointer-trail", "off");
  });
  await page.goto("/desk", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".desk-page")).toHaveAttribute("data-intro-ready", "true", { timeout: 2200 });
  await expect(page.locator("html")).toHaveCSS("overflow-y", "hidden");
  expect(await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth)).toBe(0);
  const upperWipe = page.locator(".desk-theme-wipe .is-upper");
  const lowerWipe = page.locator(".desk-theme-wipe .is-lower");
  await expect(upperWipe).toHaveCSS("animation-name", "desk-theme-wipe-in");
  await expect(lowerWipe).toHaveCSS("animation-name", "desk-theme-wipe-in");
  await expect(upperWipe).toHaveCSS("animation-duration", "1.24s");
  await expect(lowerWipe).toHaveCSS("animation-duration", "1.24s");
  await expect(upperWipe).toHaveCSS("will-change", "transform");
  await expect(lowerWipe).toHaveCSS("will-change", "transform");
  expect(await upperWipe.evaluate((node) => getComputedStyle(node, "::after").width)).toBe("1px");
  await expect(page.locator("body")).toHaveClass(/desk-chrome-dark/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".site-header")).toHaveCSS("transition-duration", "1.24s, 1.24s, 1.24s");
  await expect(page.locator(".desktop-nav")).toHaveCSS("transition-duration", "1.24s");
  await expect(page.locator(".theme-switch").first()).toHaveCSS("transition-duration", "1.24s, 1.24s, 1.24s, 0.18s");

  const galleries = page.locator(".circular-gallery");
  await expect(galleries.nth(0)).toHaveAttribute("data-intro-state", "complete", { timeout: 7000 });
  const wipeWidth = await page.locator(".desk-theme-wipe").evaluate((node) => node.getBoundingClientRect().width);
  const wipeExitOffsets = Promise.all([
    upperWipe.evaluate((node) => new Promise<number>((resolve) => {
      node.addEventListener("animationend", () => resolve(new DOMMatrixReadOnly(getComputedStyle(node).transform).m41), { once: true });
    })),
    lowerWipe.evaluate((node) => new Promise<number>((resolve) => {
      node.addEventListener("animationend", () => resolve(new DOMMatrixReadOnly(getComputedStyle(node).transform).m41), { once: true });
    })),
  ]);
  await page.getByRole("navigation", { name: "主要导航" }).getByRole("link", { name: "关于" }).click();
  await expect(galleries.nth(0)).toHaveAttribute("data-exit-state", "running");
  await expect(galleries.nth(1)).toHaveAttribute("data-exit-state", "running");
  await expect(upperWipe).toHaveCSS("animation-name", "desk-theme-wipe-out");
  await expect(lowerWipe).toHaveCSS("animation-name", "desk-theme-wipe-out");
  await expect(page.locator("body")).toHaveClass(/desk-chrome-dark/);
  const [upperOffset, lowerOffset] = await wipeExitOffsets;
  expect(upperOffset).toBeLessThanOrEqual(-wipeWidth + 1);
  expect(lowerOffset).toBeGreaterThanOrEqual(wipeWidth - 1);
  await expect(page.locator("body")).not.toHaveClass(/desk-chrome-dark/, { timeout: 1500 });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page).toHaveURL(/\/about$/);
});

test("desk route keeps the header dock fixed while entering and leaving", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The desktop dock is hidden on phone layouts.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-color-mode", "light");
    localStorage.setItem("portfolio-pointer-trail", "off");
  });
  await page.goto("/about", { waitUntil: "domcontentloaded" });

  const readDockLayout = () => page.locator(".site-header").evaluate(() => {
    const shell = document.querySelector<HTMLElement>(".nav-shell")!.getBoundingClientRect();
    const dock = document.querySelector<HTMLElement>(".desktop-nav")!.getBoundingClientRect();
    return {
      shellWidth: shell.width,
      dockCenter: dock.left + dock.width / 2,
    };
  });
  const before = await readDockLayout();
  await expect(page.locator("html")).toHaveCSS("scrollbar-width", "none");

  await page.getByRole("navigation", { name: "主要导航" }).getByRole("link", { name: "桌搭" }).click();
  await expect(page).toHaveURL(/\/desk$/);
  const entered = await readDockLayout();
  expect(entered.shellWidth).toBeCloseTo(before.shellWidth, 2);
  expect(entered.dockCenter).toBeCloseTo(before.dockCenter, 2);

  await page.getByRole("navigation", { name: "主要导航" }).getByRole("link", { name: "关于" }).click();
  await expect(page).toHaveURL(/\/about$/);
  const duringExit = await readDockLayout();
  expect(duringExit.shellWidth).toBeCloseTo(before.shellWidth, 2);
  expect(duringExit.dockCenter).toBeCloseTo(before.dockCenter, 2);

  await page.waitForTimeout(1_300);
  const afterExit = await readDockLayout();
  expect(afterExit.shellWidth).toBeCloseTo(before.shellWidth, 2);
  expect(afterExit.dockCenter).toBeCloseTo(before.dockCenter, 2);
});

test("desk technical line field animates behind the photographic galleries", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The desk line field is desktop-first.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-color-mode", "dark");
    localStorage.setItem("portfolio-pointer-trail", "off");
  });
  await page.goto("/desk", { waitUntil: "domcontentloaded" });

  const ornaments = page.locator('[data-line-ornaments="desk"]');
  const gallery = page.locator(".desk-gallery-layout");
  await expect(ornaments).toHaveCount(1);
  await expect(ornaments.locator(".scene-line-rail")).toHaveCount(5);
  await expect(ornaments.locator(".scene-line-corner")).toHaveCount(3);
  await expect(ornaments.locator(".rail-a")).toHaveCSS("animation-name", "scene-line-travel-x");
  await expect(ornaments.locator(".rail-c")).toHaveCSS("animation-name", "scene-line-travel-y");

  const layers = await ornaments.evaluate((node) => {
    const galleryNode = document.querySelector(".desk-gallery-layout");
    const lowerRail = node.querySelector(".rail-d");
    const galleryBounds = galleryNode?.getBoundingClientRect();
    const dividerY = galleryBounds ? galleryBounds.top + galleryBounds.height / 2 : 0;
    return {
      ornamentZ: Number(getComputedStyle(node).zIndex),
      galleryZ: galleryNode ? Number(getComputedStyle(galleryNode).zIndex) : 0,
      lowerRailDistanceFromDivider: lowerRail
        ? Math.abs(lowerRail.getBoundingClientRect().top - dividerY)
        : 0,
    };
  });
  expect(layers.galleryZ).toBeGreaterThan(layers.ornamentZ);
  expect(layers.lowerRailDistanceFromDivider).toBeGreaterThan(20);
  await expect(gallery).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(ornaments.locator(".scene-line-rail").first()).toHaveCSS("animation-name", "none");
  await expect(ornaments.locator(".scene-line-corner").first()).toHaveCSS("animation-name", "none");
});

test("desk switches from a dark entry to a synchronized light presentation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The desk theme choreography is desktop-first.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-color-mode", "dark");
    localStorage.setItem("portfolio-pointer-trail", "off");
  });
  await page.goto("/desk", { waitUntil: "domcontentloaded" });

  const galleries = page.locator(".circular-gallery");
  await expect(galleries.nth(0)).toHaveAttribute("data-intro-state", "complete", { timeout: 3000 });
  const deskPage = page.locator(".desk-page");
  const upperWipe = page.locator(".desk-theme-wipe .is-upper");
  const lowerWipe = page.locator(".desk-theme-wipe .is-lower");
  await expect(deskPage).toHaveAttribute("data-visual-theme", "dark");

  const wipeOffsets = Promise.all([
    upperWipe.evaluate((node) => new Promise<number>((resolve) => {
      node.addEventListener("animationend", () => resolve(new DOMMatrixReadOnly(getComputedStyle(node).transform).m41), { once: true });
    })),
    lowerWipe.evaluate((node) => new Promise<number>((resolve) => {
      node.addEventListener("animationend", () => resolve(new DOMMatrixReadOnly(getComputedStyle(node).transform).m41), { once: true });
    })),
  ]);

  await page.getByRole("switch", { name: "深色模式" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(deskPage).toHaveAttribute("data-visual-theme", "light");
  await expect(upperWipe).toHaveCSS("animation-name", "desk-theme-wipe-out");
  await expect(lowerWipe).toHaveCSS("animation-name", "desk-theme-wipe-out");
  await expect(page.locator("body")).toHaveClass(/desk-chrome-dark/);

  const [upperOffset, lowerOffset] = await wipeOffsets;
  expect(upperOffset).toBeLessThanOrEqual(-1439);
  expect(lowerOffset).toBeGreaterThanOrEqual(1439);
  await expect(page.locator("body")).not.toHaveClass(/desk-chrome-dark/, { timeout: 1500 });
  await expect(page.locator(".desk-gallery-scene-label strong").first()).toHaveCSS("color", "rgb(23, 24, 21)");

  await page.getByRole("link", { name: "服务器", exact: true }).click();
  await expect(page.locator("body")).not.toHaveClass(/desk-chrome-dark/);
  await expect(page).toHaveURL(/\/systems$/);
});

test("server entry keeps the header and canvas color transition alive", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The server transition is desktop-first.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-color-mode", "light");
    localStorage.setItem("portfolio-pointer-trail", "off");
  });
  await page.goto("/desk", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".circular-gallery").first()).toHaveAttribute("data-intro-state", "complete", { timeout: 7000 });
  await expect(page.locator("body")).toHaveClass(/desk-chrome-dark/);

  const headerTransition = page.locator(".site-header").evaluate((header) => new Promise<{
    start: string;
    middle: string;
    duration: string;
  }>((resolve) => {
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains("desk-route")) return;
      observer.disconnect();
      const start = getComputedStyle(header).backgroundColor;
      const duration = getComputedStyle(header).transitionDuration;
      window.setTimeout(() => {
        resolve({ start, middle: getComputedStyle(header).backgroundColor, duration });
      }, 180);
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }));

  await page.getByRole("link", { name: "服务器", exact: true }).click();
  const transitionFrames = await headerTransition;
  expect(transitionFrames.duration).toContain("0.72s");
  expect(transitionFrames.middle).not.toBe(transitionFrames.start);
  await expect(page.locator(".route-main.is-systems-route")).toHaveCSS("opacity", "1", { timeout: 1500 });
  await expect(page.locator(".site-header")).toHaveCSS("background-color", "rgba(243, 244, 241, 0.88)", { timeout: 1500 });
});

test("suspended photos follow a held pointer and spring back on release", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Photo dragging is desktop-first.");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/", { waitUntil: "networkidle" });

  const sceneRail = page.getByRole("navigation", { name: "首页章节" });
  await sceneRail.getByRole("button", { name: "关于" }).click();
  const field = page.locator(".about-sticker-field");
  const breather = page.locator(".about-sticker-breather").nth(1);
  const sticker = page.locator(".about-sticker").nth(1);
  const rope = page.locator(".about-elastic-rope path").nth(1);
  await expect(field).toHaveAttribute("data-photo-drag", "enabled");
  await expect(sticker).toHaveAttribute("data-drag-enabled", "true");
  await expect.poll(() => sticker.evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity))).toBeGreaterThan(0.99);
  await expect(breather).toHaveAttribute("data-breathing", "true", { timeout: 6000 });

  await expect(breather).toHaveCSS("animation-name", "about-sticker-breathe");
  expect(Number.parseInt(await breather.evaluate((element) => getComputedStyle(element).zIndex), 10)).toBeGreaterThan(
    Number.parseInt(await page.locator(".about-elastic-rope").nth(1).evaluate((element) => getComputedStyle(element).zIndex), 10),
  );
  const breathingTransform = await breather.evaluate((element) => getComputedStyle(element).transform);
  await page.waitForTimeout(180);
  expect(await breather.evaluate((element) => getComputedStyle(element).transform)).not.toBe(breathingTransform);

  const beforeBounds = await sticker.boundingBox();
  expect(beforeBounds).not.toBeNull();
  const beforeRope = await rope.getAttribute("d");
  const centerX = beforeBounds!.x + beforeBounds!.width / 2;
  const centerY = beforeBounds!.y + beforeBounds!.height / 2;
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 76, centerY + 46, { steps: 6 });

  const draggedBounds = await sticker.boundingBox();
  const draggedDistance = Math.hypot(
    (draggedBounds!.x + draggedBounds!.width / 2) - centerX,
    (draggedBounds!.y + draggedBounds!.height / 2) - centerY,
  );
  expect(draggedDistance).toBeGreaterThan(45);
  expect(await rope.getAttribute("d")).not.toBe(beforeRope);
  expect(await sticker.evaluate((element) => getComputedStyle(element).cursor)).toBe("grabbing");
  await page.mouse.up();

  await expect.poll(async () => {
    const releasedBounds = await sticker.boundingBox();
    return Math.hypot(
      (releasedBounds!.x + releasedBounds!.width / 2) - centerX,
      (releasedBounds!.y + releasedBounds!.height / 2) - centerY,
    );
  }, { timeout: 1800 }).toBeLessThan(2);

  const releasedBounds = await sticker.boundingBox();
  await page.mouse.move(releasedBounds!.x + 20, releasedBounds!.y + 20);
  await page.mouse.move(releasedBounds!.x + releasedBounds!.width - 20, releasedBounds!.y + releasedBounds!.height - 20, { steps: 8 });
  await page.waitForTimeout(160);
  const hoverOnlyBounds = await sticker.boundingBox();
  const hoverOnlyDistance = Math.hypot(
    (hoverOnlyBounds!.x + hoverOnlyBounds!.width / 2) - centerX,
    (hoverOnlyBounds!.y + hoverOnlyBounds!.height / 2) - centerY,
  );
  expect(hoverOnlyDistance).toBeLessThan(2);
});

test("reduced motion keeps the content and removes continuous kinetic effects", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop motion contract only.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.locator(".home-entry-intro")).toHaveCount(0);
  await expect(page.locator(".click-spark-canvas")).toHaveCount(0);
  await expect(page.locator(".pixel-reveal-layer")).toHaveCount(0);
  await expect(page.locator(".global-pixel-trail")).toHaveCount(0);
  const staticLights = page.locator('[data-flowing-lights="global"]');
  await expect(staticLights).toHaveCount(1);
  await expect(staticLights.locator(".global-flow-light-runner").first()).toHaveCSS("animation-name", "none");
  await expect(page.locator(".hero-line").first()).toHaveText("你好，我是 ljj。");
  await expect(page.locator(".hero-line").first().locator(":scope > span[aria-hidden='true']")).toHaveCount(0);

  const sceneRail = page.getByRole("navigation", { name: "首页章节" });
  await sceneRail.getByRole("button", { name: "关于" }).click();
  await expect(sceneRail.getByRole("button", { name: "关于" })).toHaveClass(/is-active/);
  await expect(page.locator(".home-about-scene")).toHaveAttribute("data-stickers-ready", "true");
  await expect(page.locator(".about-sticker-field")).toHaveAttribute("data-photo-drag", "disabled");
  await expect(page.locator(".about-sticker").first()).toHaveAttribute("data-drag-enabled", "false");
  await expect(page.locator(".about-sticker-breather").first()).toHaveAttribute("data-breathing", "false");
  await expect(page.locator(".about-sticker-breather").first()).toHaveCSS("animation-name", "none");
  await expect.poll(() => page.locator(".about-sticker").first().evaluate((sticker) => (
    Number.parseFloat(getComputedStyle(sticker).opacity)
  ))).toBe(1);

  const portraitTransition = await page.locator(".hero-portrait-image").evaluate((image) => {
    return Number.parseFloat(getComputedStyle(image).transitionDuration);
  });
  expect(portraitTransition).toBeLessThan(0.001);

  await page.goto("/projects", { waitUntil: "networkidle" });
  const helix = page.locator(".project-helix");
  await expect(helix).toHaveAttribute("data-reduced-motion", "true");
  const phase = await helix.getAttribute("data-helix-phase");
  await page.waitForTimeout(350);
  expect(await helix.getAttribute("data-helix-phase")).toBe(phase);
  const floatAnimation = await page.locator(".project-card-float").first().evaluate((card) => {
    return getComputedStyle(card).animationName;
  });
  expect(floatAnimation).toBe("none");
});
