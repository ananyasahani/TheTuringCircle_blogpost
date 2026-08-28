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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      // Deliberately low: a block taller than the viewport can never reach a
      // high ratio, and would otherwise stay hidden forever.
      { threshold: 0.08 },
    );

    /**
     * Hide-then-reveal is applied per block, never to the container. A block
     * we never got to therefore stays visible — the failure mode is "no
     * animation", not "no article".
     */
    let index = 0;
    const arm = () => {
      Array.from(root.children).forEach((block) => {
        if (block.classList.contains("tc-reveal")) return;
        block.style.setProperty(
          "--reveal-x",
          index % 2 === 0 ? "-44px" : "44px",
        );
        index += 1;
        block.classList.add("tc-reveal");
        observer.observe(block);
      });
    };

    // ProseMirror fills the DOM after mount (immediatelyRender:false), so the
    // children may not exist yet on this pass; watch for them arriving.
    arm();
    const mutations = new MutationObserver(arm);
    mutations.observe(root, { childList: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [editor, doc]);

  if (!editor) return null;

  return (
    <div ref={wrapper}>
      <EditorContent editor={editor} />
    </div>
  );
}
