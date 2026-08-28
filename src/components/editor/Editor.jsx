"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EditorContent, useEditor } from "@tiptap/react";
import { buildExtensions } from "./tiptap-config";
import TitleField from "./TitleField";
import { updateDraft } from "@/services/drafts.service";
import "katex/dist/katex.min.css";
import "./editor.css";

const AUTOSAVE_MS = 800;

/**
 * The writing surface: title, body, autosave, and the top bar. Menus are
 * mounted by the caller-facing children so this file stays about persistence.
 */
export default function Editor({ draft, onPublish, children }) {
  const [title, setTitle] = useState(draft.title || "");
  const [status, setStatus] = useState("saved");

  // Guards against the initial setContent triggering a pointless save, and
  // against overlapping writes while one is in flight.
  const hydrating = useRef(true);
  const timer = useRef(null);

  const editor = useEditor({
    extensions: buildExtensions(),
    content: typeof draft.content === "object" ? draft.content : undefined,
    // Required in the App Router: rendering immediately on the server
    // produces a hydration mismatch.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tc-editor-body",
        spellcheck: "true",
      },
    },
  });

  const save = useCallback(
    async (patch) => {
      setStatus("saving");
      try {
        await updateDraft(draft.id, patch);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    [draft.id],
  );

  const queueSave = useCallback(
    (patch) => {
      if (hydrating.current) return;
      setStatus("unsaved");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => save(patch), AUTOSAVE_MS);
    },
    [save],
  );

  // Body changes
  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => queueSave({ content: editor.getJSON() });
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
    };
  }, [editor, queueSave]);

  // Let the first render settle before autosave arms itself.
  useEffect(() => {
    if (!editor) return;
    const id = window.setTimeout(() => {
      hydrating.current = false;
    }, 0);
    return () => window.clearTimeout(id);
  }, [editor]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleTitle = (next) => {
    setTitle(next);
    queueSave({ title: next });
  };

  return (
    <div className="tc-editor-shell">
      <header className="tc-editor-bar">
        <Link href="/profile" className="tc-editor-back">
          ← Drafts
        </Link>
        <div className="tc-editor-bar-right">
          <span className={`tc-editor-status is-${status}`}>
            {
              {
                saved: "Saved",
                saving: "Saving…",
                unsaved: "Unsaved changes",
                error: "Save failed — retrying on next edit",
              }[status]
            }
          </span>
          <button
            type="button"
            className="tc-editor-publish"
            onClick={() => onPublish({ title, content: editor?.getJSON() })}
            disabled={!editor}
          >
            Publish
          </button>
        </div>
      </header>

      <main className="tc-editor-canvas">
        <TitleField
          value={title}
          onChange={handleTitle}
          onEnter={() => editor?.commands.focus("start")}
        />
        {editor && typeof children === "function" ? children(editor) : null}
        <EditorContent editor={editor} />
      </main>
    </div>
  );
}
