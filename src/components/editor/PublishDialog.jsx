"use client";

import { useState } from "react";
import { docFirstParagraph } from "./tiptap-config";
import { publishDraft } from "@/services/drafts.service";

/**
 * Collects the fields the reading pages need — excerpt, tags, cover — which
 * deliberately live here rather than in a sidebar, so the writing surface
 * stays clean. Excerpt is pre-filled from the first paragraph.
 */
export default function PublishDialog({ draft, content, title, onClose, onPublished }) {
  const [excerpt, setExcerpt] = useState(
    draft.excerpt || docFirstParagraph(content).slice(0, 280),
  );
  const [tags, setTags] = useState(
    (draft.tags || []).map((tag) => tag.label).join(", "),
  );
  const [image, setImage] = useState(draft.image || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canPublish = title.trim() && excerpt.trim() && image.trim() && !busy;

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

      const slug = await publishDraft(
        { ...draft, title, content },
        { excerpt: excerpt.trim(), image: image.trim(), tags: parsedTags },
      );
      onPublished(slug);
    } catch (err) {
      setError(err?.message || "Could not publish. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="tc-dialog-backdrop" role="dialog" aria-modal="true">
      <form className="tc-dialog" onSubmit={submit}>
        <h2>Publish to the journal</h2>
        <p className="tc-dialog-deck">
          These appear on the library and archive pages.
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
        <input
          id="pub-image"
          type="url"
          value={image}
          onChange={(event) => setImage(event.target.value)}
          placeholder="https://… or /editorial/spiral.jpg"
          required
        />
        <span className="tc-dialog-hint">
          Required — the homepage cards are built around a cover image.
        </span>

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
            {busy ? "Publishing…" : "Publish"}
          </button>
        </div>
      </form>
    </div>
  );
}
