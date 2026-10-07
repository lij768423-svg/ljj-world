import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`hero secondary button stays readable on hover and focus in ${theme}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Hover is a desktop interaction.");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(savedTheme => {
      localStorage.setItem("portfolio-color-mode", savedTheme);
      localStorage.setItem("portfolio-language", "zh");
      localStorage.setItem("portfolio-pointer-trail", "off");
    }, theme);
    await page.goto("/", { waitUntil: "networkidle" });
    const button = page.locator('.hero-actions a[href="#about-me"]');
    const expected = await button.evaluate(element => {
      const probe = document.createElement("div");
      document.body.append(probe);
      probe.style.setProperty("transition", "none", "important");
      probe.style.setProperty("--text", getComputedStyle(element).getPropertyValue("--text"));
      probe.style.setProperty("--bg", getComputedStyle(element).getPropertyValue("--bg"));
      probe.style.setProperty("color", "var(--text)", "important");
      const background = getComputedStyle(probe).color;
      probe.style.setProperty("color", "var(--bg)", "important");
      const foreground = getComputedStyle(probe).color;
      probe.remove();
      return { background, foreground };
    });
    await button.hover();
    await expect(button).toHaveCSS("background-color", expected.background);
    await expect(button).toHaveCSS("color", expected.foreground);
    await expect(button.locator("svg")).toHaveCSS("color", expected.foreground);
    expect(expected.background).not.toBe(expected.foreground);
    await page.mouse.move(0, 0);
    await page.locator('.hero-actions a[href="#featured-projects"]').focus();
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    await expect(button).toHaveCSS("background-color", expected.background);
    await expect(button).toHaveCSS("color", expected.foreground);
  });
}
