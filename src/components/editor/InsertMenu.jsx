"use client";

import { useEffect, useState } from "react";
import { FloatingMenu } from "@tiptap/react/menus";

const Icon = ({ name }) => (
  <span className="material-symbols-outlined" aria-hidden="true">
    {name}
  </span>
);

/**
 * The `+` that appears on an empty line and expands into a row of block
 * inserts. Collapses again after an insert, or via the X.
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
        <Icon name={open ? "close" : "add"} />
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
            <Icon name="image" />
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
            <Icon name="smart_display" />
          </button>
          <button
            type="button"
            title="Embed (gist, CodePen, Vimeo…)"
            onClick={() =>
              promptFor("URL to embed", (src) => chain().insertEmbed({ src }).run())
            }
          >
            <Icon name="frame_source" />
          </button>
          <button
            type="button"
            title="Code block"
            onClick={() => {
              chain().toggleCodeBlock().run();
              close();
            }}
          >
            <Icon name="code" />
          </button>
          <button
            type="button"
            title="Divider"
            onClick={() => {
              chain().setHorizontalRule().run();
              close();
            }}
          >
            <Icon name="horizontal_rule" />
          </button>
          <button
            type="button"
            title="LaTeX block"
            onClick={() => {
              chain().insertMathBlock({ latex: "" }).run();
              close();
            }}
          >
            <Icon name="functions" />
          </button>
        </div>
      )}
    </FloatingMenu>
  );
}
