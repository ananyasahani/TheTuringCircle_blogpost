"use client";

import { useEffect, useState } from "react";
import { FloatingMenu } from "@tiptap/react/menus";

/**
 * The insert mark that appears on an empty line and expands into a palette of
 * block inserts. Set in uppercase mono and divided by hairlines rather than
 * rendered as icon bubbles, so it reads as compositor's furniture rather than
 * app chrome. Collapses again after an insert, or via the mark itself.
 *
 * Image insertion takes a URL rather than a file upload: Firebase Storage
 * requires the Blaze plan, which this project has not enabled.
 */
export default function InsertMenu({ editor }) {
  const [open, setOpen] = useState(false);

  // The expanded row sits across the empty line it was opened on, which is
  // exactly where the placeholder renders. Flag the document while the row is
  // open so the placeholder can step out of the way.
  useEffect(() => {
    const dom = editor?.view?.dom;
    if (!dom) return undefined;
    dom.classList.toggle("is-inserting", open);
    return () => dom.classList.remove("is-inserting");
  }, [editor, open]);

  if (!editor) return null;

  const chain = () => editor.chain().focus();
  const close = () => setOpen(false);

  const promptFor = (label, apply) => {
    const value = window.prompt(label);
    if (value?.trim()) apply(value.trim());
    close();
  };

  return (
    <FloatingMenu
      editor={editor}
      options={{ placement: "left-start", offset: 12 }}
      shouldShow={({ editor: instance, state }) => {
        const { $from, empty } = state.selection;
        return (
          empty &&
          $from.parent.type.name === "paragraph" &&
          $from.parent.content.size === 0 &&
          instance.isEditable
        );
      }}
      className={`tc-insert${open ? " is-open" : ""}`}
    >
      <button
        type="button"
        className="tc-insert-toggle"
        onClick={() => setOpen((current) => !current)}
        title={open ? "Close" : "Insert"}
        aria-expanded={open}
      >
        <span className="tc-insert-mark" aria-hidden="true">
          {open ? "\u00d7" : "+"}
        </span>
        {!open && <span className="tc-insert-label">Insert</span>}
      </button>

      {open && (
        <div className="tc-insert-row">
          <button
            type="button"
            title="Image from URL"
            onClick={() =>
              promptFor("Image URL", (src) => chain().setImage({ src }).run())
            }
          >
            Image
          </button>
          <button
            type="button"
            title="YouTube video"
            onClick={() =>
              promptFor("YouTube URL", (src) =>
                chain().setYoutubeVideo({ src }).run(),
              )
            }
          >
            Video
          </button>
          <button
            type="button"
            title="Embed (gist, CodePen, Vimeo…)"
            onClick={() =>
              promptFor("URL to embed", (src) => chain().insertEmbed({ src }).run())
            }
          >
            Embed
          </button>
          <button
            type="button"
            title="Code block"
            onClick={() => {
              chain().toggleCodeBlock().run();
              close();
            }}
          >
            Code
          </button>
          <button
            type="button"
            title="Divider"
            onClick={() => {
              chain().setHorizontalRule().run();
              close();
            }}
          >
            Rule
          </button>
          <button
            type="button"
            title="LaTeX block"
            onClick={() => {
              chain().insertMathBlock({ latex: "" }).run();
              close();
            }}
          >
            Math
          </button>
        </div>
      )}
    </FloatingMenu>
  );
}
