import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const snapshot = JSON.parse(readFileSync(new URL("../src/data/serverSnapshot.json", import.meta.url), "utf8"));

async function open(page: Page, { path = "/about", theme = "light", language = "zh" } = {}) {
  await page.addInitScript(([mode, lang]) => {
    localStorage.setItem("portfolio-color-mode", mode);
    localStorage.setItem("portfolio-language", lang);
    localStorage.setItem("portfolio-pointer-trail", "off");
  }, [theme, language]);
  await page.goto(path, { waitUntil: "networkidle" });
}

const expectedLinks = [
  ["https://quiz.hermesjj.com/", "https://github.com/lij768423-svg/ioschat", "https://github.com/lij768423-svg/408-for-harmony"],
  ["https://github.com/lij768423-svg/ioschat", "https://github.com/lij768423-svg/pluggable-city-travel-agent", "https://github.com/lij768423-svg/writing-studio"],
  ["https://lij768423-svg.github.io/meshatlas/", "https://github.com/lij768423-svg/grok-register-panel"],
  ["/systems", "/blog/home-server-as-a-product"],
];
const ids = ["interface", "ai", "service", "operations"];

const hrefs = (page: Page, id: string) => page.locator(`[data-capability="${id}"] a`)
  .evaluateAll((links) => links.map((link) => link.getAttribute("href")));

test("one floating panel follows the capability cells and links to their projects", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Phones open the list under the grid.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const cells = page.locator(".about-console-capability-grid > div");
  const panel = page.locator(".about-capability-panel");
  await expect(panel).toHaveAttribute("data-open", "false");
  await expect(panel.locator("img")).toHaveCount(0);
  await panel.evaluate((element) => element.setAttribute("data-kept", "true"));

  for (const [index, id] of ids.entries()) {
    await cells.nth(index).hover();
    await expect(panel).toHaveAttribute("data-open", "true");
    expect(await hrefs(page, id)).toEqual(expectedLinks[index]);
    await expect.poll(() => panel.locator(`[data-capability="${id}"] img`).evaluateAll(
      (images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
    )).toBe(true);
  }
  await expect(panel).toHaveCount(1);
  await expect(panel).toHaveAttribute("data-kept", "true");
  await expect(panel).toHaveCSS("opacity", "1");

  // A panel never covers another cell.
  await page.waitForTimeout(900);
  const fill = (await panel.locator(".about-capability-fill").boundingBox())!;
  const grid = (await page.locator(".about-console-capability-grid").boundingBox())!;
  expect(fill.y).toBeGreaterThanOrEqual(grid.y + grid.height - 1);
  expect(fill.y + fill.height).toBeLessThanOrEqual(900);

  await page.keyboard.press("Escape");
  await expect(panel).toHaveAttribute("data-open", "false");
  await expect(panel).toHaveCSS("opacity", "0");

  const links = await panel.locator("a").evaluateAll((all) => all.map((link) => ({
    href: link.getAttribute("href")!,
    target: link.getAttribute("target"),
    rel: link.getAttribute("rel"),
    text: link.textContent!,
  })));
  expect(links).toHaveLength(10);
  for (const link of links) {
    expect(link.href).not.toContain("/projects/");
    const external = /^https?:/.test(link.href);
    expect(link.target).toBe(external ? "_blank" : null);
    expect(link.rel).toBe(external ? "noreferrer" : null);
    expect(link.text.includes("在新标签页打开")).toBe(external);
  }

  await cells.nth(2).hover();
  await cells.nth(3).hover();
  await panel.getByRole("link", { name: "家里那台服务器" }).click();
  await expect(page).toHaveURL(/\/blog\/home-server-as-a-product$/);
});

test("every capability names a project with a public link", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Data check.");
  await open(page);
  // The dev server serves the modules, so this reads the same data the page does.
  const missing = await page.evaluate(async () => {
    const load = (path: string) => import(/* @vite-ignore */ path);
    const { aboutCapabilityLinks } = await load("/src/data/aboutCapabilities.ts");
    const { projects } = await load("/src/App.tsx");
    const { getBlogPost } = await load("/src/blog.ts");
    const groups = Object.values(aboutCapabilityLinks) as Array<{ projectIds: string[]; pages?: Array<{ blogSlug?: string }> }>;
    return groups.flatMap(({ projectIds, pages = [] }) => [
      ...projectIds.filter((id) => {
        const project = projects.find((candidate: { id: string }) => candidate.id === id);
        return !project?.site && !project?.repo;
      }),
      ...pages.flatMap(({ blogSlug }) => blogSlug && !getBlogPost(blogSlug) ? [blogSlug] : []),
    ]);
  });
  expect(missing).toEqual([]);
});

test("the open panel covers the flowing lights", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Phones open the list under the grid.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.locator(".about-console-capability-grid > div").nth(1).hover();
  const panel = page.locator(".about-capability-panel");
  await expect(panel).toHaveCSS("opacity", "1");
  const layers = await page.evaluate(() => {
    const z = (selector: string) => Number(getComputedStyle(document.querySelector(selector)!).zIndex);
    return {
      siblings: document.querySelector(".about-capability-panel")!.parentElement === document.body,
      panel: z(".about-capability-panel"),
      lights: z(".global-flowing-lights"),
      header: z(".site-header"),
    };
  });
  expect(layers.siblings).toBe(true);
  expect(layers.panel).toBeGreaterThan(layers.lights);
  expect(layers.panel).toBeLessThan(layers.header);
});

test("the panel retargets without a jump when the pointer changes cells midway", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Phones open the list under the grid.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const cells = page.locator(".about-console-capability-grid > div");
  await cells.nth(0).hover();
  await page.waitForTimeout(800);
  const largestStep = page.evaluate(() => new Promise<{ step: number; travel: number; frames: number }>((resolve) => {
    const fill = document.querySelector(".about-capability-fill")!;
    let previous = fill.getBoundingClientRect();
    const first = previous;
    let last = performance.now();
    const begun = last;
    let step = 0;
    let travel = 0;
    let frames = 0;
    const tick = (now: number) => {
      const box = fill.getBoundingClientRect();
      const moved = Math.hypot(box.left - previous.left, box.top - previous.top);
      step = Math.max(step, moved / Math.max(1, now - last)); // px per ms
      travel = Math.max(travel, Math.hypot(box.left - first.left, box.top - first.top));
      previous = box;
      last = now;
      frames += 1;
      if (now - begun < 1200) requestAnimationFrame(tick);
      else resolve({ step, travel, frames });
    };
    requestAnimationFrame(tick);
  }));
  await cells.nth(1).hover();
  await page.waitForTimeout(90);
  await cells.nth(3).hover();
  await page.waitForTimeout(90);
  await cells.nth(2).hover();
  const result = await largestStep;
  expect(result.travel).toBeGreaterThan(150);
  // A 300 px move on this spring peaks near 2 px per ms; teleporting in one frame would be ten times that.
  expect(result.step).toBeLessThan(6);
});

test("keyboard users reach the links and Escape closes the panel", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Phones open the list under the grid.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const buttons = page.locator(".about-capability-hit");
  const panel = page.locator(".about-capability-panel");
  await page.locator(".about-desk-link").focus();
  await page.keyboard.press("Tab");
  await expect(buttons.nth(0)).toBeFocused();
  await expect(buttons.nth(0)).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(panel.locator('a[href="https://quiz.hermesjj.com/"]')).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(buttons.nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(panel.locator('[data-capability="ai"] a').first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveAttribute("data-open", "false");
  await expect(buttons.nth(1)).toBeFocused();
});

test("phones open the project list under the grid", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Desktop uses the floating panel.");
  await open(page);
  const list = page.locator(".about-capability-inline");
  await expect(page.locator(".about-capability-panel")).toHaveCount(0);
  await expect(list).toBeHidden();
  await page.locator(".about-capability-hit").nth(1).tap();
  await expect(list).toBeVisible();
  expect(await hrefs(page, "ai")).toEqual(expectedLinks[1]);
  const grid = (await page.locator(".about-console-capability-grid").boundingBox())!;
  expect((await list.boundingBox())!.y).toBeGreaterThanOrEqual(grid.y + grid.height);
  await page.locator(".about-capability-hit").nth(3).tap();
  await expect(page.locator('[data-capability="operations"]')).toHaveCSS("opacity", "1");
  await expect(page.locator('[data-capability="ai"]')).toHaveCSS("opacity", "0");
  await page.locator(".about-capability-hit").nth(3).tap();
  await expect(list).toBeHidden();
});

test("Escape gives focus back to the cell under the inline list", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const button = page.locator(".about-capability-hit").nth(1);
  await page.locator(".about-desk-link").focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(button).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".about-capability-inline")).toBeVisible();
  const first = page.locator('[data-capability="ai"] a').first();
  for (let press = 0; press < 4 && !(await first.evaluate((link) => link === document.activeElement)); press += 1) {
    await page.keyboard.press("Tab");
  }
  await expect(first).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".about-capability-inline")).toBeHidden();
  await expect(button).toBeFocused();
});

test("hovering another cell does not take focus from a list link", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Phones open the list under the grid.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const link = page.locator('[data-capability="interface"] a').first();
  await page.locator(".about-desk-link").focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(link).toBeFocused();
  await page.locator(".about-console-capability-grid > div").nth(3).hover();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(false);
  await expect(link).toBeFocused();
  await page.mouse.move(700, 800);
  await page.waitForTimeout(600);
  await expect(link).toBeFocused();
  await expect(page.locator(".about-capability-panel")).toHaveAttribute("data-open", "true");
});

for (const index of [0, 2]) {
  test(`a slow pointer can cross from cell ${index} into its panel`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Phones open the list under the grid.");
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page);
    const cell = page.locator(".about-console-capability-grid > div").nth(index);
    const panel = page.locator(".about-capability-panel");
    await cell.hover();
    await page.waitForTimeout(900);
    const box = (await cell.boundingBox())!;
    const fill = (await panel.locator(".about-capability-fill").boundingBox())!;
    const up = fill.y < box.y;
    const from = up ? box.y + 4 : box.y + box.height - 4;
    const to = up ? fill.y + fill.height - 6 : fill.y + 6;
    // Over a second in the gap, well past the closing timer.
    for (let step = 0; step <= 30; step += 1) {
      await page.mouse.move(box.x + box.width / 2, from + ((to - from) * step) / 30);
      await page.waitForTimeout(80);
      await expect(panel).toHaveAttribute("data-open", "true", { timeout: 1 });
    }
    await page.waitForTimeout(500);
    await expect(panel).toHaveAttribute("data-open", "true");
  });
}

test("a lower panel stays inside the page when only the window height changes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Phones open the list under the grid.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.keyboard.press("Tab");
  await page.locator(".about-capability-hit").nth(3).focus();
  await expect(page.locator(".about-capability-panel")).toHaveAttribute("data-open", "true");
  await page.waitForTimeout(900);
  await page.setViewportSize({ width: 1440, height: 780 });
  await page.waitForTimeout(1200);
  await expect(page.locator(".about-capability-panel")).toHaveAttribute("data-open", "true");
  const fill = (await page.locator(".about-capability-fill").boundingBox())!;
  const about = (await page.locator(".about-page").boundingBox())!;
  expect(fill.y + fill.height).toBeLessThanOrEqual(about.y + about.height);
});

test("each theme loads only its own portrait", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("about-avatar-three-quarter")) requests.push(request.url());
  });
  await open(page, { theme: "dark" });
  const portrait = page.locator(".about-console-portrait");
  await expect(portrait.locator("img")).toHaveCount(1);
  await expect(portrait.locator("img")).toHaveAttribute("src", "/assets/about-avatar-three-quarter-dark.webp");
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((url) => /three-quarter-dark(-768)?\.webp/.test(url))).toBe(true);

  await page.getByRole("switch", { name: "深色模式" }).click();
  await expect(portrait).toHaveAttribute("data-portrait", "light");
  await expect(portrait.locator("img.is-light")).toHaveCSS("opacity", "1");
  await expect(portrait.locator("img.is-dark")).toHaveCSS("opacity", "0");
});

test("light theme never requests the dark portrait", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await open(page);
  await expect(page.locator(".about-console-portrait img")).toHaveAttribute("src", "/assets/about-avatar-three-quarter.webp");
  expect(requests.filter((url) => url.includes("three-quarter-dark"))).toEqual([]);
});

test("the status link shows the server snapshot", async ({ page }, testInfo) => {
  await open(page, { path: "/en/about", language: "en" });
  const status = page.locator(".about-topline-status");
  await expect(status).toHaveAttribute("href", "/en/systems");
  await expect(status).toHaveAttribute("aria-label", new RegExp(`${snapshot.docker.runningContainers} containers, ${snapshot.docker.composeProjects} Compose projects, captured ${snapshot.capturedAt}`));
  // What is on screen once the digits have rolled: the last row of each column.
  await page.waitForTimeout(1800);
  const shown = await status.locator(".about-roll").first().evaluate((roll) => [...roll.querySelectorAll(".about-roll-digit")].map((digit) => {
    const box = digit.getBoundingClientRect();
    return [...digit.querySelectorAll("i")].find((row) => Math.abs(row.getBoundingClientRect().top - box.top) < 1)?.textContent;
  }).join(""));
  expect(shown).toBe(String(snapshot.docker.runningContainers));
  await expect(status.locator(".about-topline-more").first()).toBeVisible({ visible: testInfo.project.name === "desktop" });
});

for (const [path, root] of [["/about", "about"], ["/blog", "blog"]] as const) {
  test(`no line runs through the top line of ${path} on phones`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Phone layout.");
    await open(page, { path });
    const { tracks, words } = await page.evaluate((name) => {
      const box = (selector: string) => {
        const { top, bottom } = document.querySelector(selector)!.getBoundingClientRect();
        return { top, bottom };
      };
      return {
        tracks: [box(`.${name}-field-track-top`), box(`.${name}-field-pulse-top`)],
        words: [box(`.${name}-topline-index`), box(`.${name}-topline-status`)],
      };
    }, root);
    for (const track of tracks) {
      for (const word of words) expect(track.bottom < word.top || track.top > word.bottom).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

test("the lead's underline sits under its phrase in both languages", async ({ page }) => {
  for (const [path, language, phrase] of [["/about", "zh", "长期运行"], ["/en/about", "en", "run for a long time"]] as const) {
    await page.goto("about:blank");
    await open(page, { path, language });
    await expect(page.locator(".about-lead-underline i").first()).toBeVisible();
    const { line, text } = await page.evaluate((wanted) => {
      const lead = document.querySelector(".about-console-lead")!;
      const node = document.createTreeWalker(lead, NodeFilter.SHOW_TEXT).nextNode() as Text;
      const range = document.createRange();
      const start = node.data.indexOf(wanted);
      range.setStart(node, start);
      range.setEnd(node, start + wanted.length);
      return {
        line: [...lead.querySelectorAll<HTMLElement>(".about-lead-underline i")].reduce((sum, part) => sum + part.offsetWidth, 0),
        text: [...range.getClientRects()].reduce((sum, rect) => sum + rect.width, 0),
      };
    }, phrase);
    expect(Math.abs(line - text)).toBeLessThan(4);
  }
});

test("reduced motion shows the three steps already joined", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await expect(page.locator(".about-console-method ol")).toHaveAttribute("data-drawn", "true");
  expect(await page.locator(".about-console-method li").first().evaluate((step) => getComputedStyle(step, "::after").animationName)).toBe("none");
});
