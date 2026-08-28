import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { InlineMath } from "./extensions/InlineMath";
import { MathBlock } from "./extensions/MathBlock";
import { Embed } from "./extensions/Embed";

const lowlight = createLowlight(common);

/**
 * THE single source of truth for the document schema.
 *
 * Imported by the editor *and* by the published renderer — if these two ever
 * used different extension arrays, saved documents would render differently
 * from how they were written.
 *
 * Note on v3: StarterKit already bundles Link and Underline, so installing
 * @tiptap/extension-link separately would register a duplicate extension.
 * Its built-in codeBlock is switched off here in favour of the lowlight one.
 */
export function buildExtensions({ placeholder = "Tell your story…" } = {}) {
  return [
    StarterKit.configure({
      codeBlock: false,
      heading: { levels: [2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noreferrer noopener", target: "_blank" },
      },
    }),
    Placeholder.configure({
      placeholder: ({ node }) =>
        node.type.name === "heading" ? "Section heading" : placeholder,
      showOnlyWhenEditable: true,
    }),
    Image.configure({ inline: false, allowBase64: false }),
    Youtube.configure({ controls: true, nocookie: true, width: 680, height: 383 }),
    CodeBlockLowlight.configure({ lowlight }),
    InlineMath,
    MathBlock,
    Embed,
  ];
}

/** Extensions for read-only rendering of a published document. */
export function buildReadOnlyExtensions() {
  return buildExtensions({ placeholder: "" });
}

/**
 * Flatten a TipTap document to plain text — used for read-time estimates and
 * for pre-filling the excerpt in the publish dialog.
 */
export function docToPlainText(doc) {
  if (!doc || typeof doc !== "object") return "";
  const parts = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (typeof node.text === "string") parts.push(node.text);
    if (node.attrs?.latex) parts.push(node.attrs.latex);
    if (Array.isArray(node.content)) node.content.forEach(walk);
  };
  walk(doc);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Convert a legacy markdown-ish essay (blank-line separated blocks, `###`
 * headings) into a TipTap document.
 *
 * Without this, opening one of the seeded essays in the editor would show an
 * empty document and the first autosave would write that emptiness over the
 * real text.
 */
export function legacyTextToDoc(text) {
  const content = [];

  String(text ?? "")
    .split("\n\n")
    .forEach((block) => {
      const trimmed = block.trim();
      if (!trimmed) return;

      if (trimmed.startsWith("###")) {
        const [first, ...rest] = trimmed.split("\n");
        content.push({
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: first.replace(/^#{1,6}\s*/, "") }],
        });
        const body = rest.join(" ").trim();
        if (body) {
          content.push({ type: "paragraph", content: [{ type: "text", text: body }] });
        }
        return;
      }

      content.push({ type: "paragraph", content: [{ type: "text", text: trimmed }] });
    });

  if (content.length === 0) content.push({ type: "paragraph" });
  return { type: "doc", content };
}

/** First non-empty paragraph of a TipTap document, for excerpt pre-fill. */
export function docFirstParagraph(doc) {
  if (!doc?.content) return "";
  const paragraph = doc.content.find(
    (node) => node.type === "paragraph" && node.content?.length,
  );
  return paragraph ? docToPlainText(paragraph) : "";
}
