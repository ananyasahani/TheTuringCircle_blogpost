import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EmbedView from "../nodeviews/EmbedView";

/**
 * A block embed for an external URL (gist, CodePen, Vimeo, CodeSandbox…).
 * Only the URL is stored — never provider HTML — and the node view resolves it
 * to an iframe through the allowlist in `embedSrc`. Anything not on the list
 * degrades to a plain link card, so a hostile URL can never become an iframe.
 */

const EMBED_PROVIDERS = [
  {
    test: /^(?:www\.)?gist\.github\.com$/,
    src: (url) => `https://gist.github.com${url.pathname}.pibb`,
  },
  {
    test: /^(?:www\.)?codepen\.io$/,
    src: (url) => `https://codepen.io${url.pathname.replace("/pen/", "/embed/")}`,
  },
  {
    test: /^(?:www\.|player\.)?vimeo\.com$/,
    src: (url) =>
      `https://player.vimeo.com/video/${url.pathname.split("/").filter(Boolean).pop()}`,
  },
  {
    test: /^(?:www\.)?codesandbox\.io$/,
    src: (url) =>
      `https://codesandbox.io${url.pathname.replace("/s/", "/embed/")}`,
  },
  {
    test: /^(?:www\.)?observablehq\.com$/,
    src: (url) => `https://observablehq.com/embed${url.pathname}`,
  },
];

/**
 * Resolve a raw URL to a safe iframe src, or null when the host isn't
 * allowlisted. Always returns null for non-https URLs.
 */
export function embedSrc(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  const provider = EMBED_PROVIDERS.find((entry) => entry.test.test(url.host));
  if (!provider) return null;

  try {
    return provider.src(url);
  } catch {
    return null;
  }
}

export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-src") || "",
        renderHTML: (attributes) => ({ "data-src": attributes.src }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-embed]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-embed": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedView);
  },

  addCommands() {
    return {
      insertEmbed:
        (attributes = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { src: attributes.src || "" },
          }),
    };
  },
});

export default Embed;
