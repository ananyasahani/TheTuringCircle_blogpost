"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { buildReadOnlyExtensions } from "./tiptap-config";
import "katex/dist/katex.min.css";
import "./editor.css";

/**
 * Renders a TipTap document for reading. Uses a non-editable editor with the
 * SAME extensions array as the writing surface, so custom nodes (maths,
 * embeds, highlighted code) render identically to how they were authored
 * without re-implementing each one's static output.
 */
export default function PublishedContent({ doc }) {
  const editor = useEditor({
    extensions: buildReadOnlyExtensions(),
    content: doc,
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { class: "tc-editor-body tc-published-body" } },
  });

  if (!editor) return null;
  return <EditorContent editor={editor} />;
}
