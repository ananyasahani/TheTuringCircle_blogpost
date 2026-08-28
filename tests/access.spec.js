import { expect, test } from "@playwright/test";

/**
 * What a signed-out visitor is and isn't allowed to reach, plus the prompts
 * that should invite them to sign in rather than failing silently.
 */

test("the editor redirects a signed-out visitor to login, preserving the target", async ({
  page,
}) => {
  await page.goto("/editor/some-draft-id");

  await expect(page).toHaveURL(/\/login\?next=/);
  // The guard round-trips you back to where you were headed.
  expect(decodeURIComponent(page.url())).toContain("/editor/some-draft-id");
});

test("login offers Google sign-in", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("button", { name: /continue with google/i }),
  ).toBeVisible();
});

test("comments invite a signed-out reader to sign in, and expose no composer", async ({
  page,
}) => {
  await page.goto("/post/why-the-turing-circle-exists");

  const comments = page.locator("section.comments");
  await expect(comments).toBeVisible();
  await expect(comments.getByRole("link", { name: /sign in/i })).toBeVisible();
  await expect(comments.locator("textarea")).toHaveCount(0);
});

test("no destructive controls are exposed to a signed-out visitor", async ({
  page,
}) => {
  await page.goto("/post/why-the-turing-circle-exists");

  // Deleting a post is restricted to its author and to moderators; the
  // control must never render for an anonymous reader.
  await expect(page.locator(".post-delete")).toHaveCount(0);
  // Nor a delete affordance on any existing comment.
  await expect(
    page.locator(".comment-meta button", { hasText: /delete/i }),
  ).toHaveCount(0);
});

test("the navbar shows Sign in rather than a profile avatar", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator(".nav-signin")).toBeVisible();
  await expect(page.locator(".nav-avatar")).toHaveCount(0);
});

test("an unknown post shows the not-found card instead of crashing", async ({
  page,
}) => {
  await page.goto("/post/definitely-not-a-real-post-slug");

  await expect(page.getByText(/post not found/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /return home/i })).toBeVisible();
});
