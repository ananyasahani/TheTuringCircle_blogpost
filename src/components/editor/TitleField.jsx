"use client";

import { useEffect, useRef } from "react";

/**
 * The post title. Deliberately a plain controlled textarea rather than a node
 * inside the ProseMirror document — that keeps Enter/placeholder behaviour
 * simple and lets the title save independently of the body.
 */
export default function TitleField({ value, onChange, onEnter }) {
  const ref = useRef(null);

  // Auto-grow to fit the text rather than scrolling inside a fixed box.
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="tc-editor-title"
      value={value}
      rows={1}
      placeholder="Title"
      spellCheck
      onChange={(event) => onChange(event.target.value.replace(/\n/g, ""))}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onEnter?.();
        }
      }}
      aria-label="Post title"
    />
  );
}
