"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EditorContent, useEditor } from "@tiptap/react";
import { buildExtensions, legacyTextToDoc } from "./tiptap-config";
import TitleField from "./TitleField";
import "katex/dist/katex.min.css";
import "./editor.css";

const AUTOSAVE_MS = 800;

/**
 * The writing surface: title, body, autosave, and the top bar.
 *
 * `save` is injected rather than hardcoded so the same editor drives both an
 * unpublished draft and a live post — the caller decides which collection the
 * patch lands in.
 */
export default function Editor({
  draft,
  save: persist,
  onPublish,
  publishLabel = "Publish",
  notice,
  children,
}) {
  const [title, setTitle] = useState(draft.title || "");
  const [status, setStatus] = useState("saved");

  // Guards against the initial setContent triggering a pointless save, and
  // against overlapping writes while one is in flight.
  const hydrating = useRef(true);
  const timer = useRef(null);
  // Fields edited since the last write. Accumulated rather than replaced:
  // one timer serves both the title and the body, so a patch that replaced
  // the pending one would throw away whichever field was edited first.
  const pending = useRef({});

  const editor = useEditor({
    extensions: buildExtensions(),
    // A seeded essay stores markdown-ish text rather than a document; convert
    // it so the editor opens with the real prose instead of a blank page that
    // the first autosave would write over the top of it.
    content:
      draft.content && typeof draft.content === "object"
        ? draft.content
        : legacyTextToDoc(draft.content),
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

  /**
   * Write everything edited since the last successful save. The pending set
   * is cleared only once the write lands, so a failure leaves the fields
   * queued and the next edit retries them rather than dropping them.
   */
  const flush = useCallback(async () => {
    const patch = pending.current;
    if (Object.keys(patch).length === 0) return;
    setStatus("saving");
    try {
      await persist(patch);
      // Anything edited while the write was in flight stays pending.
      for (const key of Object.keys(patch)) {
        if (pending.current[key] === patch[key]) delete pending.current[key];
      }
      setStatus(Object.keys(pending.current).length ? "unsaved" : "saved");
    } catch {
      setStatus("error");
    }
  }, [persist]);

  const queueSave = useCallback(
    (patch) => {
      if (hydrating.current) return;
      pending.current = { ...pending.current, ...patch };
      setStatus("unsaved");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, AUTOSAVE_MS);
    },
    [flush],
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

  /**
   * Don't let the tab close over unsaved work. The autosave window is short,
   * but a failed write can leave an edit pending indefinitely, and the only
   * other signal is a small label in the corner of the bar.
   */
  useEffect(() => {
    if (status !== "unsaved" && status !== "error") return undefined;
    const warn = (event) => {
      event.preventDefault();
      // Browsers show their own wording; a non-empty value is what arms it.
      event.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

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
            {publishLabel}
          </button>
        </div>
      </header>

      <main className="tc-editor-canvas">
        {notice && <p className="tc-editor-notice">{notice}</p>}
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
