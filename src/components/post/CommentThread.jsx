"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  addComment,
  deleteComment,
  listComments,
} from "@/services/comments.service";
import { useAuth } from "@/components/providers/AuthProvider";
import { postDate, relativeTime } from "@/lib/postDate";

/**
 * Flat, chronological discussion under a post.
 *
 * The count shown here is the real number of documents, which is why it is
 * only rendered on the post page: the thread is loaded anyway, whereas
 * showing counts on the library or archive would mean a read per post (a
 * denormalised counter isn't possible — a commenter can't write to the post
 * document under the current rules).
 */
export default function CommentThread({ slug }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!slug) return;
    listComments(slug)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoaded(true));
  }, [slug]);

  useEffect(load, [load]);

  const submit = async (event) => {
    event.preventDefault();
    if (!user) return;
    setError("");
    setBusy(true);
    try {
      await addComment(slug, user, draft);
      setDraft("");
      load();
    } catch (err) {
      setError(err?.message || "Could not post your comment.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await deleteComment(slug, id);
      load();
    } catch {
      setError("Could not delete that comment.");
    }
  };

  // The rules permit deletion by the comment's author or a moderator.
  const canDelete = (comment) =>
    user && (user.uid === comment.authorId || user.role === "moderator");

  return (
    <section className="comments" aria-label="Discussion">
      <h2 className="comments-heading">
        {loaded
          ? comments.length === 1
            ? "1 comment"
            : `${comments.length} comments`
          : "Comments"}
      </h2>

      {user ? (
        <form className="comment-form" onSubmit={submit}>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add to the discussion…"
            rows={3}
            maxLength={2000}
            aria-label="Your comment"
          />
          <div className="comment-form-actions">
            <span>{draft.trim().length > 0 && `${draft.trim().length}/2000`}</span>
            <button type="submit" disabled={busy || !draft.trim()}>
              {busy ? "Posting…" : "Post comment"}
            </button>
          </div>
        </form>
      ) : (
        <p className="comments-signin">
          <Link href={`/login?next=${encodeURIComponent(`/post/${slug}`)}`}>
            Sign in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      {error && <p className="comments-error">{error}</p>}

      {loaded && comments.length === 0 && (
        <p className="comments-empty">
          No comments yet. Be the first to respond.
        </p>
      )}

      <ul className="comment-list">
        {comments.map((comment) => (
          <li key={comment.id} className="comment">
            {comment.authorAvatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={comment.authorAvatar}
                alt=""
                className="comment-avatar"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="comment-avatar comment-avatar-initials">
                {comment.authorInitials}
              </div>
            )}

            <div className="comment-body">
              <div className="comment-meta">
                <span className="comment-author">{comment.authorName}</span>
                <span className="comment-time">
                  {relativeTime(postDate({ createdAt: comment.createdAt }))}
                </span>
                {canDelete(comment) && (
                  <button type="button" onClick={() => remove(comment.id)}>
                    Delete
                  </button>
                )}
              </div>
              <p className="comment-text">{comment.content}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
