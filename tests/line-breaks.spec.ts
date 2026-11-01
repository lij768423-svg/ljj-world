import { expect, test } from "@playwright/test";
import { getLineBreakGroups } from "../src/lib/lineBreaks";

test("line-break groups keep words whole and punctuation attached", () => {
  expect(getLineBreakGroups("I turn ideas into lasting products.")).toEqual(
    ["I", " ", "turn", " ", "ideas", " ", "into", " ", "lasting", " ", "products."],
  );
  expect(getLineBreakGroups("你好，我是 ljj。")).toEqual(["你好，", "我是", " ", "ljj。"]);
  const chinese = getLineBreakGroups("把想法做成长期运行的产品。");
  expect(chinese).toContain("长期");
  expect(chinese).toContain("运行");
  expect(chinese.at(-1)?.endsWith("。")).toBe(true);
  expect(getLineBreakGroups("Next（本地）")).toEqual(["Next", "（本地）"]);
});

test("the animated hero never breaks inside a word on a phone", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Phone layout only.");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    localStorage.setItem("portfolio-language", "en");
    localStorage.setItem("portfolio-pointer-trail", "off");
  });
  await page.goto("/en/");
  const words = page.locator("#hero-title .hero-line .blur-text-word");
  await expect(words.first()).toBeVisible();
  await expect.poll(() => page.locator("#hero-title .hero-line").first().innerText()).toContain("Hi");
  // Let the entrance animation settle so every character sits at its final position.
  await page.waitForTimeout(2200);
  const split = await page.locator("#hero-title .hero-line .blur-text-word").evaluateAll((elements) => elements
    .map((element) => {
      const tops = [...element.children].map((child) => Math.round(child.getBoundingClientRect().top));
      return { word: element.textContent, lines: new Set(tops).size };
    })
    .filter((item) => item.lines > 1));
  expect(split).toEqual([]);
  expect(await page.locator("#hero-title").innerText()).toContain("lasting");
});
