"use client";

import { useState } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import { useEditorState } from "@tiptap/react";
import LinkPopover from "./LinkPopover";

const Icon = ({ name }) => (
  <span className="material-symbols-outlined" aria-hidden="true">
    {name}
  </span>
);

/**
 * The formatting pill that appears over a text selection.
 *
 * Active states come from useEditorState — a plain component would not
 * re-render as the selection moves, so the buttons would look stuck.
 */
export default function HighlightMenu({ editor }) {
  const [linking, setLinking] = useState(false);

  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      bold: instance.isActive("bold"),
      italic: instance.isActive("italic"),
      link: instance.isActive("link"),
      h2: instance.isActive("heading", { level: 2 }),
      h3: instance.isActive("heading", { level: 3 }),
      quote: instance.isActive("blockquote"),
      href: instance.getAttributes("link").href || "",
    }),
  });

  if (!editor) return null;

  const chain = () => editor.chain().focus();

  const applyLink = (url) => {
    if (!url) {
      chain().extendMarkRange("link").unsetLink().run();
    } else {
      const safe = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      chain().extendMarkRange("link").setLink({ href: safe }).run();
    }
    setLinking(false);
  };

  const wrapAsMath = () => {
    const { from, to } = editor.state.selection;
    const latex = editor.state.doc.textBetween(from, to, " ");
    chain().deleteSelection().insertInlineMath({ latex }).run();
  };

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor: instance, from, to }) =>
        // Text selections only — an image or maths node has its own affordances.
        from !== to && !instance.isActive("mathBlock") && !instance.isActive("embed")
      }
      className="tc-bubble"
    >
      {linking ? (
        <LinkPopover
          initial={state.href}
          onApply={applyLink}
          onRemove={() => applyLink("")}
          onCancel={() => setLinking(false)}
        />
      ) : (
        <>
          <button
            type="button"
            className={state.bold ? "is-active" : ""}
            onClick={() => chain().toggleBold().run()}
            title="Bold"
          >
            <Icon name="format_bold" />
          </button>
          <button
            type="button"
            className={state.italic ? "is-active" : ""}
            onClick={() => chain().toggleItalic().run()}
            title="Italic"
          >
            <Icon name="format_italic" />
          </button>
          <button
            type="button"
            className={state.link ? "is-active" : ""}
            onClick={() => setLinking(true)}
            title="Link"
          >
            <Icon name="link" />
          </button>

          <span className="tc-bubble-divider" />

          <button
            type="button"
            className={state.h2 ? "is-active" : ""}
            onClick={() => chain().toggleHeading({ level: 2 }).run()}
            title="Heading"
          >
            <Icon name="format_h1" />
          </button>
          <button
            type="button"
            className={state.h3 ? "is-active" : ""}
            onClick={() => chain().toggleHeading({ level: 3 }).run()}
            title="Subheading"
          >
            <Icon name="format_h2" />
          </button>
          <button
            type="button"
            className={state.quote ? "is-active" : ""}
            onClick={() => chain().toggleBlockquote().run()}
            title="Quote"
          >
            <Icon name="format_quote" />
          </button>

          <span className="tc-bubble-divider" />

          <button type="button" onClick={wrapAsMath} title="Inline LaTeX">
            <Icon name="functions" />
          </button>
        </>
      )}
    </BubbleMenu>
  );
}
