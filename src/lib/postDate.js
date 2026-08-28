/**
 * Post timestamps.
 *
 * Posts reach the UI from three places, and only one of them has a real date:
 *
 *  - Firestore: `createdAt` is a Timestamp. The truth.
 *  - The static seed array (src/data/posts.js), used for the instant first
 *    paint and as an offline fallback: no createdAt at all, only a human
 *    string like "Decision Theory · 7h ago".
 *  - Posts published before this module existed: same string, frozen at
 *    "Just now".
 *
 * So `postDate` prefers the real timestamp and reconstructs an approximate one
 * from the legacy string otherwise, which keeps ordering and grouping sane in
 * every mode instead of dumping everything into one bucket.
 */

/** Coerce whatever Firestore/JS handed us into a Date, or null. */
export function toDate(value) {
  if (!value) return null;
  if (typeof value === "object") {
    if (typeof value.toDate === "function") return value.toDate();
    if (value instanceof Date) return value;
    if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
  }
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

const UNITS = { m: 60e3, h: 3600e3, d: 86400e3, w: 604800e3 };

/** Approximate a Date from a legacy "… · 3d ago" meta string. */
function fromLegacyMeta(meta) {
  if (typeof meta !== "string") return null;
  const tail = meta.split("·")[1]?.trim().toLowerCase() ?? "";
  if (!tail) return null;
  if (tail.includes("just now")) return new Date();
  const match = tail.match(/(\d+)\s*([mhdw])\s*ago/);
  if (!match) return null;
  const [, amount, unit] = match;
  return new Date(Date.now() - Number(amount) * UNITS[unit]);
}

/** Best available date for a post. */
export function postDate(post) {
  return toDate(post?.createdAt) ?? fromLegacyMeta(post?.author?.meta);
}

/** "just now" / "4h ago" / "3d ago" / "Aug 2026" */
export function relativeTime(date) {
  if (!date) return "";
  const elapsed = Date.now() - date.getTime();
  if (elapsed < 60e3) return "just now";
  if (elapsed < UNITS.h) return `${Math.floor(elapsed / UNITS.m)}m ago`;
  if (elapsed < UNITS.d) return `${Math.floor(elapsed / UNITS.h)}h ago`;
  if (elapsed < 7 * UNITS.d) return `${Math.floor(elapsed / UNITS.d)}d ago`;
  if (elapsed < 5 * UNITS.w) return `${Math.floor(elapsed / UNITS.w)}w ago`;
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

/** Heading a post files under on the archive: "August 2026". */
export function monthLabel(date) {
  if (!date) return "Undated";
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/**
 * The contributor's field. Prefer the post's headline tag; fall back to the
 * text before the "·" in the legacy meta string.
 */
export function authorField(post) {
  return (
    post?.tags?.[0]?.label ||
    post?.author?.meta?.split("·")[0]?.trim() ||
    "Research"
  );
}
