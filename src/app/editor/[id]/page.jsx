"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { useAuth } from "@/components/providers/AuthProvider";
import { publishPost, slugify } from "@/services/posts.service";

export default function EditorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [image, setImage] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Editor is for signed-in members only.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const previewSlug = title ? slugify(title) : "";

  const handlePublish = async () => {
    setError("");
    setBusy(true);
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((label, i) => ({ label, style: i === 0 ? "gold" : "muted" }));

      const slug = await publishPost(
        { title, excerpt, content, image, tags: tagList },
        { uid: user.uid, name: user.name, avatar: user.avatar },
      );
      router.push(`/post/${slug}`);
    } catch (err) {
      setError(err?.message || "Could not publish. Try again.");
      setBusy(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="editor-shell">
        <Navbar />
        <div className="editor-gate">Checking your session…</div>
      </div>
    );
  }

  return (
    <div className="editor-shell">
      <Navbar />
      <main className="editor-main">
        <div className="editor-head">
          <Link href="/profile" className="editor-back">
            ← Back to profile
          </Link>
          <button
            className="editor-publish"
            onClick={handlePublish}
            disabled={busy || !title.trim() || !content.trim()}
          >
            {busy ? "Publishing…" : "Publish"}
          </button>
        </div>

        {error && <p className="editor-error">{error}</p>}

        <input
          className="editor-title"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {previewSlug && <p className="editor-slug">/post/{previewSlug}</p>}

        <textarea
          className="editor-excerpt"
          placeholder="A one-line summary (shown in the feed)…"
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />

        <div className="editor-fields">
          <input
            className="editor-field"
            placeholder="Featured image URL (drives the post's liquid backdrop)"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
          <input
            className="editor-field"
            placeholder="Tags, comma separated (e.g. Math, Proof)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div className="editor-body">
          <TiptapEditor
            value={content}
            onChange={setContent}
            placeholder="Write your essay. Use the heading button for section titles…"
          />
        </div>
      </main>
    </div>
  );
}
