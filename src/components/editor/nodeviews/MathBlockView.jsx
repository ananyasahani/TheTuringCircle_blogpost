"use client";

import { useMemo, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import katex from "katex";

/**
 * Display maths. While editing, a monospace source box sits under a live
 * KaTeX preview; the raw LaTeX is the source of truth and is never rewritten
 * from the rendered output. Read-only mode shows the preview alone.
 */
export default function MathBlockView({ node, updateAttributes, editor }) {
  const latex = node.attrs.latex || "";
  const [open, setOpen] = useState(false);

  const html = useMemo(
    () =>
      katex.renderToString(latex || "\\square", {
        throwOnError: false,
        displayMode: true,
      }),
    [latex],
  );

  const editable = editor.isEditable;

  return (
    <NodeViewWrapper className="tc-math-block">
      <div
        className="tc-math-block-preview"
        onClick={() => editable && setOpen((current) => !current)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {editable && open && (
        <textarea
          className="tc-math-block-source"
          value={latex}
          spellCheck={false}
          rows={3}
          placeholder="\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}"
          onChange={(event) => updateAttributes({ latex: event.target.value })}
          aria-label="LaTeX source"
        />
      )}
      {editable && !open && (
        <p className="tc-math-block-hint">Click the formula to edit its source</p>
      )}
    </NodeViewWrapper>
  );
}
