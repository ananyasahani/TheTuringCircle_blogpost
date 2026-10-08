/**
 * Server-side reads of the `published` collection, over the Firestore REST API.
 *
 * The post page has to resolve its post BEFORE responding, so that the HTML
 * carries the article, the right <title>, and a real 404 when there is no such
 * post. The client SDK is the wrong tool for that: it opens a streaming
 * connection built for a browser session, which a request-scoped server render
 * has no use for. REST is a single cacheable GET, needs no service account, and
 * works with the public API key because `published` is world-readable.
 *
 * Reads only. Everything that writes still goes through the client SDK, where
 * the security rules see a signed-in user.
 */

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "the-turing-circle";
const KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const ROOT = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

/**
 * Firestore REST wraps every value in a type tag — {stringValue: "x"},
 * {arrayValue: {values: [...]}} and so on. Unwrap the whole tree back into
 * plain JS so the rest of the app sees the same shape the client SDK returns.
 */
function decode(value) {
  if (!value || typeof value !== "object") return null;
  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  // Left as the ISO string it arrives as: lib/postDate parses that already.
  if ("timestampValue" in value) return value.timestampValue;
  if ("mapValue" in value) return decodeFields(value.mapValue?.fields);
  if ("arrayValue" in value) {
    return (value.arrayValue?.values ?? []).map(decode);
  }
  return null;
}

function decodeFields(fields) {
  const out = {};
  for (const [key, value] of Object.entries(fields ?? {})) {
    out[key] = decode(value);
  }
  return out;
}

/** Document id from the REST `name` path. */
const idOf = (doc) => String(doc?.name ?? "").split("/").pop();

/**
 * One published post by slug, or null.
 *
 * `no-store` because a post edited in the editor must be correct on the very
 * next request — a stale cached copy of someone's own post reads as a bug.
 */
export async function fetchPost(slug) {
  if (!KEY || !slug) return null;
  try {
    const response = await fetch(
      `${ROOT}/published/${encodeURIComponent(slug)}?key=${KEY}`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const doc = await response.json();
    const data = decodeFields(doc.fields);
    if (data.visible === false) return null;
    return { id: idOf(doc), ...data };
  } catch {
    // Network or JSON failure. The caller renders a 404 rather than guessing.
    return null;
  }
}

/** Every visible published post. Used by the sitemap. */
export async function fetchAllPosts() {
  if (!KEY) return [];
  try {
    const response = await fetch(`${ROOT}/published?key=${KEY}&pageSize=300`, {
      // The sitemap can afford to be an hour stale; crawlers re-read it.
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const body = await response.json();
    return (body.documents ?? [])
      .map((doc) => ({ id: idOf(doc), ...decodeFields(doc.fields) }))
      .filter((post) => post.visible !== false);
  } catch {
    return [];
  }
}

/** Plain-text title, whether the post stores a string or a [lead, tail] pair. */
export function titleText(post) {
  const title = post?.title;
  if (Array.isArray(title)) return title.join("");
  return typeof title === "string" ? title : "Untitled";
}
