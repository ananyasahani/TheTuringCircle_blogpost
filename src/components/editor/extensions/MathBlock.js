import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import MathBlockView from "../nodeviews/MathBlockView";

/**
 * Full-width display maths. Same contract as InlineMath: the raw `latex`
 * string is authoritative and is never discarded, KaTeX renders it in
 * displayMode, and the node view offers a source textarea with live preview.
 */
export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

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
    return [{ tag: "div[data-math-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-math-block": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockView);
  },

  addCommands() {
    return {
      insertMathBlock:
        (attributes = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { latex: attributes.latex || "" },
          }),
    };
  },
});

export default MathBlock;
