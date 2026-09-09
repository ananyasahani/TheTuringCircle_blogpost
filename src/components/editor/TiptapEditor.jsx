"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

/**
 * A small rich-text editor tuned to the journal's storage format.
 *
 * Posts are stored and rendered as PLAIN TEXT, not HTML: paragraphs separated
 * by blank lines, and H3 headings prefixed with "### " (see the post page's
 * `content.split("\n\n")` renderer). So this editor serializes its document to
 * that exact shape via `onChange`, keeping the writing experience rich while
 * staying compatible with how posts render.
 */
export default function TiptapEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
        // keep it deliberately simple — the renderer only knows H3 + paragraphs
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || "Start writing…",
      }),
    ],
    editorProps: {
      attributes: { class: "tiptap-surface" },
    },
    onUpdate: ({ editor }) => {
      onChange?.(serialize(editor));
    },
  });

  // Load initial value once the editor exists (e.g. editing an existing draft).
  useEffect(() => {
    if (editor && value && editor.isEmpty) {
      editor.commands.setContent(deserialize(value));
    }
    // only on mount / editor ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  return <EditorContent editor={editor} />;
}

/** Editor doc → the journal's "### heading" + blank-line-paragraph text form. */
function serialize(editor) {
  const json = editor.getJSON();
  const blocks = (json.content || []).map((node) => {
    const text = (node.content || []).map((c) => c.text || "").join("");
    if (node.type === "heading") return `### ${text}`;
    return text;
  });
  return blocks.join("\n\n").trim();
}

/** Journal text form → editor HTML (H3 lines become <h3>, rest paragraphs). */
function deserialize(text) {
  return text
    .split("\n\n")
    .map((block) => {
      if (block.startsWith("### ")) {
        return `<h3>${escapeHtml(block.slice(4))}</h3>`;
      }
      return `<p>${escapeHtml(block)}</p>`;
    })
    .join("");
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
