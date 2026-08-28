"use client";

import { NodeViewWrapper } from "@tiptap/react";
import { embedSrc } from "../extensions/Embed";

/**
 * Renders an allowlisted provider in a sandboxed iframe. Anything the
 * allowlist doesn't recognise falls back to a plain link card rather than
 * being injected as markup.
 */
export default function EmbedView({ node }) {
  const src = node.attrs.src || "";
  const resolved = embedSrc(src);

  if (!resolved) {
    return (
      <NodeViewWrapper className="tc-embed tc-embed-fallback">
        <a href={src} target="_blank" rel="noreferrer noopener">
          {src || "Empty embed"}
        </a>
        <span>This link isn&apos;t from a supported embed provider.</span>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="tc-embed">
      <iframe
        src={resolved}
        title="Embedded content"
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        referrerPolicy="no-referrer"
allowFullScreen
      />
    </NodeViewWrapper>
  );
}
