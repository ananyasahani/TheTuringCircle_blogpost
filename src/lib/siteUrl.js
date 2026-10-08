/**
 * The journal's own origin, used for canonical links, Open Graph images and
 * the sitemap — all of which need absolute URLs.
 *
 * Set NEXT_PUBLIC_SITE_URL to the real domain in production. Vercel's own
 * VERCEL_PROJECT_PRODUCTION_URL covers a deploy where that was forgotten, so
 * preview builds still produce working links instead of localhost ones.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/+$/, "");
