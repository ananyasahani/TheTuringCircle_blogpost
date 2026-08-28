import { expect, test } from "@playwright/test";

/**
 * The reading experience, signed out. These cover the paths that broke during
 * development: a post rendering empty, legacy essays disappearing behind the
 * dual-format branch, and the archive grouping.
 */

test("homepage renders the hero, featured essays and the journal index", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "The Turing",
  );

  // Featured essays each link to a post.
  const essayLinks = page.locator('a[href^="/post/"]');
  expect(await essayLinks.count()).toBeGreaterThan(3);

  await expect(page.getByRole("link", { name: /complete library/i })).toBeVisible();
});

test("a post page renders its body text, not an empty article", async ({
  page,
}) => {
  await page.goto("/");

  // Resolve the target from the DOM rather than clicking it: the homepage
  // renders static posts first and swaps in the Firestore ones on mount, so a
  // click can land on a node React has already replaced.
  const href = await page
    .locator('a[href^="/post/"]')
    .first()
    .getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href);

  await expect(page).toHaveURL(/\/post\/.+/);
  await expect(page.locator(".post-title")).toBeVisible();

  // The regression this exists for: prose present in the DOM but rendered at
  // opacity 0, so assert it is actually visible and non-trivial.
  const body = page.locator(".post-body");
  await expect(body).toBeVisible();
  const text = (await body.innerText()).trim();
  expect(text.length).toBeGreaterThan(200);
});

test("a seeded legacy essay still renders through the markdown branch", async ({
  page,
}) => {
  await page.goto("/post/why-the-turing-circle-exists");

  await expect(page.locator(".post-title")).toContainText("Why The Turing Circle");
  // Legacy essays keep their ### headings as .post-h3 elements.
  await expect(page.locator(".post-h3").first()).toBeVisible();
  expect((await page.locator(".post-body").innerText()).length).toBeGreaterThan(
    500,
  );
});

test("library lists posts and filters by tag", async ({ page }) => {
  await page.goto("/library");

  const cards = page.locator(".lib-card");
  const total = await cards.count();
  expect(total).toBeGreaterThan(0);

  // Pick the first real tag pill (index 0 is "All") and apply it.
  const tagPill = page.locator(".lib-filters .tag-pill").nth(1);
  const label = (await tagPill.innerText()).trim();
  await tagPill.click();

  await expect(page.locator(".subpage-subtitle")).toContainText("filtered by");
  const filtered = await cards.count();
  expect(filtered).toBeGreaterThan(0);
  expect(filtered).toBeLessThanOrEqual(total);
  expect(label.length).toBeGreaterThan(0);
});

test("archives groups posts under real month headings", async ({ page }) => {
  await page.goto("/archives");

  const groups = page.locator(".archive-group-label");
  expect(await groups.count()).toBeGreaterThan(0);

  // Grouping moved off the "Hours/Days/Weeks ago" meta strings onto createdAt.
  const headings = await groups.allInnerTexts();
  for (const heading of headings) {
    expect(heading).not.toMatch(/hours ago|days ago|weeks ago/i);
  }
  // Case-insensitive: the label is uppercased in CSS, so innerText reports
  // "AUGUST 2026".
  expect(headings.join(" ")).toMatch(
    /January|February|March|April|May|June|July|August|September|October|November|December|Undated/i,
  );

  await expect(page.locator(".archive-item").first()).toBeVisible();
});

test("network derives contributors from posts", async ({ page }) => {
  await page.goto("/network");

  await expect(page.locator(".network-card").first()).toBeVisible();
  await expect(page.locator(".subpage-subtitle")).toContainText("contributors");
});
