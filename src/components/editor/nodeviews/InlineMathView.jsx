"use client";

import { useEffect, useRef, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import katex from "katex";

/**
 * Renders inline maths with KaTeX; click to edit the raw LaTeX in place.
 * `throwOnError: false` is essential — one malformed formula must never take
 * the whole editor down.
 */
export default function InlineMathView({ node, updateAttributes, editor }) {
  const latex = node.attrs.latex || "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(latex);
  const inputRef = useRef(null);

  useEffect(() => {
    setDraft(latex);
  }, [latex]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    updateAttributes({ latex: draft });
    setEditing(false);
  };

  if (editing) {
    return (
      <NodeViewWrapper as="span" className="tc-inline-math is-editing">
        <input
          ref={inputRef}
          className="tc-math-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setDraft(latex);
              setEditing(false);
            }
          }}
          aria-label="Inline LaTeX source"
        />
      </NodeViewWrapper>
    );
  }

  const html = katex.renderToString(latex || "\\square", {
    throwOnError: false,
    displayMode: false,
  });

  return (
    <NodeViewWrapper
      as="span"
      className="tc-inline-math"
      onClick={() => {
        if (editor.isEditable) setEditing(true);
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
