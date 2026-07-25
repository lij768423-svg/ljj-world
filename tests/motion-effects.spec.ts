import { expect, test } from "@playwright/test";

test("React Bits kinetic layers render and respond to pointer input", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Pointer effects are desktop-first.");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/", { waitUntil: "networkidle" });

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

test("pixel trail remains global across portfolio routes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Pointer effects are desktop-first.");
  await page.setViewportSize({ width: 1280, height: 720 });

  for (const route of ["/projects", "/systems", "/about", "/projects/408"]) {
    await page.goto(route, { waitUntil: "networkidle" });
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
    await page.mouse.move(420, 260);
    await expect.poll(() => trail.evaluate((node) => {
      const canvas = node as HTMLCanvasElement;
      const context = canvas.getContext("2d");
      if (!context) return false;
      const bounds = canvas.getBoundingClientRect();
      const scaleX = canvas.width / bounds.width;
      const scaleY = canvas.height / bounds.height;
      const x = Math.max(0, Math.floor((420 - bounds.left) * scaleX) - 20);
      const y = Math.max(0, Math.floor((260 - bounds.top) * scaleY) - 20);
      const width = Math.min(40, canvas.width - x);
      const height = Math.min(40, canvas.height - y);
      const pixels = context.getImageData(x, y, width, height).data;
      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index] > 0) return true;
      }
      return false;
    }), { timeout: 700 }).toBe(true);

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
