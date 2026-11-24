import { expect, test, type Page } from "@playwright/test";
import { blogPosts } from "../src/blog";

async function openBlog(page: Page) {
  await page.goto("/blog", { waitUntil: "networkidle" });
  await expect(page.locator(".blog-console-visual")).toHaveCSS("opacity", "1");
  await expect(page.locator(".blog-console-visual")).toHaveCSS("transform", "none");
}

type PreviewFrame = { coverage: number; activeOffset: number; activeOpacity: number; offsets: number[]; width: number; height: number };

// Samples the cover every frame. Coverage is how opaque the sheets lying over the cover's centre are together (1 means
// nothing of the page shows through there). The centre is taken where the cover rests once the move has settled (every
// post's cover comes to rest in the same place), so a move that starts before sampling does can't skew it.
// `offsets` is every sheet's horizontal offset, in document order.
function samplePreview(page: Page, duration = 900) {
  return page.locator(".blog-console-portrait").evaluate((portrait, sampleDuration) => (
    new Promise<PreviewFrame[]>((resolve) => {
      type Sheet = { left: number; right: number; top: number; bottom: number; opacity: number; offset: number; active: boolean };
      const raw: Array<{ sheets: Sheet[]; width: number; height: number }> = [];
      const startedAt = performance.now();
      const sample = () => {
        const sheets = Array.from(portrait.querySelectorAll("figure")).map((figure) => {
          const box = figure.getBoundingClientRect();
          const image = figure.querySelector("img");
          const paper = figure.querySelector(".blog-cover-paper");
          const loaded = Boolean(image && image.complete && image.naturalWidth > 0);
          return {
            left: box.left, right: box.right, top: box.top, bottom: box.bottom,
            opacity: loaded ? Number(getComputedStyle(figure).opacity) * Number(paper ? getComputedStyle(paper).opacity : 1) : 0,
            offset: new DOMMatrixReadOnly(getComputedStyle(figure).transform).m41,
            active: figure.classList.contains("is-active"),
          };
        });
        const bounds = portrait.getBoundingClientRect();
        raw.push({ sheets, width: bounds.width, height: bounds.height });
        if (performance.now() - startedAt < sampleDuration) {
          requestAnimationFrame(sample);
          return;
        }
        const rest = raw.at(-1)!.sheets.find((sheet) => sheet.active)!;
        const cx = (rest.left + rest.right) / 2;
        const cy = (rest.top + rest.bottom) / 2;
        resolve(raw.map(({ sheets, width, height }) => {
          const active = sheets.find((sheet) => sheet.active)!;
          const covering = sheets.filter((sheet) => sheet.left <= cx && cx <= sheet.right && sheet.top <= cy && cy <= sheet.bottom);
          return {
            coverage: 1 - covering.reduce((remaining, sheet) => remaining * (1 - sheet.opacity), 1),
            activeOffset: active.offset,
            activeOpacity: active.opacity,
            offsets: sheets.map((sheet) => sheet.offset),
            width,
            height,
          };
        }));
      };
      sample();
    })
  ), duration);
}

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "This suite explicitly covers mouse and keyboard previews.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-language", "zh");
    localStorage.setItem("portfolio-color-mode", "light");
    localStorage.setItem("portfolio-pointer-trail", "off");
  });
});

for (const theme of ["light", "dark"] as const) {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    // The cover is the top sheet of a deck: sheets glide between the pile and the top as one spring moves, and the
    // sheets over the cover's centre always add up to a solid picture, so the frame is never empty.
    test(`blog cover stays covered while the deck moves in ${theme} with ${reducedMotion}`, async ({ page }, testInfo) => {
      await page.emulateMedia({ reducedMotion });
      await page.addInitScript((savedTheme) => localStorage.setItem("portfolio-color-mode", savedTheme), theme);
      await openBlog(page);

      for (const postIndex of [1, 0]) {
        const sampledFrames = samplePreview(page, 1300);
        const post = page.locator(".blog-index-list a").nth(postIndex);
        await post.focus();
        const frames = await sampledFrames;
        await testInfo.attach(`preview-${postIndex}`, { body: JSON.stringify(frames), contentType: "application/json" });
        expect(Math.min(...frames.map((frame) => frame.coverage))).toBeGreaterThanOrEqual(0.995);
        expect(frames.every((frame) => frame.width === frames[0].width && frame.height === frames[0].height)).toBe(true);
        // With motion, sheets pass through in-between places; with reduced motion they only ever jump to the end.
        const [first, last] = [frames[0].offsets, frames.at(-1)!.offsets];
        const inBetween = frames.some((frame) => frame.offsets.some((offset, index) => Math.abs(offset - first[index]) > 1 && Math.abs(offset - last[index]) > 1));
        expect(inBetween).toBe(reducedMotion === "no-preference");
        expect(Math.abs(frames.at(-1)!.activeOffset)).toBeLessThan(0.5);
        expect(frames.at(-1)!.activeOpacity).toBe(1);
        await expect(post).toHaveClass(/is-active/);
        await expect(page.locator(".blog-console-story strong")).toHaveText(await post.locator("strong").innerText());
        await expect(page.locator(".blog-console-read")).toHaveAttribute("href", (await post.getAttribute("href"))!);
        await expect(page.locator(".blog-console-portrait figure.is-active")).toHaveAttribute("aria-hidden", "false");
      }
      await page.screenshot({ path: testInfo.outputPath(`blog-preview-${theme}-${reducedMotion}.png`) });
    });
  }
}

// In the desktop console the list is a wheel: hovering a post doesn't switch the cover (turning the wheel does), keyboard
// focus brings a post to the middle, and Enter opens it.
test("the wheel ignores hover, follows keyboard focus and opens the post in the middle", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openBlog(page);
  await expect(page.locator(".blog-index-list")).toHaveAttribute("data-wheel", "true");
  const posts = page.locator(".blog-index-list a");
  await posts.nth(1).dispatchEvent("pointerenter", { pointerType: "mouse" });
  await page.waitForTimeout(160);
  await expect(posts.first()).toHaveClass(/is-active/);
  await posts.last().focus();
  await expect(posts.last()).toHaveClass(/is-active/);
  await posts.last().press("Enter");
  await expect(page).toHaveURL(/\/blog\/solo-delivery-boundaries$/);
});

// One notch of the scroll wheel is one post; past the first post comes the last, and the page itself doesn't scroll.
test("the scroll wheel turns the list one post per notch and loops", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openBlog(page);
  const posts = page.locator(".blog-index-list a");
  const list = await page.locator(".blog-index-list").boundingBox();
  await page.mouse.move(list!.x + list!.width / 2, list!.y + list!.height / 2);
  await page.mouse.wheel(0, 100);
  await expect(posts.nth(1)).toHaveClass(/is-active/);
  await page.waitForTimeout(500);
  await page.mouse.wheel(0, -100);
  await page.waitForTimeout(300);
  await page.mouse.wheel(0, -100);
  await expect(posts.last()).toHaveClass(/is-active/);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

// Choices made mid-move retarget the same spring; the cover never empties and ends on the latest choice.
test("rapid reversals keep the cover solid and settle on the latest requested article", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openBlog(page);
  const posts = page.locator(".blog-index-list a");
  const sampledFrames = samplePreview(page, 1900);
  for (const postIndex of [1, 0, 2, 3, 4, 0]) {
    await posts.nth(postIndex).focus();
    await page.waitForTimeout(70);
  }
  const frames = await sampledFrames;
  await testInfo.attach("rapid-preview", { body: JSON.stringify(frames), contentType: "application/json" });
  expect(Math.min(...frames.map((frame) => frame.coverage))).toBeGreaterThanOrEqual(0.995);
  await expect(posts.first()).toHaveClass(/is-active/);
  await expect(page.locator(".blog-console-portrait figure.is-active img")).toHaveAttribute("src", blogPosts[0].image);
  expect(Math.abs(frames.at(-1)!.activeOffset)).toBeLessThan(0.5);
});

// Matches every size variant of a post's cover, e.g. "home-lab.webp" or "grok-register-panel-local-960-<hash>.webp".
const coverGlob = (image: string) =>
  `**/assets/project-covers/${image.split("/").pop()!.replace(/(-local)?(-\d+-[a-f0-9]{12})?\.webp$/, "")}*`;

// A cover still on its way shows its sheet of plain paper until the picture arrives, and never holds up the next choice.
test("a slow cover shows plain paper and does not hold up the next choice", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  let releaseImage!: () => void;
  const imageGate = new Promise<void>((resolve) => { releaseImage = resolve; });
  await page.route(coverGlob(blogPosts[1].image), async (route) => {
    await imageGate;
    await route.continue();
  });
  try {
    await page.goto("/blog", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".blog-console-visual")).toHaveCSS("opacity", "1");
    const posts = page.locator(".blog-index-list a");
    await posts.nth(1).focus();
    await expect(posts.nth(1)).toHaveClass(/is-active/);
    await expect(page.locator(".blog-console-portrait figure.is-active img")).not.toHaveClass(/is-loaded/);
    await posts.nth(2).focus();
    await expect(posts.nth(2)).toHaveClass(/is-active/);
    releaseImage();
    await page.waitForTimeout(700);
    await expect(posts.nth(2)).toHaveClass(/is-active/);
    await expect(page.locator(".blog-console-portrait figure.is-active img")).toHaveAttribute("src", blogPosts[2].image);
  } finally {
    releaseImage();
  }
});

test("a failed cover leaves plain paper without blocking other articles", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route(coverGlob(blogPosts[1].image), (route) => route.abort());
  await openBlog(page);
  const posts = page.locator(".blog-index-list a");
  await posts.nth(1).focus();
  await expect(posts.nth(1)).toHaveClass(/is-active/);
  await posts.nth(2).focus();
  await expect(posts.nth(2)).toHaveClass(/is-active/);
  expect(errors).toEqual([]);
});

test("touch entry does not trigger a hover preview or delay article navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openBlog(page);
  const posts = page.locator(".blog-index-list a");
  await posts.nth(1).dispatchEvent("pointerenter", { pointerType: "touch" });
  await page.waitForTimeout(150);
  await expect(posts.first()).toHaveClass(/is-active/);
  await posts.nth(1).click();
  await expect(page).toHaveURL(new RegExp(`/blog/${blogPosts[1].slug}$`));
});
