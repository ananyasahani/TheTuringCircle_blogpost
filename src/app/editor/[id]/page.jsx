"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getDraft } from "@/services/drafts.service";
import Editor from "@/components/editor/Editor";
import PublishDialog from "@/components/editor/PublishDialog";
import HighlightMenu from "@/components/editor/HighlightMenu";
import InsertMenu from "@/components/editor/InsertMenu";

export default function EditorPage() {
  const { user, loading } = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [draft, setDraft] = useState(null);
  const [state, setState] = useState("loading");
  const [publishing, setPublishing] = useState(null);

  useEffect(() => {
    if (!user || !id) return;
    let alive = true;
    getDraft(id)
      .then((found) => {
        if (!alive) return;
        if (!found) return setState("missing");
        if (found.authorId !== user.uid) return setState("forbidden");
        setDraft(found);
        setState("ready");
      })
      .catch(() => alive && setState("missing"));
    return () => {
      alive = false;
    };
  }, [user, id]);

  if (loading || !user) return null;

  if (state !== "ready") {
    return (
      <div className="tc-editor-shell">
        <main className="tc-editor-canvas">
          <h1 className="subpage-title">
            {state === "forbidden" ? "Not your draft" : "Draft not found"}
          </h1>
          <p className="subpage-subtitle">
            {state === "loading"
              ? "Opening…"
              : state === "forbidden"
                ? "This draft belongs to another member."
                : "It may have been published or deleted."}
          </p>
          <p style={{ marginTop: "2rem" }}>
            <Link href="/profile" className="back-link">
              ← Back to your drafts
            </Link>
          </p>
        </main>
      </div>
    );
  }

  return (
    <>
      <Editor
        draft={draft}
        onPublish={({ title, content }) => setPublishing({ title, content })}
      >
        {(editor) => (
          <>
            <HighlightMenu editor={editor} />
            <InsertMenu editor={editor} />
          </>
        )}
      </Editor>
      {publishing && (
        <PublishDialog
          draft={draft}
          title={publishing.title}
          content={publishing.content}
          onClose={() => setPublishing(null)}
          onPublished={(slug) => router.push(`/post/${slug}`)}
        />
      )}
    </>
  );
}
