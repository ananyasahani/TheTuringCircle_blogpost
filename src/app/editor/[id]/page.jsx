"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { canWrite } from "@/services/auth.service";
import {
  getDraft,
  getPublishedForEdit,
  updateDraft,
  updatePublished,
} from "@/services/drafts.service";
import Editor from "@/components/editor/Editor";
import PublishDialog from "@/components/editor/PublishDialog";
import HighlightMenu from "@/components/editor/HighlightMenu";
import InsertMenu from "@/components/editor/InsertMenu";

export default function EditorPage() {
  const { user, loading } = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  // { kind: "draft" | "published", data }
  const [record, setRecord] = useState(null);
  const [state, setState] = useState("loading");
  const [publishing, setPublishing] = useState(null);

  useEffect(() => {
    if (!user || !id) return undefined;
    let alive = true;

    (async () => {
      try {
        // Published is checked FIRST because its read rule is `if true`, so a
        // miss comes back as a clean "doesn't exist". The drafts read rule
        // dereferences resource.data, which *throws* permission-denied for a
        // document that isn't there — probing drafts first made every
        // published post look deleted.
        const published = await getPublishedForEdit(id);
        const found = published
          ? { kind: "published", data: published }
          : await getDraft(id)
              .then((draft) => (draft ? { kind: "draft", data: draft } : null))
              // A rules error here just means "not a draft".
              .catch(() => null);

        if (!alive) return;
        if (!found) return setState("missing");
        if (found.data.authorId !== user.uid) return setState("forbidden");
        setRecord(found);
        setState("ready");
      } catch {
        if (alive) setState("missing");
      }
    })();

    return () => {
      alive = false;
    };
  }, [user, id]);

  const isPublished = record?.kind === "published";

  const save = useCallback(
    (patch) =>
      isPublished ? updatePublished(id, patch) : updateDraft(id, patch),
    [isPublished, id],
  );

  if (loading || !user) return null;

  // Signed in, but not allowed to author anything.
  if (!canWrite(user)) {
    return (
      <div className="tc-editor-shell">
        <main className="tc-editor-canvas">
          <h1 className="subpage-title">Writing is for editors</h1>
          <p className="subpage-subtitle">
            Your account can read and comment. Ask a moderator to give you
            editor access if you would like to write for the journal.
          </p>
          <p style={{ marginTop: "2rem" }}>
            <Link href="/" className="back-link">
              ← Back to the journal
            </Link>
          </p>
        </main>
      </div>
    );
  }

  // Still fetching. This needs its own branch: the card below is a dead end
  // ("Nothing to edit", with a link back to the profile), and showing it while
  // the document is still on its way reads as an error every single time you
  // open the editor.
  if (state === "loading") {
    return (
      <div className="tc-editor-shell">
        <main className="tc-editor-canvas">
          <p className="subpage-subtitle">Opening…</p>
        </main>
      </div>
    );
  }

  if (state !== "ready") {
    return (
      <div className="tc-editor-shell">
        <main className="tc-editor-canvas">
          <h1 className="subpage-title">
            {state === "forbidden" ? "Not yours to edit" : "Nothing to edit"}
          </h1>
          <p className="subpage-subtitle">
            {state === "forbidden"
              ? "This piece belongs to another member."
              : "It may have been deleted."}
          </p>
          <p style={{ marginTop: "2rem" }}>
            <Link href="/profile" className="back-link">
              ← Back to your profile
            </Link>
          </p>
        </main>
      </div>
    );
  }

  return (
    <>
      <Editor
        draft={record.data}
        save={save}
        publishLabel={isPublished ? "Update details" : "Publish"}
        notice={
          isPublished
            ? "You are editing a published post — changes save straight to the live journal."
            : null
        }
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
          draft={record.data}
          title={publishing.title}
          content={publishing.content}
          mode={isPublished ? "update" : "publish"}
          onClose={() => setPublishing(null)}
          onPublished={(slug) => router.push(`/post/${slug}`)}
        />
      )}
    </>
  );
}
