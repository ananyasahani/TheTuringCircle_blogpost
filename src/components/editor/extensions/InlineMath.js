import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import InlineMathView from "../nodeviews/InlineMathView";

/**
 * Inline LaTeX, rendered with KaTeX. Atomic: the raw `latex` string is the
 * source of truth and lives in an attribute, so it survives save → reload →
 * edit untouched. `renderHTML` carries it into static output; the node view
 * handles interactive editing.
 */
export const InlineMath = Node.create({
  name: "inlineMath",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-latex") || "",
        renderHTML: (attributes) => ({ "data-latex": attributes.latex }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-inline-math]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-inline-math": "" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineMathView);
  },

  addCommands() {
    return {
      insertInlineMath:
        (attributes = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { latex: attributes.latex || "" },
          }),
    };
  },
});

export default InlineMath;
