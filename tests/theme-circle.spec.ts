import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, path = "/", theme: "light" | "dark" = "light") {
  await page.addInitScript((mode) => {
    localStorage.setItem("portfolio-color-mode", mode);
    localStorage.setItem("portfolio-language", "zh");
    localStorage.setItem("portfolio-pointer-trail", "off");
  }, theme);
  await page.goto(path, { waitUntil: "networkidle" });
}

const themeSwitch = (page: Page) => page.getByRole("switch", { name: "深色模式" });

async function expectThemeState(page: Page, theme: "light" | "dark") {
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await expect(themeSwitch(page)).toHaveAttribute("aria-checked", theme === "dark" ? "true" : "false");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("portfolio-color-mode"))).toBe(theme);
}

// Clicks the switch from inside the page and reports the theme right after, without waiting for anything.
function clickSwitchNow(page: Page) {
  return page.evaluate(() => {
    const button = document.querySelector<HTMLButtonElement>('button[role="switch"][aria-label="深色模式"]')!;
    button.click();
    return {
      theme: document.documentElement.dataset.theme,
      switching: document.documentElement.classList.contains("theme-circle-switching"),
    };
  });
}

test("the theme toggle opens the new theme as a circle and keeps html, switch and storage in step", async ({ page }) => {
  await open(page);
  await expectThemeState(page, "light");
  const sawCircle = page.evaluate(() => new Promise<boolean>((resolve) => {
    const started = performance.now();
    const check = () => {
      const circle = document.getAnimations().some((animation) => (animation.effect as KeyframeEffect | null)?.pseudoElement === "::view-transition-new(root)");
      if (circle) resolve(true);
      else if (performance.now() - started > 1500) resolve(false);
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }));
  await themeSwitch(page).click();
  expect(await sawCircle).toBe(true);
  await expectThemeState(page, "dark");
  await expect(page.locator("html")).not.toHaveClass(/theme-circle-switching/);

  await themeSwitch(page).click();
  await expectThemeState(page, "light");
  await expect(page.locator("html")).not.toHaveClass(/theme-circle-switching/);
});

test("clicks during a running switch are dropped instead of queued", async ({ page }) => {
  await open(page);
  await clickSwitchNow(page);
  await clickSwitchNow(page);
  await page.waitForTimeout(250);
  await clickSwitchNow(page);
  await expectThemeState(page, "dark");
  await expect(page.locator("html")).not.toHaveClass(/theme-circle-switching/);
  await page.waitForTimeout(300);
  await expectThemeState(page, "dark");

  await themeSwitch(page).click();
  await expectThemeState(page, "light");
});

test("reduced motion switches the theme at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect(await clickSwitchNow(page)).toEqual({ theme: "dark", switching: false });
  await expectThemeState(page, "dark");
  expect(await clickSwitchNow(page)).toEqual({ theme: "light", switching: false });
  await expectThemeState(page, "light");
});

test("browsers without view transitions switch the theme at once", async ({ page }) => {
  await page.addInitScript(() => {
    delete (Document.prototype as { startViewTransition?: unknown }).startViewTransition;
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await open(page);
  expect(await page.evaluate(() => "startViewTransition" in document)).toBe(false);
  expect(await clickSwitchNow(page)).toEqual({ theme: "dark", switching: false });
  await expectThemeState(page, "dark");
  expect(errors).toEqual([]);
});

test("the about portrait is already the new theme's picture while the circle opens", async ({ page }) => {
  await open(page, "/about");
  const portrait = page.locator(".about-console-portrait");
  await expect(portrait).toHaveAttribute("data-portrait", "light");
  const during = page.evaluate(() => new Promise<string | null>((resolve) => {
    const check = () => {
      if (document.documentElement.dataset.theme === "dark") {
        resolve(document.querySelector(".about-console-portrait")?.getAttribute("data-portrait") ?? null);
      } else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }));
  await themeSwitch(page).click();
  expect(await during).toBe("dark");
  await expectThemeState(page, "dark");
});

test("the desk page keeps its own wipe instead of the circle", async ({ page }) => {
  await open(page, "/desk");
  expect(await clickSwitchNow(page)).toEqual({ theme: "dark", switching: false });
  await expectThemeState(page, "dark");
});
