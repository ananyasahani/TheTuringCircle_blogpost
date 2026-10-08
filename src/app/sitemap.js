import { fetchAllPosts } from "@/lib/firestoreRest";
import { getAllPostsStatic } from "@/services/posts.service";
import { toDate } from "@/lib/postDate";
import { siteUrl } from "@/lib/siteUrl";

const STATIC_ROUTES = ["", "/library", "/archives", "/network"];

/**
 * Served at /sitemap.xml. Without it a crawler can only find posts by
 * following links from the home page, which lists a handful — the archive of
 * everything older is effectively unreachable.
 *
 * Signed-in surfaces (/profile, /editor, /login) are deliberately absent;
 * robots.js disallows them too.
 */
export default async function sitemap() {
  const posts = await fetchAllPosts();
  const list = posts.length ? posts : getAllPostsStatic();

  return [
    ...STATIC_ROUTES.map((path) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: path === "" ? "daily" : "weekly",
      priority: path === "" ? 1 : 0.7,
    })),
    ...list.map((post) => ({
      url: `${siteUrl}/post/${post.slug}`,
      lastModified: toDate(post.updatedAt) ?? toDate(post.createdAt) ?? undefined,
      changeFrequency: "monthly",
      priority: 0.9,
    })),
  ];
}
