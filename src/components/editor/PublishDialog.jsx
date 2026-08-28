"use client";

import { useEffect, useState } from "react";
import { docFirstParagraph } from "./tiptap-config";
import { publishDraft, updatePublishedPost } from "@/services/drafts.service";

/**
 * Unsplash (and most photo sites) show an HTML *page* at the URL in the
 * address bar; the image itself lives on a different host. Pasting the page
 * URL is the single most common cover-image mistake, so it gets its own
 * message rather than a generic "couldn't load".
 */
function coverUrlProblem(url) {
  if (!url) return "";
  if (/^https?:\/\/(www\.)?unsplash\.com\/photos\//i.test(url)) {
    return "That's an Unsplash page, not the image. Right-click the photo → Copy image address (it should start with images.unsplash.com).";
  }
  if (/^https?:\/\/(www\.)?pexels\.com\//i.test(url)) {
    return "That's a Pexels page, not the image. Right-click the photo → Copy image address.";
  }
  if (/^http:\/\//i.test(url)) {
    return "Use an https:// link — browsers block insecure images on a secure page.";
  }
  return "";
}

/**
 * Collects the fields the reading pages need — excerpt, tags, cover — which
 * deliberately live here rather than in a sidebar, so the writing surface
 * stays clean. Excerpt is pre-filled from the first paragraph.
 */
export default function PublishDialog({
  draft,
  content,
  title,
  onClose,
  onPublished,
  /** "publish" for a draft going live, "update" for an existing post. */
  mode = "publish",
}) {
  const isUpdate = mode === "update";
  const [excerpt, setExcerpt] = useState(
    draft.excerpt || docFirstParagraph(content).slice(0, 280),
  );
  const [tags, setTags] = useState(
    (draft.tags || []).map((tag) => tag.label).join(", "),
  );
  const [image, setImage] = useState(draft.image || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Result of the last probe, tagged with the URL it was for. Keeping the URL
  // in state lets the status below be derived rather than set, which avoids
  // a synchronous setState inside the effect.
  const [probe, setProbe] = useState({ url: "", status: "idle" });

  const url = image.trim();
  const hint = coverUrlProblem(url);

  // Probe by actually loading the URL — the only reliable way to tell whether
  // a link is an image. Debounced so we don't fetch on every keystroke.
  useEffect(() => {
    if (!url || coverUrlProblem(url)) return undefined;
    let alive = true;
    const timer = window.setTimeout(() => {
      const probeImage = new window.Image();
      probeImage.onload = () => alive && setProbe({ url, status: "ok" });
      probeImage.onerror = () => alive && setProbe({ url, status: "bad" });
      probeImage.referrerPolicy = "no-referrer";
      probeImage.src = url;
    }, 400);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [url]);

  // "idle" | "checking" | "ok" | "bad"
  const cover = !url
    ? "idle"
    : hint
      ? "bad"
      : probe.url === url
        ? probe.status
        : "checking";

  const canPublish =
    title.trim() && excerpt.trim() && cover === "ok" && !busy;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const parsedTags = tags
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean)
        .slice(0, 4)
        .map((label, index) => ({
          label,
          style: index === 0 ? "gold" : "muted",
        }));

      const meta = {
        excerpt: excerpt.trim(),
        image: image.trim(),
        tags: parsedTags,
      };
      const slug = isUpdate
        ? // Keeps the existing slug, so published links never break.
          await updatePublishedPost(draft.slug, title, content, meta)
        : await publishDraft({ ...draft, title, content }, meta);
      onPublished(slug);
    } catch (err) {
      setError(err?.message || "Could not publish. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="tc-dialog-backdrop" role="dialog" aria-modal="true">
      <form className="tc-dialog" onSubmit={submit}>
        <h2>{isUpdate ? "Update this post" : "Publish to the journal"}</h2>
        <p className="tc-dialog-deck">
          {isUpdate
            ? "Changes go live immediately. The post keeps its current link."
            : "These appear on the library and archive pages."}
        </p>

        <label htmlFor="pub-excerpt">Excerpt</label>
        <textarea
          id="pub-excerpt"
          rows={3}
          value={excerpt}
          maxLength={320}
          onChange={(event) => setExcerpt(event.target.value)}
          placeholder="One or two sentences describing the piece."
          required
        />

        <label htmlFor="pub-tags">Tags</label>
        <input
          id="pub-tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="Game Theory, Society"
        />
        <span className="tc-dialog-hint">
          Comma separated, up to four. The first is the headline tag.
        </span>

        <label htmlFor="pub-image">Cover image URL</label>
        {/* Deliberately type=text, not type=url: the browser's url validation
            rejects a relative path like /editorial/spiral.jpg, which is a
            perfectly good cover. The probe below is the real check. */}
        <input
          id="pub-image"
          type="text"
          value={image}
          onChange={(event) => setImage(event.target.value)}
          placeholder="https://… or /editorial/spiral.jpg"
          required
        />
        <span className="tc-dialog-hint">
          Required — a direct link to an image file, or a local path like
          /editorial/spiral.jpg
        </span>

        {hint && <p className="tc-dialog-error">{hint}</p>}

        {!hint && url && (
          <div className={`tc-cover-preview is-${cover}`}>
            {cover === "ok" ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={url} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span>
                {cover === "checking"
                  ? "Checking image…"
                  : "That URL didn't load as an image."}
              </span>
            )}
          </div>
        )}

        {error && <p className="tc-dialog-error">{error}</p>}

        <div className="tc-dialog-actions">
          <button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="submit"
            className="tc-dialog-primary"
            disabled={!canPublish}
          >
            {busy
              ? isUpdate
                ? "Saving…"
                : "Publishing…"
              : isUpdate
                ? "Save changes"
                : "Publish"}
          </button>
        </div>
      </form>
    </div>
  );
}
