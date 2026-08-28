"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { buildReadOnlyExtensions } from "./tiptap-config";
import "katex/dist/katex.min.css";
import "./editor.css";

/**
 * Renders a TipTap document for reading. Uses a non-editable editor with the
 * SAME extensions array as the writing surface, so custom nodes (maths,
 * embeds, highlighted code) render identically to how they were authored
 * without re-implementing each one's static output.
 *
 * Blocks reveal on scroll from alternating sides, matching the framer-motion
 * `Reveal` the legacy markdown-ish posts use.
 */
export default function PublishedContent({ doc }) {
  const wrapper = useRef(null);

  const editor = useEditor({
    extensions: buildReadOnlyExtensions(),
    content: doc,
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { class: "tc-editor-body tc-published-body" } },
  });

  useEffect(() => {
    if (!editor) return undefined;
    const root = wrapper.current?.querySelector(".tc-published-body");
    if (!root) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    // Opt in from JS: the hidden state is scoped to this class, so if the
    // script never runs the prose is simply visible rather than blank.
    root.classList.add("is-reveal-ready");

    const blocks = Array.from(root.children);
    blocks.forEach((block, index) => {
      block.style.setProperty("--reveal-x", index % 2 === 0 ? "-44px" : "44px");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 },
    );

    blocks.forEach((block) => observer.observe(block));
    return () => observer.disconnect();
  }, [editor, doc]);

  if (!editor) return null;

  return (
    <div ref={wrapper}>
      <EditorContent editor={editor} />
    </div>
  );
}
