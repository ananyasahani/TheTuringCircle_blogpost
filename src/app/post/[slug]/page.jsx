import { notFound } from "next/navigation";
import { fetchPost, titleText } from "@/lib/firestoreRest";
import { getPostBySlugStatic } from "@/services/posts.service";
import PostView from "./PostView";

/**
 * The post route resolves its post on the SERVER.
 *
 * It used to seed from the bundled essays and fetch on the client, which meant
 * every post written in the editor was served as the not-found card: readers
 * saw it flash, and crawlers and link previews — which never run the fetch —
 * saw nothing else. Resolving here puts the article in the first response,
 * gives each post its own <title> and preview card, and lets a missing post
 * answer with a real 404 instead of a 200 carrying an apology.
 *
 * The bundled essays remain a fallback so the journal still reads before
 * anyone has pressed "Seed posts", and offline.
 */
async function resolve(slug) {
  return (await fetchPost(slug)) ?? getPostBySlugStatic(slug) ?? null;
}

/**
 * Flatten a TipTap document to plain text. Deliberately written out here
 * rather than imported from tiptap-config: that module pulls StarterKit,
 * lowlight and KaTeX with it, none of which belong in the server bundle.
 */
function plainText(node, parts = []) {
  if (!node || typeof node !== "object") return parts;
  if (typeof node.text === "string") parts.push(node.text);
  if (Array.isArray(node.content)) node.content.forEach((child) => plainText(child, parts));
  return parts;
}

/** One or two sentences of the post, for search results and link previews. */
function summarise(post) {
  if (post.excerpt?.trim()) return post.excerpt.trim();
  const body =
    typeof post.content === "string"
      ? post.content.replace(/^###\s*/gm, "")
      : plainText(post.content).join(" ");
  return body.replace(/\s+/g, " ").trim().slice(0, 200);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await resolve(slug);

  if (!post) {
    return { title: "Post not found", robots: { index: false, follow: false } };
  }

  const title = titleText(post);
  const description = summarise(post);
  const url = `/post/${post.slug ?? slug}`;
  const images = post.image ? [{ url: post.image }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images,
      authors: post.author?.name ? [post.author.name] : undefined,
    },
    twitter: {
      card: post.image ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await resolve(slug);

  // A real 404: status code included, so search engines drop the URL rather
  // than indexing a page that says "not found" with a 200.
  if (!post) notFound();

  return <PostView post={{ ...post, slug: post.slug ?? slug }} />;
}
