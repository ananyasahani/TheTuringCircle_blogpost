import { expect, test } from "@playwright/test";

/**
 * Nothing may scroll sideways on a phone.
 *
 * The post page used to: article blocks reveal from 44px off their resting
 * position, and below roughly 778px that offset reached past the screen edge,
 * so the page twitched horizontally on every reveal as you scrolled. The fix
 * is `overflow-x: clip` on .post-container in globals.css.
 */

const PAGES = [
  "/",
  "/library",
  "/archives",
  "/network",
  "/login",
  "/profile",
  "/post/why-the-turing-circle-exists",
];

/** Widest the document gets beyond the viewport, in px. */
const overflowOf = (page) =>
  page.evaluate(() => {
    const de = document.documentElement;
    return de.scrollWidth - de.clientWidth;
  });

test.describe("mobile layout", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  for (const path of PAGES) {
    test(`${path} does not scroll horizontally at 375px`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(800);
      // A pixel of slack: sub-pixel layout rounding is not a bug.
      expect(await overflowOf(page)).toBeLessThanOrEqual(1);
    });
  }

  test("the post page stays put while its blocks reveal", async ({ page }) => {
    await page.goto("/post/why-the-turing-circle-exists");
    await page.waitForTimeout(800);

    // The reveal is what used to push the page sideways, so walk the whole
    // article and check after each step rather than only on load.
    const worst = await page.evaluate(async () => {
      const de = document.documentElement;
      let max = de.scrollWidth - de.clientWidth;
      for (let y = 0; y < de.scrollHeight; y += 300) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 100));
        max = Math.max(max, de.scrollWidth - de.clientWidth);
      }
      return max;
    });

    expect(worst).toBeLessThanOrEqual(1);
  });

  test("clipping the reveal does not leave article blocks hidden", async ({
    page,
  }) => {
    await page.goto("/post/why-the-turing-circle-exists");
    await page.waitForTimeout(800);

    const faded = await page.evaluate(async () => {
      const de = document.documentElement;
      for (let y = 0; y < de.scrollHeight; y += 300) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      return [...document.querySelectorAll(".post-body > *")].filter(
        (el) => parseFloat(getComputedStyle(el).opacity) < 0.9,
      ).length;
    });

    expect(faded).toBe(0);
  });
});
